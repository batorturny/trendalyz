import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ClientPlatformPage } from '../ClientPlatformPage';
import { PlatformIcon } from '@/components/PlatformIcon';
import { CLIENT_PLATFORM_CONFIGS } from '@/lib/platformConfigs';

export default async function PlatformDashboardPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform } = await params;
  const config = CLIENT_PLATFORM_CONFIGS[platform];

  if (!config) {
    notFound();
  }

  // Fetch dashboardConfig and dashboardNotes for this company
  const session = await auth();
  let platformDashboardConfig: { kpis: string[]; charts: string[] } | null = null;
  let platformNote: string | null = null;

  if (session?.user?.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { dashboardConfig: true, dashboardNotes: true },
    });
    const fullConfig = company?.dashboardConfig as Record<string, { kpis: string[]; charts: string[] }> | null;
    platformDashboardConfig = fullConfig?.[config.platformKey] ?? null;

    const fullNotes = company?.dashboardNotes as Record<string, string> | null;
    platformNote = fullNotes?.[config.platformKey] ?? null;
  }

  return (
    <ClientPlatformPage
      platform={{
        ...config,
        icon: <PlatformIcon platform={config.platformIcon as 'tiktok' | 'facebook' | 'instagram' | 'youtube'} className="w-14 h-14" />,
      }}
      dashboardConfig={platformDashboardConfig}
      adminNote={platformNote}
    />
  );
}
