import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CompaniesContent } from './CompaniesContent';
import { CompanyLimitToast } from './CompanyLimitToast';
import { SubscriptionOverlay } from './SubscriptionOverlay';

export default async function CompaniesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login');

  const billingEnabled = process.env.ENABLE_BILLING === 'true';

  const [adminUser, subscription, companies] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { windsorApiKeyEnc: true },
    }),
    billingEnabled
      ? prisma.subscription.findUnique({
          where: { userId: session.user.id },
          select: { companyLimit: true, tier: true, status: true },
        })
      : Promise.resolve(null),
    prisma.company.findMany({
      where: { adminId: session.user.id },
      include: {
        _count: { select: { users: true } },
        connections: {
          select: { provider: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);
  const hasWindsorKey = !!adminUser?.windsorApiKeyEnc;
  const companyLimit = billingEnabled ? (subscription?.companyLimit ?? 1) : null;
  const subscriptionStatus = subscription?.status || null;
  const subscriptionTier = subscription?.tier || 'FREE';
  const isOverLimit = companyLimit !== null && companies.length > companyLimit;
  const isAtLimit = companyLimit !== null && companies.length >= companyLimit;
  const hasInactiveSubscription = billingEnabled && subscriptionStatus && !['TRIALING', 'ACTIVE'].includes(subscriptionStatus);

  // Serialize companies for client component
  const companiesData = companies.map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    _count: c._count,
    connections: c.connections,
  }));

  return (
    <div className="p-4 md:p-8 relative">
      {(isOverLimit || hasInactiveSubscription) && (
        <SubscriptionOverlay
          companyCount={companies.length}
          companyLimit={companyLimit ?? 1}
          tier={subscriptionTier}
          isOverLimit={!!isOverLimit}
          hasInactiveSubscription={!!hasInactiveSubscription}
        />
      )}

      <CompaniesContent
        companies={companiesData}
        hasWindsorKey={hasWindsorKey}
        companyLimit={companyLimit}
        isOverLimit={!!isOverLimit}
        isAtLimit={!!isAtLimit}
      />

      {companyLimit !== null && (
        <CompanyLimitToast companyCount={companies.length} companyLimit={companyLimit} />
      )}
    </div>
  );
}
