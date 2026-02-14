import { PlatformChartsPage } from '../PlatformChartsPage';

export default function YouTubeReportPage() {
  return (
    <PlatformChartsPage
      platform={{
        platformKey: 'YOUTUBE',
        label: 'YouTube',
        gradient: 'from-red-600 to-red-400',
        headerGradient: 'from-red-600/20 to-red-400/15',
        borderColor: '#ef4444',
        description: 'YouTube csatorna havi riport generálása',
      }}
    />
  );
}
