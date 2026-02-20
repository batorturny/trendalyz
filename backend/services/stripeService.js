// ============================================
// STRIPE BILLING SERVICE
// ============================================

const Stripe = require('stripe');
const prisma = require('../lib/prisma');
const { PLANS, getPlanByTier, getPlanByPriceId } = require('../config/plans');

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

async function getOrCreateCustomer(userId, email, name) {
  const existing = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  // Create subscription record with FREE tier
  await prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId: customer.id,
      tier: 'FREE',
      status: 'ACTIVE',
      companyLimit: 1,
    },
  });

  return customer.id;
}

// ============================================
// CHECKOUT & PORTAL
// ============================================

async function createCheckoutSession({ userId, email, name, tier, currency, successUrl, cancelUrl }) {
  const plan = getPlanByTier(tier);
  if (!plan || !plan.stripePriceIds[currency]) {
    throw new Error(`Érvénytelen csomag vagy pénznem: ${tier}/${currency}`);
  }

  const stripeCustomerId = await getOrCreateCustomer(userId, email, name);

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: plan.stripePriceIds[currency],
      quantity: 1,
    }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId, tier },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, tier },
  });

  return { sessionId: session.id, url: session.url };
}

async function createPortalSession(stripeCustomerId, returnUrl) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return { url: session.url };
}

// ============================================
// SUBSCRIPTION QUERIES
// ============================================

async function getSubscription(userId) {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
  });
  if (!sub) return null;

  const plan = getPlanByTier(sub.tier);
  return { ...sub, plan };
}

async function getInvoices(stripeCustomerId, limit = 10) {
  const invoices = await stripe.invoices.list({
    customer: stripeCustomerId,
    limit,
  });

  return invoices.data.map(inv => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    amount: inv.amount_paid,
    currency: inv.currency,
    created: new Date(inv.created * 1000).toISOString(),
    pdfUrl: inv.invoice_pdf,
    hostedUrl: inv.hosted_invoice_url,
  }));
}

// ============================================
// SUBSCRIPTION MODIFICATIONS
// ============================================

async function cancelSubscription(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeSubscriptionId) throw new Error('Nincs aktív előfizetés');

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });

  return { success: true };
}

async function reactivateSubscription(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeSubscriptionId) throw new Error('Nincs aktív előfizetés');

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: false },
  });

  return { success: true };
}

async function changePlan(userId, newTier, currency) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeSubscriptionId) throw new Error('Nincs aktív előfizetés');

  const newPlan = getPlanByTier(newTier);
  if (!newPlan || !newPlan.stripePriceIds[currency]) {
    throw new Error(`Érvénytelen csomag: ${newTier}/${currency}`);
  }

  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    items: [{
      id: stripeSub.items.data[0].id,
      price: newPlan.stripePriceIds[currency],
    }],
    proration_behavior: 'create_prorations',
    metadata: { tier: newTier },
  });

  await prisma.subscription.update({
    where: { userId },
    data: {
      tier: newTier,
      stripePriceId: newPlan.stripePriceIds[currency],
      companyLimit: newPlan.companyLimit,
      currency,
    },
  });

  return { success: true };
}

// ============================================
// COMPANY LIMIT CHECK
// ============================================

async function canAddCompany(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return { allowed: true, current: 0, limit: 1 }; // no billing = allow

  const companyCount = await prisma.company.count({ where: { adminId: userId } });
  return {
    allowed: companyCount < sub.companyLimit,
    current: companyCount,
    limit: sub.companyLimit,
    tier: sub.tier,
  };
}

async function getUsage(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const companyCount = await prisma.company.count({ where: { adminId: userId } });
  return {
    companies: companyCount,
    limit: sub?.companyLimit || 1,
    tier: sub?.tier || 'FREE',
  };
}

// ============================================
// WEBHOOK HANDLERS
// ============================================

async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('[Stripe Webhook] No userId in subscription metadata');
    return;
  }

  const plan = getPlanByPriceId(subscription.items.data[0]?.price?.id);
  const tier = plan?.tier || 'STARTER';

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price?.id,
      tier,
      status: mapStripeStatus(subscription.status),
      companyLimit: plan?.companyLimit || 5,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    create: {
      userId,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price?.id,
      tier,
      status: mapStripeStatus(subscription.status),
      companyLimit: plan?.companyLimit || 5,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  console.log(`[Stripe] Subscription created: userId=${userId}, tier=${tier}, status=${subscription.status}`);
}

async function handleSubscriptionUpdated(subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!sub) {
    // Try fallback via metadata
    return handleSubscriptionCreated(subscription);
  }

  const plan = getPlanByPriceId(subscription.items.data[0]?.price?.id);

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      stripePriceId: subscription.items.data[0]?.price?.id,
      tier: plan?.tier || sub.tier,
      status: mapStripeStatus(subscription.status),
      companyLimit: plan?.companyLimit || sub.companyLimit,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  console.log(`[Stripe] Subscription updated: id=${subscription.id}, status=${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!sub) return;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      tier: 'FREE',
      companyLimit: 1,
      stripeSubscriptionId: null,
      stripePriceId: null,
    },
  });

  console.log(`[Stripe] Subscription deleted: id=${subscription.id}`);
}

async function handleInvoicePaid(invoice) {
  console.log(`[Stripe] Invoice paid: ${invoice.id}, amount=${invoice.amount_paid}`);
}

async function handlePaymentFailed(invoice) {
  console.error(`[Stripe] Payment failed: ${invoice.id}, customer=${invoice.customer}`);
}

// ============================================
// HELPERS
// ============================================

function mapStripeStatus(stripeStatus) {
  const statusMap = {
    trialing: 'TRIALING',
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    unpaid: 'UNPAID',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'CANCELED',
  };
  return statusMap[stripeStatus] || 'ACTIVE';
}

module.exports = {
  stripe,
  getOrCreateCustomer,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  getInvoices,
  cancelSubscription,
  reactivateSubscription,
  changePlan,
  canAddCompany,
  getUsage,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handlePaymentFailed,
};
