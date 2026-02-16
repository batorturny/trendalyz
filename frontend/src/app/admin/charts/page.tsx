'use client';

import { useState, useEffect, useMemo } from 'react';
import { Company, getCompanies, getChartCatalog, generateCharts, ChartDefinition, ChartData, ChartsResponse } from '@/lib/api';
import { ChartDashboard } from '@/components/ChartDashboard';
import { CompanyPicker, ALL_COMPANIES_ID } from '@/components/CompanyPicker';
import { PlatformIcon } from '@/components/PlatformIcon';
import { CalendarDays, TrendingUp, Eye, Heart, Video, MessageCircle, Share2, Users, BarChart3 } from 'lucide-react';
import { WindsorKeyGuard } from '@/components/WindsorKeyGuard';

const PLATFORM_TABS = [
  { key: 'ALL', label: 'Mind', color: 'var(--accent)' },
  { key: 'TIKTOK_ORGANIC', label: 'TikTok', color: 'var(--platform-tiktok)' },
  { key: 'FACEBOOK_ORGANIC', label: 'Facebook', color: 'var(--platform-facebook)' },
  { key: 'INSTAGRAM_ORGANIC', label: 'Instagram', color: 'var(--platform-instagram)' },
  { key: 'YOUTUBE', label: 'YouTube', color: 'var(--platform-youtube)' },
];

const CATEGORY_NAMES: Record<string, string> = {
  'trend': 'Trend',
  'engagement': 'Engagement',
  'timing': 'Időzítés',
  'video': 'Videók',
  'post': 'Posztok',
  'media': 'Tartalmak',
  'audience': 'Közönség',
};

function toMonthStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthToStartDate(m: string): string {
  return `${m}-01`;
}

function monthToEndDate(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  const last = new Date(y, mo, 0);
  return last.toISOString().split('T')[0];
}

function formatMonthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  return `${y}. ${MONTHS[mo - 1]}`;
}

function getMonthOptions(count: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(toMonthStr(d));
  }
  return result;
}

type Preset = { label: string; months: number };
const PRESETS: Preset[] = [
  { label: 'Elmúlt hónap', months: 1 },
  { label: 'Elmúlt 3 hónap', months: 3 },
  { label: 'Elmúlt 6 hónap', months: 6 },
];

// ============================================
// KPI AGGREGATION
// ============================================

interface AggregateKPIs {
  companyCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalVideos: number;
  totalFollowers: number;
  avgEngagementRate: number;
  likesPerVideo: number;
  interactionsPerVideo: number;
  viewsPerVideo: number;
  perCompany: {
    name: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    videos: number;
    engagementRate: number;
  }[];
}

/** Extract a numeric sum from a chart's series data */
function sumSeries(chart: ChartData | undefined): number {
  if (!chart?.data?.series) return 0;
  return chart.data.series.reduce((total, s) => {
    return total + (s.data as number[]).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
  }, 0);
}

/** Extract the last value from the first series (useful for cumulative metrics like followers) */
function lastValue(chart: ChartData | undefined): number {
  if (!chart?.data?.series?.[0]?.data) return 0;
  const data = chart.data.series[0].data as number[];
  for (let i = data.length - 1; i >= 0; i--) {
    if (typeof data[i] === 'number' && data[i] > 0) return data[i];
  }
  return 0;
}

/** Count rows in a table chart */
function tableRowCount(chart: ChartData | undefined): number {
  if (!chart?.data?.labels) return 0;
  return chart.data.labels.length;
}

