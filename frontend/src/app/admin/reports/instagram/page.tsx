import { PlatformChartsPage } from '../PlatformChartsPage';

export default function InstagramReportPage() {
  return (
    <PlatformChartsPage
      platform={{
        platformKey: 'INSTAGRAM_ORGANIC',
        label: 'Instagram',
        gradient: 'from-purple-500 to-pink-500',
        headerGradient: 'from-purple-500/20 to-pink-500/15',
        borderColor: '#a855f7',
        description: 'Instagram havi riport generálása',
      }}
    />
  );
}
