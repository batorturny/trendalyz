'use client';

import { useState, useEffect, useMemo } from 'react';
import { Company, getCompanies, getChartCatalog, generateCharts, ChartDefinition, ChartData } from '@/lib/api';
import { KPICard } from '@/components/KPICard';
import { Chart } from '@/components/Chart';
import { VideoTable } from '@/components/VideoTable';
import { MonthPicker } from '@/components/MonthPicker';
import { CompanyPicker, ALL_COMPANIES_ID } from '@/components/CompanyPicker';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';
import { Loader2 } from 'lucide-react';
import { WindsorKeyGuard } from '@/components/WindsorKeyGuard';

interface PlatformConfig {
  platformKey: string;
  label: string;
  gradient: string;
  headerGradient: string;
  description: string;
  borderColor: string;
}

// ===== KPI helpers =====

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

function findChart(results: ChartData[], key: string): ChartData | undefined {
  return results.find(c => c.key === key);
}

interface KPI {
  label: string;
  value: string | number;
  change?: number | null;
}

function extractKPIs(platformKey: string, results: ChartData[]): KPI[] {
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

/** Merge KPI arrays: sum numeric values, average percentages */
function mergeKPIs(allKpis: KPI[][]): KPI[] {
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
        // Average percentages
        const a = parseFloat(mVal);
        const b = parseFloat(rVal);
        merged[j].value = `${((a * i + b) / (i + 1)).toFixed(2)}%`;
      }
    }
  }

  return merged;
}

// ===== Section grouping =====

const CATEGORY_LABELS: Record<string, string> = {
  trend: 'Napi trendek',
  engagement: 'Engagement',
  timing: 'Időzítés',
  video: 'Videók',
  post: 'Posztok',
  media: 'Tartalmak',
  audience: 'Közönség',
  ads: 'Hirdetések',
};

const CATEGORY_ORDER = ['trend', 'engagement', 'timing', 'ads', 'post', 'media', 'video', 'audience'];

