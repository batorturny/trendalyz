import { auth } from '@/lib/auth';
import { sendEmail, reportEmailHtml } from '@/lib/email';
import { NextResponse } from 'next/server';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:4000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// KPI helper functions (same as PlatformChartsPage)
interface ChartData {
  key: string;
  title: string;
  type: string;
  color: string;
  data: { labels: string[]; series: { name: string; data: unknown[] }[] };
  empty: boolean;
  error?: string;
}

function sumSeries(chart: ChartData | undefined, seriesIndex = 0): number {
  if (!chart || chart.empty || !chart.data?.series?.[seriesIndex]?.data) return 0;
  const data = chart.data.series[seriesIndex].data as number[];
  return data.reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
}

function lastValue(chart: ChartData | undefined, seriesIndex = 0): number {
  if (!chart || chart.empty || !chart.data?.series?.[seriesIndex]?.data) return 0;
  const data = chart.data.series[seriesIndex].data as number[];
  for (let i = data.length - 1; i >= 0; i--) {
    if (typeof data[i] === 'number' && data[i] > 0) return data[i];
  }
  return 0;
}

function avgSeries(chart: ChartData | undefined, seriesIndex = 0): number {
  if (!chart || chart.empty || !chart.data?.series?.[seriesIndex]?.data) return 0;
  const data = (chart.data.series[seriesIndex].data as number[]).filter(v => typeof v === 'number');
  if (data.length === 0) return 0;
  return data.reduce((s, v) => s + v, 0) / data.length;
}

function tableCount(chart: ChartData | undefined): number {
  if (!chart || chart.empty || !chart.data?.series?.[0]?.data) return 0;
  return (chart.data.series[0].data as unknown[]).length;
}

function find(results: ChartData[], key: string): ChartData | undefined {
  return results.find(c => c.key === key);
}

interface KPI { label: string; value: string | number }

const PLATFORM_CHART_KEYS: Record<string, string[]> = {
  TIKTOK_ORGANIC: ['followers_growth', 'tt_total_followers', 'profile_views', 'daily_likes', 'daily_comments', 'daily_shares', 'engagement_rate', 'all_videos', 'tt_bio_link_clicks'],
  TIKTOK_ADS: ['ttads_spend_trend', 'ttads_impressions_clicks', 'ttads_ctr_trend', 'ttads_cpc_cpm', 'ttads_conversions', 'ttads_cost_per_conversion'],
  FACEBOOK_ORGANIC: ['fb_page_reach', 'fb_page_fans', 'fb_engagement', 'fb_all_posts', 'fb_follows_trend', 'fb_video_views'],
  INSTAGRAM_ORGANIC: ['ig_reach', 'ig_follower_growth', 'ig_engagement', 'ig_profile_activity', 'ig_all_media', 'ig_daily_followers', 'ig_save_rate', 'ig_story_overview'],
  YOUTUBE: ['yt_subscribers_growth', 'yt_views_trend', 'yt_watch_time', 'yt_daily_engagement', 'yt_engagement_rate', 'yt_all_videos', 'yt_avg_view_pct', 'yt_playlist_adds'],
};

