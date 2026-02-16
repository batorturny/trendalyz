import { ChartData, ChartDefinition } from '@/lib/api';

// ===== KPI helpers =====

export function sumSeries(chart: ChartData | undefined, seriesIndex = 0): number {
  if (!chart || chart.empty || !chart.data?.series?.[seriesIndex]?.data) return 0;
  const data = chart.data.series[seriesIndex].data as number[];
  return data.reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
}

export function lastValue(chart: ChartData | undefined, seriesIndex = 0): number {
  if (!chart || chart.empty || !chart.data?.series?.[seriesIndex]?.data) return 0;
  const data = chart.data.series[seriesIndex].data as number[];
  for (let i = data.length - 1; i >= 0; i--) {
    if (typeof data[i] === 'number' && data[i] > 0) return data[i];
  }
  return 0;
}

export function avgSeries(chart: ChartData | undefined, seriesIndex = 0): number {
  if (!chart || chart.empty || !chart.data?.series?.[seriesIndex]?.data) return 0;
  const data = (chart.data.series[seriesIndex].data as number[]).filter(v => typeof v === 'number');
  if (data.length === 0) return 0;
  return data.reduce((s, v) => s + v, 0) / data.length;
}

export function tableCount(chart: ChartData | undefined): number {
  if (!chart || chart.empty || !chart.data?.series?.[0]?.data) return 0;
  return (chart.data.series[0].data as unknown[]).length;
}

export function findChart(results: ChartData[], key: string): ChartData | undefined {
  return results.find(c => c.key === key);
}

// ===== KPI extraction =====

export interface KPI {
  label: string;
  value: string | number;
  change?: number | null;
}

