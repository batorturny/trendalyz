import { ClientPlatformPage } from '../ClientPlatformPage';
import { PlatformIcon } from '@/components/PlatformIcon';

export default function InstagramDashboardPage() {
  return (
    <ClientPlatformPage
      platform={{
        platformKey: 'INSTAGRAM_ORGANIC',
        label: 'Instagram',
        icon: <PlatformIcon platform="instagram" className="w-14 h-14" />,
        gradient: 'from-purple-500 to-pink-500',
        headerGradient: 'from-purple-500/20 to-pink-500/15',
        borderColor: '#a855f7',
      }}
    />
  );
}
