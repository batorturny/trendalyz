import { PlatformChartsPage } from '../PlatformChartsPage';

export default function FacebookReportPage() {
  return (
    <PlatformChartsPage
      platform={{
        platformKey: 'FACEBOOK_ORGANIC',
        label: 'Facebook',
        gradient: 'from-blue-600 to-blue-400',
        headerGradient: 'from-blue-600/20 to-blue-400/15',
        borderColor: '#3b82f6',
        description: 'Facebook oldal havi riport generálása',
      }}
    />
  );
}
