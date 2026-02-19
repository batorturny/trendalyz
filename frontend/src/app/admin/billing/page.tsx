import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BillingOverview } from './BillingOverview';
import { PlanSelector } from './PlanSelector';
import { BillingHistory } from './BillingHistory';
import { CouponCode } from './CouponCode';

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login');

  const [subscription, companyCount] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.company.count({
      where: { adminId: session.user.id },
    }),
  ]);

  const subData = subscription
    ? {
        tier: subscription.tier,
        status: subscription.status,
        companyLimit: subscription.companyLimit,
        currency: subscription.currency,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
        trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      }
    : null;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Számlázás</h1>
        <p className="text-[var(--text-secondary)] mt-1">Előfizetés és csomagok kezelése</p>
      </header>

      <BillingOverview
        subscription={subData}
        companyCount={companyCount}
      />

      <PlanSelector
        currentTier={subData?.tier || 'FREE'}
        currentCurrency={subData?.currency || 'eur'}
        hasSubscription={!!subData?.stripeSubscriptionId}
      />

      <BillingHistory
        hasCustomer={!!subData?.stripeCustomerId}
      />

      <CouponCode />
    </div>
  );
}