function groupByCategory(catalog: ChartDefinition[], results: ChartData[]) {
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

// ===== Component =====

export function PlatformChartsPage({ platform }: { platform: PlatformConfig }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCatalog, setAllCatalog] = useState<ChartDefinition[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [results, setResults] = useState<ChartData[]>([]);
  const [aggregatedKPIs, setAggregatedKPIs] = useState<KPI[] | null>(null);
  const [aggregatedCount, setAggregatedCount] = useState(0);
  const [failedCompanies, setFailedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAllCompanies = selectedCompany === ALL_COMPANIES_ID;

  const platformCatalog = useMemo(
    () => allCatalog.filter(c => c.platform === platform.platformKey),
    [allCatalog, platform.platformKey]
  );

  const platformChartKeys = useMemo(() => platformCatalog.map(c => c.key), [platformCatalog]);

  const kpis = useMemo(() => {
    if (isAllCompanies) return aggregatedKPIs || [];
    return extractKPIs(platform.platformKey, results);
  }, [platform.platformKey, results, isAllCompanies, aggregatedKPIs]);

  const sections = useMemo(() => {
    if (isAllCompanies) return []; // No charts for "all companies"
    return groupByCategory(platformCatalog, results);
  }, [platformCatalog, results, isAllCompanies]);

  useEffect(() => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setSelectedMonth(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`);

    Promise.all([getCompanies(), getChartCatalog()])
      .then(([companiesData, catalogData]) => {
        setCompanies(companiesData);
        setAllCatalog(catalogData.charts);
      })
      .catch(() => setError('Nem sikerült betölteni az adatokat'));
  }, [platform.platformKey]);

  async function handleGenerate() {
    if (!selectedCompany) {
      setError('Válassz céget!');
      return;
    }
    if (platformChartKeys.length === 0) {
      setError('Nincsenek elérhető chartok ehhez a platformhoz');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setAggregatedKPIs(null);
    setAggregatedCount(0);
    setFailedCompanies([]);

    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = `${selectedMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

      if (isAllCompanies) {
        // Fetch in batches of 3 to avoid API rate limiting
        const BATCH_SIZE = 3;
        const allKpis: KPI[][] = [];
        const failed: Company[] = [];

        for (let i = 0; i < companies.length; i += BATCH_SIZE) {
          const batch = companies.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(async (company) => {
              try {
                return await generateCharts({
                  accountId: company.id,
                  startDate,
                  endDate,
                  charts: platformChartKeys.map(key => ({ key })),
                });
              } catch {
                // Retry once after 2s
                await new Promise(r => setTimeout(r, 2000));
                return generateCharts({
                  accountId: company.id,
                  startDate,
                  endDate,
                  charts: platformChartKeys.map(key => ({ key })),
                });
              }
            })
          );

          batchResults.forEach((result, idx) => {
            if (result.status === 'fulfilled' && result.value.charts.length > 0) {
              const companyKpis = extractKPIs(platform.platformKey, result.value.charts);
              if (companyKpis.some(k => typeof k.value === 'number' && k.value > 0)) {
                allKpis.push(companyKpis);
              }
            } else {
              failed.push(batch[idx]);
            }
          });
        }

        setFailedCompanies(failed);

        if (allKpis.length === 0) {
          setError('Egyik cégnek sincs adata ezen a platformon a kiválasztott hónapban');
        } else {
          setAggregatedKPIs(mergeKPIs(allKpis));
          setAggregatedCount(allKpis.length);

          if (failed.length > 0) {
            setError(`${failed.length} cég adatait nem sikerült lekérni: ${failed.map(c => c.name).join(', ')}`);
          }
        }
      } else {
        // Single company
        const response = await generateCharts({
          accountId: selectedCompany,
          startDate,
          endDate,
          charts: platformChartKeys.map(key => ({ key })),
        });
        setResults(response.charts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  const hasResults = isAllCompanies ? (aggregatedKPIs && aggregatedKPIs.length > 0) : results.length > 0;

  return (
    <WindsorKeyGuard>
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <PlatformIcon platform={getPlatformFromProvider(platform.platformKey)} className="w-7 h-7" />
          {platform.label}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">{platform.description}</p>
      </header>

      {/* Controls */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-8 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Cég kiválasztása</label>
            <CompanyPicker
              companies={companies}
              value={selectedCompany}
              onChange={setSelectedCompany}
              showAll
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Hónap</label>
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-press w-full font-bold py-3 px-6 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: `color-mix(in srgb, ${platform.borderColor} 35%, transparent)` }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generálás...</> : 'Riport generálása'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-4 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {hasResults && (
        <div className="space-y-8">
          {/* KPI Header */}
          <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6">
            {isAllCompanies && (
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">
                Összesített KPI-ok ({aggregatedCount} cég)
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {kpis.map((kpi) => (
                <KPICard
                  key={kpi.label}
                  label={kpi.label}
                  value={kpi.value}
                  change={kpi.change}
                />
              ))}
            </div>
          </div>

          {/* Chart Sections - only for single company */}
          {!isAllCompanies && sections.map(({ category, label, charts }) => (
            <section key={category}>
              <h3 className="text-xl font-bold mb-4 border-l-4 pl-3" style={{ borderColor: platform.borderColor }}>
                {label}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {charts.map((chart) => {
                  if (chart.type === 'table') {
                    return (
                      <div key={chart.key} className="lg:col-span-2">
                        <VideoTable
                          chartVideos={chart.data?.series?.[0]?.data as any || []}
                          title={chart.title}
                          color={chart.color}
                        />
                      </div>
                    );
                  }

                  return (
                    <Chart
                      key={chart.key}
                      type={chart.type as 'line' | 'bar'}
                      labels={chart.data?.labels || []}
                      data={(chart.data?.series?.[0]?.data || []) as number[]}
                      label={chart.data?.series?.[0]?.name || chart.title}
                      color={chart.color}
                      title={chart.title}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasResults && (
        <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
          <PlatformIcon platform={getPlatformFromProvider(platform.platformKey)} className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{platform.label} havi riport</h2>
          <p className="text-[var(--text-secondary)]">Válassz céget és hónapot, majd generáld a riportot</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-[var(--text-secondary)]" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {isAllCompanies ? `Összesítés... (${companies.length} cég)` : 'Riport generálása...'}
          </h2>
          <p className="text-[var(--text-secondary)]">Adatok lekérése és feldolgozása folyamatban</p>
        </div>
      )}
    </div>
    </WindsorKeyGuard>
  );
}
