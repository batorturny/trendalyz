'use client';

import { notFound, useParams } from 'next/navigation';
import { ClientPlatformPage } from '../ClientPlatformPage';
import { PlatformIcon } from '@/components/PlatformIcon';
import { CLIENT_PLATFORM_CONFIGS } from '@/lib/platformConfigs';

export default function PlatformDashboardPage() {
  const params = useParams<{ platform: string }>();
  const config = CLIENT_PLATFORM_CONFIGS[params.platform];

  if (!config) {
    notFound();
  }

  return (
    <ClientPlatformPage
      platform={{
        ...config,
        icon: <PlatformIcon platform={config.platformIcon} className="w-14 h-14" />,
      }}
    />
  );
}
