import { PlatformChartsPage } from '../PlatformChartsPage';

export default function TikTokAdsReportPage() {
  return (
    <PlatformChartsPage
      platform={{
        platformKey: 'TIKTOK_ADS',
        label: 'TikTok Ads',
        gradient: 'from-pink-500 to-red-500',
        headerGradient: 'from-pink-500/20 to-red-500/15',
        borderColor: 'var(--platform-tiktok)',
        description: 'TikTok fizetett hirdetési riport',
      }}
    />
  );
}