export function extractKPIs(platformKey: string, results: ChartData[]): KPI[] {
  switch (platformKey) {
    case 'TIKTOK_ADS': {
      const spend = findChart(results, 'ttads_spend_trend');
      const impClicks = findChart(results, 'ttads_impressions_clicks');
      const ctr = findChart(results, 'ttads_ctr_trend');
      const cpcCpm = findChart(results, 'ttads_cpc_cpm');
      const conversions = findChart(results, 'ttads_conversions');
      const costConv = findChart(results, 'ttads_cost_per_conversion');
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
      const reach = findChart(results, 'fb_page_reach');
      const fans = findChart(results, 'fb_page_fans');
      const engagement = findChart(results, 'fb_engagement');
      const posts = findChart(results, 'fb_all_posts');
      const follows = findChart(results, 'fb_follows_trend');
      const videoViews = findChart(results, 'fb_video_views');
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
      const reach = findChart(results, 'ig_reach');
      const followers = findChart(results, 'ig_follower_growth');
      const engagement = findChart(results, 'ig_engagement');
      const profile = findChart(results, 'ig_profile_activity');
      const media = findChart(results, 'ig_all_media');
      const dailyFollowers = findChart(results, 'ig_daily_followers');
      const saveRate = findChart(results, 'ig_save_rate');
      const storyOverview = findChart(results, 'ig_story_overview');
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
    case 'INSTAGRAM_PUBLIC': {
      const engagement = findChart(results, 'igpub_engagement_overview');
      const avgEng = findChart(results, 'igpub_avg_engagement');
      const allMedia = findChart(results, 'igpub_all_media');
      return [
        { label: 'Like-ok', value: sumSeries(engagement, 0) },
        { label: 'Kommentek', value: sumSeries(engagement, 1) },
        { label: 'Átl. like/poszt', value: `${avgSeries(avgEng, 0).toFixed(1)}` },
        { label: 'Átl. komment/poszt', value: `${avgSeries(avgEng, 1).toFixed(1)}` },
        { label: 'Tartalmak', value: tableCount(allMedia) },
      ];
    }
    case 'YOUTUBE': {
      const subs = findChart(results, 'yt_subscribers_growth');
      const views = findChart(results, 'yt_views_trend');
      const watchTime = findChart(results, 'yt_watch_time');
      const engagement = findChart(results, 'yt_daily_engagement');
      const er = findChart(results, 'yt_engagement_rate');
      const videos = findChart(results, 'yt_all_videos');
      const avgViewPct = findChart(results, 'yt_avg_view_pct');
      const playlistAdds = findChart(results, 'yt_playlist_adds');
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

export function mergeKPIs(allKpis: KPI[][]): KPI[] {
  if (allKpis.length === 0) return [];
  if (allKpis.length === 1) return allKpis[0];

  const merged: KPI[] = allKpis[0].map(kpi => ({ ...kpi }));

  for (let i = 1; i < allKpis.length; i++) {
    const row = allKpis[i];
    for (let j = 0; j < merged.length && j < row.length; j++) {
      const mVal = merged[j].value;
      const rVal = row[j].value;
      if (typeof mVal === 'number' && typeof rVal === 'number') {
        merged[j].value = mVal + rVal;
      } else if (typeof mVal === 'string' && mVal.endsWith('%') && typeof rVal === 'string' && rVal.endsWith('%')) {
        const a = parseFloat(mVal);
        const b = parseFloat(rVal);
        merged[j].value = `${((a * i + b) / (i + 1)).toFixed(2)}%`;
      }
    }
  }

  return merged;
}

/**
 * Aggregate KPIs from multiple months.
 * number values → sum
 * string values ending with '%' → average
 * string values not ending with '%' → sum (parse as number)
 */
export function aggregateMonthlyKPIs(allMonthKpis: KPI[][]): KPI[] {
  if (allMonthKpis.length === 0) return [];
  if (allMonthKpis.length === 1) return allMonthKpis[0];

  const count = allMonthKpis.length;
  const merged: KPI[] = allMonthKpis[0].map(kpi => ({ ...kpi }));

  for (let i = 1; i < count; i++) {
    const row = allMonthKpis[i];
    for (let j = 0; j < merged.length && j < row.length; j++) {
      const mVal = merged[j].value;
      const rVal = row[j].value;

      if (typeof mVal === 'number' && typeof rVal === 'number') {
        // Sum numeric values
        merged[j].value = mVal + rVal;
      } else if (typeof mVal === 'string' && typeof rVal === 'string') {
        const mNum = parseFloat(mVal);
        const rNum = parseFloat(rVal);
        if (!isNaN(mNum) && !isNaN(rNum)) {
          if (mVal.endsWith('%') && rVal.endsWith('%')) {
            // Running sum for now, we'll average at the end
            merged[j].value = `${(mNum + rNum).toFixed(2)}%`;
          } else {
            merged[j].value = `${(mNum + rNum).toFixed(2)}`;
          }
        }
      }
    }
  }

  // Now average the percentage values
  for (let j = 0; j < merged.length; j++) {
    const val = merged[j].value;
    if (typeof val === 'string' && val.endsWith('%')) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        merged[j].value = `${(num / count).toFixed(2)}%`;
      }
    }
  }

  // Remove change percentages for multi-month (not meaningful)
  merged.forEach(kpi => { kpi.change = undefined; });

  return merged;
}

/**
 * Generate per-month date ranges from an end month and period count.
 * Returns array of { startDate, endDate, month } objects, oldest first.
 */
export function generateMonthRanges(endMonth: string, periodMonths: number): { startDate: string; endDate: string; month: string }[] {
  const ranges: { startDate: string; endDate: string; month: string }[] = [];
  const [endYear, endMonthNum] = endMonth.split('-').map(Number);

  for (let i = periodMonths - 1; i >= 0; i--) {
    const d = new Date(endYear, endMonthNum - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const mm = String(m).padStart(2, '0');
    const monthStr = `${y}-${mm}`;
    const startDate = `${monthStr}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`;
    ranges.push({ startDate, endDate, month: monthStr });
  }

  return ranges;
}

// ===== Section grouping =====

export const CATEGORY_LABELS: Record<string, string> = {
  trend: 'Napi trendek',
  engagement: 'Engagement',
  timing: 'Időzítés',
  video: 'Videók',
  post: 'Posztok',
  media: 'Tartalmak',
  audience: 'Közönség',
  ads: 'Hirdetések',
};

export const CATEGORY_ORDER = ['trend', 'engagement', 'timing', 'ads', 'post', 'media', 'video', 'audience'];

export function groupByCategory(catalog: ChartDefinition[], results: ChartData[]) {
  const groups: { category: string; label: string; charts: ChartData[] }[] = [];

  for (const cat of CATEGORY_ORDER) {
    const catCharts = catalog
      .filter(c => c.category === cat)
      .map(c => results.find(r => r.key === c.key))
      .filter((c): c is ChartData => !!c && !c.empty && !c.error);
    if (catCharts.length > 0) {
      groups.push({ category: cat, label: CATEGORY_LABELS[cat] || cat, charts: catCharts });
    }
  }
  return groups;
}