function aggregateFromResponses(responses: { name: string; res: ChartsResponse }[]): AggregateKPIs {
  const perCompany: AggregateKPIs['perCompany'] = [];
  let totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0;
  let totalVideos = 0, totalFollowers = 0;
  const engagementRates: number[] = [];

  for (const { name, res } of responses) {
    const chartMap = new Map(res.charts.map(c => [c.key, c]));

    // TikTok metrics
    const ttLikes = sumSeries(chartMap.get('daily_likes'));
    const ttComments = sumSeries(chartMap.get('daily_comments'));
    const ttShares = sumSeries(chartMap.get('daily_shares'));
    const ttFollowers = lastValue(chartMap.get('followers_growth'));
    const ttVideos = tableRowCount(chartMap.get('video_performance'));

    // Facebook metrics
    const fbReactions = sumSeries(chartMap.get('fb_engagement'));
    const fbFollowers = lastValue(chartMap.get('fb_followers'));
    const fbPosts = tableRowCount(chartMap.get('fb_post_engagement'));
    const fbImpressions = sumSeries(chartMap.get('fb_reach'));

    // Instagram metrics
    const igLikes = sumSeries(chartMap.get('ig_engagement'));
    const igFollowers = lastValue(chartMap.get('ig_followers'));
    const igImpressions = sumSeries(chartMap.get('ig_reach'));

    // YouTube metrics
    const ytViews = sumSeries(chartMap.get('yt_views'));
    const ytLikes = sumSeries(chartMap.get('yt_engagement'));
    const ytFollowers = lastValue(chartMap.get('yt_subscribers'));

    // Engagement rate from chart
    const erChart = chartMap.get('engagement_rate');
    let erAvg = 0;
    if (erChart?.data?.series?.[0]?.data) {
      const erData = (erChart.data.series[0].data as number[]).filter(v => typeof v === 'number' && v > 0);
      if (erData.length > 0) {
        erAvg = erData.reduce((a, b) => a + b, 0) / erData.length;
      }
    }

    const companyViews = fbImpressions + igImpressions + ytViews;
    const companyLikes = ttLikes + fbReactions + igLikes + ytLikes;
    const companyComments = ttComments;
    const companyShares = ttShares;
    const companyVideos = ttVideos + fbPosts;
    const companyFollowers = ttFollowers + fbFollowers + igFollowers + ytFollowers;

    totalViews += companyViews;
    totalLikes += companyLikes;
    totalComments += companyComments;
    totalShares += companyShares;
    totalVideos += companyVideos;
    totalFollowers += companyFollowers;
    if (erAvg > 0) engagementRates.push(erAvg);

    perCompany.push({
      name,
      views: companyViews,
      likes: companyLikes,
      comments: companyComments,
      shares: companyShares,
      videos: companyVideos,
      engagementRate: erAvg,
    });
  }

  const totalInteractions = totalLikes + totalComments + totalShares;
  const avgER = engagementRates.length > 0
    ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
    : 0;

  return {
    companyCount: responses.length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalVideos,
    totalFollowers,
    avgEngagementRate: avgER,
    likesPerVideo: totalVideos > 0 ? totalLikes / totalVideos : 0,
    interactionsPerVideo: totalVideos > 0 ? totalInteractions / totalVideos : 0,
    viewsPerVideo: totalVideos > 0 ? totalViews / totalVideos : 0,
    perCompany,
  };
}

// ============================================
// KPI CHART KEYS — the charts we need for aggregation
// ============================================

