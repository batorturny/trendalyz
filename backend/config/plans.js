// ============================================
// SUBSCRIPTION PLANS CONFIGURATION
// ============================================

const PLANS = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    companyLimit: 1,
    prices: { eur: 0, huf: 0 },
    stripePriceIds: { eur: null, huf: null },
    features: [
      '1 cég kezelése',
      'Alap riportok',
    ],
  },
  STARTER: {
    tier: 'STARTER',
    name: 'Starter',
    companyLimit: 5,
    prices: { eur: 55, huf: 22000 },
    stripePriceIds: {
      eur: process.env.STRIPE_PRICE_STARTER_EUR || null,
      huf: process.env.STRIPE_PRICE_STARTER_HUF || null,
    },
    features: [
      'Max 5 cég kezelése',
      'Összes platform riport',
      'PDF export',
      'Email riport küldés',
    ],
  },
  GROWTH: {
    tier: 'GROWTH',
    name: 'Growth',
    companyLimit: 10,
    popular: true,
    prices: { eur: 99, huf: 39000 },
    stripePriceIds: {
      eur: process.env.STRIPE_PRICE_GROWTH_EUR || null,
      huf: process.env.STRIPE_PRICE_GROWTH_HUF || null,
    },
    features: [
      'Max 10 cég kezelése',
      'Összes platform riport',
      'PDF export',
      'Email riport küldés',
      'Kiemelt support',
    ],
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    name: 'Professional',
    companyLimit: 25,
    prices: { eur: 249, huf: 99000 },
    stripePriceIds: {
      eur: process.env.STRIPE_PRICE_PROFESSIONAL_EUR || null,
      huf: process.env.STRIPE_PRICE_PROFESSIONAL_HUF || null,
    },
    features: [
      'Max 25 cég kezelése',
      'Összes platform riport',
      'PDF export',
      'Email riport küldés',
      'Kiemelt support',
      'API hozzáférés',
    ],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    companyLimit: 999,
    prices: { eur: null, huf: null },
    stripePriceIds: { eur: null, huf: null },
    features: [
      'Korlátlan cég kezelése',
      'Összes platform riport',
      'PDF export',
      'Email riport küldés',
      'Dedikált support',
      'API hozzáférés',
      'Egyedi integráció',
    ],
  },
};

function getPlanByTier(tier) {
  return PLANS[tier] || PLANS.FREE;
}

function getPlanByPriceId(priceId) {
  if (!priceId) return null;
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceIds.eur === priceId || plan.stripePriceIds.huf === priceId) {
      return plan;
    }
  }
  return null;
}

module.exports = { PLANS, getPlanByTier, getPlanByPriceId };
