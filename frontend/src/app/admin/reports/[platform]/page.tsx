import { notFound } from 'next/navigation';
import { PlatformChartsPage } from '../PlatformChartsPage';
import { ADMIN_PLATFORM_CONFIGS } from '@/lib/platformConfigs';

export default async function PlatformReportPage({ params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const config = ADMIN_PLATFORM_CONFIGS[platform];

  if (!config) {
    notFound();
  }

  return <PlatformChartsPage platform={config} />;
}