const KPI_CHART_KEYS = [
  'followers_growth', 'daily_likes', 'daily_comments', 'daily_shares', 'engagement_rate',
  'video_performance',
  'fb_reach', 'fb_engagement', 'fb_followers', 'fb_post_engagement',
  'ig_reach', 'ig_engagement', 'ig_followers',
  'yt_views', 'yt_engagement', 'yt_subscribers',
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminChartsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [catalog, setCatalog] = useState<ChartDefinition[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');

  const now = new Date();
  const currentMonth = toMonthStr(now);
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [endMonth, setEndMonth] = useState(currentMonth);

  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
  const [results, setResults] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState('ALL');

  // Aggregate KPIs state
  const [aggregateKPIs, setAggregateKPIs] = useState<AggregateKPIs | null>(null);
  const [aggregateProgress, setAggregateProgress] = useState({ done: 0, total: 0 });

  const isAllCompanies = selectedCompany === ALL_COMPANIES_ID;

  const monthOptions = useMemo(() => getMonthOptions(24), []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [companiesData, catalogData] = await Promise.all([
        getCompanies(),
        getChartCatalog()
      ]);
      setCompanies(companiesData);
      setCatalog(catalogData.charts);
      if (companiesData.length > 0) setSelectedCompany(companiesData[0].id);
      setSelectedCharts(catalogData.charts.map(c => c.key));
    } catch {
      setError('Nem sikerült betölteni az adatokat');
    }
  }

  function applyPreset(months: number) {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - months + 1, 1);
    setStartMonth(toMonthStr(start));
    setEndMonth(toMonthStr(end));
  }

  const activePreset = useMemo(() => {
    for (const p of PRESETS) {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth() - p.months + 1, 1);
      if (toMonthStr(start) === startMonth && toMonthStr(end) === endMonth) return p.months;
    }
    return null;
  }, [startMonth, endMonth]);

  const startDate = monthToStartDate(startMonth);
  const endDate = monthToEndDate(endMonth);

  const filteredCatalog = useMemo(() => {
    if (activePlatform === 'ALL') return catalog;
    return catalog.filter(c => c.platform === activePlatform);
  }, [catalog, activePlatform]);

  const byCategory = useMemo(() => {
    const grouped: Record<string, ChartDefinition[]> = {};
    filteredCatalog.forEach(chart => {
      if (!grouped[chart.category]) grouped[chart.category] = [];
      grouped[chart.category].push(chart);
    });
    return grouped;
  }, [filteredCatalog]);

  function toggleChart(key: string) {
    setSelectedCharts(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function selectAllVisible() {
    const visibleKeys = filteredCatalog.map(c => c.key);
    setSelectedCharts(prev => [...new Set([...prev, ...visibleKeys])]);
  }

  function clearVisible() {
    const visibleKeys = new Set(filteredCatalog.map(c => c.key));
    setSelectedCharts(prev => prev.filter(k => !visibleKeys.has(k)));
  }

  async function handleGenerate() {
    if (selectedCharts.length === 0) {
      setError('Válassz legalább egy chartot!');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setAggregateKPIs(null);

    try {
      if (isAllCompanies) {
        // Aggregate mode: fetch for all companies
        setAggregateProgress({ done: 0, total: companies.length });

        // Use KPI chart keys + user-selected charts (deduplicated)
        const allKeys = [...new Set([...KPI_CHART_KEYS, ...selectedCharts])];
        const chartRequests = allKeys.map(key => ({ key }));

        const companyResponses: { name: string; res: ChartsResponse }[] = [];

        // Fetch in batches of 3 to avoid overwhelming the API
        const BATCH_SIZE = 3;
        for (let i = 0; i < companies.length; i += BATCH_SIZE) {
          const batch = companies.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(c => generateCharts({
              accountId: c.id,
              startDate,
              endDate,
              charts: chartRequests,
            }))
          );

          for (let j = 0; j < batch.length; j++) {
            const result = batchResults[j];
            if (result.status === 'fulfilled') {
              companyResponses.push({ name: batch[j].name, res: result.value });
            }
          }
          setAggregateProgress({ done: Math.min(i + BATCH_SIZE, companies.length), total: companies.length });
        }

        // Aggregate KPIs
        const kpis = aggregateFromResponses(companyResponses);
        setAggregateKPIs(kpis);

        // Merge chart results (user-selected only) — skip KPI-only charts
        const selectedSet = new Set(selectedCharts);
        const mergedCharts: ChartData[] = [];
        for (const { res } of companyResponses) {
          for (const chart of res.charts) {
            if (selectedSet.has(chart.key) && !chart.empty && !chart.error) {
              mergedCharts.push(chart);
            }
          }
        }
        setResults(mergedCharts);
      } else {
        // Single company mode
        const response = await generateCharts({
          accountId: selectedCompany,
          startDate,
          endDate,
          charts: selectedCharts.map(key => ({ key }))
        });
        setResults(response.charts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  const selectedCountByPlatform = useMemo(() => {
    const counts: Record<string, number> = { ALL: 0 };
    catalog.forEach(c => {
      if (selectedCharts.includes(c.key)) {
        counts.ALL = (counts.ALL || 0) + 1;
        counts[c.platform || ''] = (counts[c.platform || ''] || 0) + 1;
      }
    });
    return counts;
  }, [catalog, selectedCharts]);

  const selectClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors appearance-none cursor-pointer";

  return (
    <WindsorKeyGuard>
    <div className="p-4 md:p-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Chartok</h1>
        <p className="text-[var(--text-secondary)] mt-1">Multi-platform chart generálás</p>
      </header>

      {/* Controls */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-6 mb-6 md:mb-8 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-end mb-5">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Cég</label>
            <CompanyPicker
              companies={companies}
              value={selectedCompany}
              onChange={setSelectedCompany}
              showAll
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Időszak</label>
            <div className="flex items-center gap-2">
              <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className={selectClass}>
                {monthOptions.map(m => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
              </select>
              <span className="text-[var(--text-secondary)] font-bold px-1">—</span>
              <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className={selectClass}>
                {monthOptions.filter(m => m >= startMonth).map(m => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <button
              onClick={handleGenerate}
              disabled={loading || selectedCharts.length === 0}
              className="w-full bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold py-3 px-6 rounded-xl hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {loading
                ? isAllCompanies
                  ? `Betöltés... (${aggregateProgress.done}/${aggregateProgress.total})`
                  : 'Generálás...'
                : `Generálás (${selectedCharts.length})`
              }
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2 mb-6">
          <CalendarDays className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase mr-1">Gyors:</span>
          {PRESETS.map(p => (
            <button
              key={p.months}
              onClick={() => applyPreset(p.months)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePreset === p.months
                  ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
                  : 'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Platform Tabs */}
        <div className="border-t border-[var(--border)] pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex gap-2 flex-wrap">
              {PLATFORM_TABS.map(tab => {
                const count = selectedCountByPlatform[tab.key] || 0;
                const isActive = activePlatform === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActivePlatform(tab.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'text-white'
                        : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
                    }`}
                    style={isActive ? { backgroundColor: tab.color } : undefined}
                  >
                    {tab.key !== 'ALL' && <PlatformIcon platform={tab.key === 'TIKTOK_ORGANIC' ? 'tiktok' : tab.key === 'FACEBOOK_ORGANIC' ? 'facebook' : tab.key === 'INSTAGRAM_ORGANIC' ? 'instagram' : 'youtube'} className="w-4 h-4 inline-block mr-1" />}{tab.label}
                    {count > 0 && (
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/30 text-white' : 'bg-[var(--surface)] text-[var(--text-primary)]'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={selectAllVisible} className="text-xs px-3 py-1 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--accent-subtle)]">
                Mind kijelöl
              </button>
              <button onClick={clearVisible} className="text-xs px-3 py-1 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-[var(--error)] rounded-lg hover:opacity-80">
                Törlés
              </button>
            </div>
          </div>

          {/* Chart Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(byCategory).map(([category, charts]) => (
              <div key={category} className="bg-[var(--surface-raised)] rounded-xl p-4">
                <h4 className="font-bold text-[var(--text-primary)] mb-3">{CATEGORY_NAMES[category] || category}</h4>
                <div className="space-y-2">
                  {charts.map(chart => (
                    <label key={chart.key} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--accent-subtle)] p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCharts.includes(chart.key)}
                        onChange={() => toggleChart(chart.key)}
                        className="w-4 h-4 rounded accent-[var(--accent)]"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[var(--text-primary)]">{chart.title}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{chart.description}</div>
                      </div>
                      {/* platform icon */}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-4 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Aggregate KPI Dashboard */}
      {aggregateKPIs && <AggregateKPIDashboard kpis={aggregateKPIs} />}

      <ChartDashboard results={results} loading={loading} />
    </div>
    </WindsorKeyGuard>
  );
}

// ============================================
// KPI DASHBOARD COMPONENT
// ============================================

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString('hu-HU');
}

function AggregateKPIDashboard({ kpis }: { kpis: AggregateKPIs }) {
  return (
    <div className="mb-8 space-y-6">
      {/* Header */}
      <h2 className="text-2xl font-bold border-l-4 border-[var(--accent)] pl-3">
        Összesített KPI-ok
        <span className="text-sm font-normal text-[var(--text-secondary)] ml-3">{kpis.companyCount} cég adatai alapján</span>
      </h2>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <KPICard icon={<Eye className="w-4 h-4" />} label="Összes megtekintés" value={formatNum(kpis.totalViews)} />
        <KPICard icon={<Heart className="w-4 h-4" />} label="Összes like" value={formatNum(kpis.totalLikes)} />
        <KPICard icon={<MessageCircle className="w-4 h-4" />} label="Összes komment" value={formatNum(kpis.totalComments)} />
        <KPICard icon={<Share2 className="w-4 h-4" />} label="Összes megosztás" value={formatNum(kpis.totalShares)} />
        <KPICard icon={<Video className="w-4 h-4" />} label="Összes videó/poszt" value={formatNum(kpis.totalVideos)} />
        <KPICard icon={<Users className="w-4 h-4" />} label="Összes követő" value={formatNum(kpis.totalFollowers)} />
        <KPICard icon={<TrendingUp className="w-4 h-4" />} label="Átlag ER%" value={kpis.avgEngagementRate.toFixed(2) + '%'} />
        <KPICard icon={<Heart className="w-4 h-4" />} label="Like / videó" value={formatNum(kpis.likesPerVideo)} />
        <KPICard icon={<BarChart3 className="w-4 h-4" />} label="Interakció / videó" value={formatNum(kpis.interactionsPerVideo)} />
        <KPICard icon={<Eye className="w-4 h-4" />} label="Megtekintés / videó" value={formatNum(kpis.viewsPerVideo)} />
      </div>

      {/* Per-company breakdown */}
      {kpis.perCompany.length > 1 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
          <div className="px-4 md:px-6 py-3 bg-[var(--surface-raised)] border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Cégenkénti bontás</h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs font-bold text-[var(--text-secondary)] uppercase">
                <th className="px-6 py-3">Cég</th>
                <th className="px-4 py-3 text-right">Megtekintés</th>
                <th className="px-4 py-3 text-right">Like</th>
                <th className="px-4 py-3 text-right">Komment</th>
                <th className="px-4 py-3 text-right">Megosztás</th>
                <th className="px-4 py-3 text-right">Videó/poszt</th>
                <th className="px-4 py-3 text-right">ER%</th>
              </tr>
            </thead>
            <tbody>
              {kpis.perCompany.sort((a, b) => b.views - a.views).map((c, i) => (
                <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--accent-subtle)]">
                  <td className="px-6 py-3 font-semibold text-[var(--text-primary)]">{c.name}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{formatNum(c.views)}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{formatNum(c.likes)}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{formatNum(c.comments)}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{formatNum(c.shares)}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{formatNum(c.videos)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={c.engagementRate > 0 ? 'text-emerald-500 font-bold' : 'text-[var(--text-secondary)]'}>
                      {c.engagementRate > 0 ? c.engagementRate.toFixed(2) + '%' : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
      <div className="text-[var(--text-secondary)] mb-2">{icon}</div>
      <div className="text-xl font-bold text-[var(--text-primary)]">{value}</div>
      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{label}</div>
    </div>
  );
}