function extractKPIs(platformKey: string, results: ChartData[]): KPI[] {
  switch (platformKey) {
    case 'TIKTOK_ORGANIC': {
      const followers = find(results, 'followers_growth');
      const profileViews = find(results, 'profile_views');
      const likes = find(results, 'daily_likes');
      const comments = find(results, 'daily_comments');
      const shares = find(results, 'daily_shares');
      const videos = find(results, 'all_videos');
      const bioClicks = find(results, 'tt_bio_link_clicks');
      const totalFollowersChart = find(results, 'tt_total_followers');

      const totalLikes = sumSeries(likes);
      const totalComments = sumSeries(comments);
      const totalShares = sumSeries(shares);
      const vidCount = tableCount(videos);
      return [
        { label: 'Össz. követőnövekedés', value: sumSeries(followers) },
        { label: 'Összes követő', value: lastValue(totalFollowersChart) },
        { label: 'Profilnézetek', value: sumSeries(profileViews) },
        { label: 'Like-ok', value: totalLikes },
        { label: 'Kommentek', value: totalComments },
        { label: 'Megosztások', value: totalShares },
        { label: 'Összes interakció', value: totalLikes + totalComments + totalShares },
        { label: 'Videók száma', value: vidCount },
        { label: 'Bio link kattintás', value: sumSeries(bioClicks) },
      ];
    }
    case 'TIKTOK_ADS': {
      const spend = find(results, 'ttads_spend_trend');
      const impClicks = find(results, 'ttads_impressions_clicks');
      const ctr = find(results, 'ttads_ctr_trend');
      const cpcCpm = find(results, 'ttads_cpc_cpm');
      const conversions = find(results, 'ttads_conversions');
      const costConv = find(results, 'ttads_cost_per_conversion');
      return [
        { label: 'Költés', value: sumSeries(spend) },
        { label: 'Impressziók', value: sumSeries(impClicks, 0) },
        { label: 'Kattintások', value: sumSeries(impClicks, 1) },
        { label: 'CTR%', value: `${avgSeries(ctr).toFixed(2)}%` },
        { label: 'CPC', value: `${avgSeries(cpcCpm, 0).toFixed(2)}` },
        { label: 'CPM', value: `${avgSeries(cpcCpm, 1).toFixed(2)}` },
        { label: 'Konverziók', value: sumSeries(conversions) },
        { label: 'Költség/konverzió', value: `${avgSeries(costConv).toFixed(2)}` },
      ];
    }
    case 'FACEBOOK_ORGANIC': {
      const reach = find(results, 'fb_page_reach');
      const fans = find(results, 'fb_page_fans');
      const engagement = find(results, 'fb_engagement');
      const posts = find(results, 'fb_all_posts');
      const follows = find(results, 'fb_follows_trend');
      const videoViews = find(results, 'fb_video_views');
      return [
        { label: 'Követők', value: lastValue(fans) },
        { label: 'Elérés', value: sumSeries(reach, 0) },
        { label: 'Impressziók', value: sumSeries(reach, 1) },
        { label: 'Reakciók', value: sumSeries(engagement, 0) },
        { label: 'Kommentek', value: sumSeries(engagement, 1) },
        { label: 'Megosztások', value: sumSeries(engagement, 2) },
        { label: 'Posztok', value: tableCount(posts) },
        { label: 'Napi új követők', value: sumSeries(follows, 0) },
        { label: 'Videó nézések', value: sumSeries(videoViews) },
      ];
    }
    case 'INSTAGRAM_ORGANIC': {
      const reach = find(results, 'ig_reach');
      const followers = find(results, 'ig_follower_growth');
      const engagement = find(results, 'ig_engagement');
      const profile = find(results, 'ig_profile_activity');
      const media = find(results, 'ig_all_media');
      const dailyFollowers = find(results, 'ig_daily_followers');
      const saveRate = find(results, 'ig_save_rate');
      const storyOverview = find(results, 'ig_story_overview');
      return [
        { label: 'Követők', value: lastValue(followers) },
        { label: 'Elérés', value: sumSeries(reach, 0) },
        { label: 'Impressziók', value: sumSeries(reach, 1) },
        { label: 'Like-ok', value: sumSeries(engagement, 0) },
        { label: 'Kommentek', value: sumSeries(engagement, 1) },
        { label: 'Megosztások', value: sumSeries(engagement, 2) },
        { label: 'Mentések', value: sumSeries(engagement, 3) },
        { label: 'Profilnézetek', value: sumSeries(profile, 0) },
        { label: 'Tartalmak', value: tableCount(media) },
        { label: 'Napi új követők', value: sumSeries(dailyFollowers) },
        { label: 'Mentési arány', value: `${avgSeries(saveRate).toFixed(2)}%` },
        { label: 'Story elérés', value: sumSeries(storyOverview, 0) },
      ];
    }
    case 'YOUTUBE': {
      const subs = find(results, 'yt_subscribers_growth');
      const views = find(results, 'yt_views_trend');
      const watchTime = find(results, 'yt_watch_time');
      const engagement = find(results, 'yt_daily_engagement');
      const er = find(results, 'yt_engagement_rate');
      const videos = find(results, 'yt_all_videos');
      const avgViewPct = find(results, 'yt_avg_view_pct');
      const playlistAdds = find(results, 'yt_playlist_adds');
      return [
        { label: 'Új feliratkozók', value: sumSeries(subs) },
        { label: 'Megtekintések', value: sumSeries(views) },
        { label: 'Nézési idő (perc)', value: sumSeries(watchTime) },
        { label: 'Like-ok', value: sumSeries(engagement, 0) },
        { label: 'Kommentek', value: sumSeries(engagement, 1) },
        { label: 'Megosztások', value: sumSeries(engagement, 2) },
        { label: 'ER%', value: `${avgSeries(er).toFixed(2)}%` },
        { label: 'Videók', value: tableCount(videos) },
        { label: 'Átl. nézési %', value: `${avgSeries(avgViewPct).toFixed(1)}%` },
        { label: 'Playlist hozzáadás', value: sumSeries(playlistAdds) },
      ];
    }
    default:
      return [];
  }
}

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK_ORGANIC: 'TikTok',
  TIKTOK_ADS: 'TikTok Ads',
  FACEBOOK_ORGANIC: 'Facebook',
  INSTAGRAM_ORGANIC: 'Instagram',
  YOUTUBE: 'YouTube',
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Csak adminisztrátor küldhet riport emailt' }, { status: 403 });
    }

    const { companyId, companyName, platform, month, recipientEmail } = await req.json();

    if (!companyId || !platform || !month || !recipientEmail) {
      return NextResponse.json({ error: 'Hiányzó paraméterek' }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return NextResponse.json({ error: 'Érvénytelen email cím' }, { status: 400 });
    }

    // Compute date range from month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = `${month}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    // Get chart keys for this platform
    const chartKeys = PLATFORM_CHART_KEYS[platform];
    if (!chartKeys) {
      return NextResponse.json({ error: `Ismeretlen platform: ${platform}` }, { status: 400 });
    }

    // Fetch chart data from Express backend
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (INTERNAL_API_KEY) {
      headers['Authorization'] = `Bearer ${INTERNAL_API_KEY}`;
    }
    headers['X-User-Id'] = session.user.id;
    headers['X-User-Role'] = session.user.role;

    const chartsResponse = await fetch(`${EXPRESS_API_URL}/api/charts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountId: companyId,
        startDate,
        endDate,
        charts: chartKeys.map(key => ({ key })),
      }),
    });

    if (!chartsResponse.ok) {
      const errData = await chartsResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error || 'Nem sikerült lekérni a riport adatokat' },
        { status: 500 }
      );
    }

    const chartsData = await chartsResponse.json();
    const charts: ChartData[] = chartsData.charts || [];

    // Extract KPIs
    const kpis = extractKPIs(platform, charts);

    if (kpis.length === 0) {
      return NextResponse.json({ error: 'Nincs elérhető adat ehhez a hónaphoz' }, { status: 404 });
    }

    // Build and send email
    const html = reportEmailHtml({
      companyName: companyName || chartsData.account?.name || 'Cég',
      platformLabel: PLATFORM_LABELS[platform] || platform,
      month,
      kpis,
    });

    const result = await sendEmail({
      to: recipientEmail,
      subject: `${PLATFORM_LABELS[platform] || platform} riport — ${companyName || 'Cég'} — ${month}`,
      html,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Email küldés sikertelen' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sentTo: recipientEmail });
  } catch (error) {
    console.error('[REPORT-EMAIL]', error);
    return NextResponse.json({ error: 'Szerverhiba az email küldésnél' }, { status: 500 });
  }
}
