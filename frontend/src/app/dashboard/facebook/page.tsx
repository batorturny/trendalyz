import { ClientPlatformPage } from '../ClientPlatformPage';
import { PlatformIcon } from '@/components/PlatformIcon';

export default function FacebookDashboardPage() {
  return (
    <ClientPlatformPage
      platform={{
        platformKey: 'FACEBOOK_ORGANIC',
        label: 'Facebook',
        icon: <PlatformIcon platform="facebook" className="w-14 h-14" />,
        gradient: 'from-blue-600 to-blue-400',
        headerGradient: 'from-blue-600/20 to-blue-400/15',
        borderColor: '#3b82f6',
      }}
    />
  );
}
