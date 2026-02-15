import { PlatformChartsPage } from '../PlatformChartsPage';

export default function InstagramPublicReportPage() {
  return (
    <PlatformChartsPage
      platform={{
        platformKey: 'INSTAGRAM_PUBLIC',
        label: 'Instagram Public',
        gradient: 'from-purple-500 to-pink-500',
        headerGradient: 'from-purple-500/20 to-pink-500/15',
        borderColor: 'var(--platform-instagram)',
        description: 'Instagram publikus profil elemzés (versenytárs)',
      }}
    />
  );
}
