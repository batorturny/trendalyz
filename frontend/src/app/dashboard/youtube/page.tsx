import { ClientPlatformPage } from '../ClientPlatformPage';
import { PlatformIcon } from '@/components/PlatformIcon';

export default function YouTubeDashboardPage() {
  return (
    <ClientPlatformPage
      platform={{
        platformKey: 'YOUTUBE',
        label: 'YouTube',
        icon: <PlatformIcon platform="youtube" className="w-14 h-14" />,
        gradient: 'from-red-600 to-red-400',
        headerGradient: 'from-red-600/20 to-red-400/15',
        borderColor: '#ef4444',
      }}
    />
  );
}
