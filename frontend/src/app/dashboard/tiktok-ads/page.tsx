import { ClientPlatformPage } from '../ClientPlatformPage';
import { PlatformIcon } from '@/components/PlatformIcon';

export default function TikTokAdsDashboardPage() {
  return (
    <ClientPlatformPage
      platform={{
        platformKey: 'TIKTOK_ADS',
        label: 'TikTok Ads',
        icon: <PlatformIcon platform="tiktok" className="w-14 h-14" />,
        gradient: 'from-pink-500 to-red-500',
        headerGradient: 'from-pink-500/20 to-red-500/15',
        borderColor: '#ff2d55',
      }}
    />
  );
}
