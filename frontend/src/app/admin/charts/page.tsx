'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Company, CompanyConnectionLite, getCompanies, getChartCatalog, generateCharts, ChartDefinition, ChartData, ChartsResponse } from '@/lib/api';
import { extractKPIs, aggregateAccountKPIs, recomputeDerivedKPIs, KPI } from '@/lib/chartHelpers';
import { ChartLazy as Chart } from '@/components/ChartLazy';
import { VideoTable } from '@/components/VideoTable';
import { CompanyPicker, ALL_COMPANIES_ID } from '@/components/CompanyPicker';
import { CompanyMultiPicker } from '@/components/CompanyMultiPicker';
import { DateRangePicker, getDefaultRange, toIsoDate } from '@/components/DateRangePicker';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';
import { KPICard as PlatformKPICard } from '@/components/KPICard';
import { ChevronDown, ChevronRight, Check, BarChart3, Eye, Heart, MessageCircle, Share2, Video, Users, TrendingUp } from 'lucide-react';
import { WindsorKeyGuard } from '@/components/WindsorKeyGuard';
import { PLATFORM_METRICS, PLATFORM_ORDER, DISABLED_PLATFORMS, type MetricItem, type PlatformMetricConfig } from '@/lib/platformMetrics';
import { QuickEvaluation } from '@/components/QuickEvaluation';
import { getProviderMeta, type ConnectionProvider } from '@/types/integration';

// ============================================
// HELPER FUNCTIONS
// ============================================

function toYearMonth(isoDate: string): string {
  return isoDate.slice(0, 7);
}

// ============================================
// KPI AGGREGATION (all companies mode)
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

function kpiNum(kpis: KPI[], key: string): number {
  const k = kpis.find(k => k.key === key);
  if (!k) return 0;
  if (typeof k.value === 'number') return k.value;
  const n = parseFloat(String(k.value).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function aggregateFromResponses(responses: { name: string; res: ChartsResponse }[]): AggregateKPIs {
  const perCompany: AggregateKPIs['perCompany'] = [];
  let totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0;
  let totalVideos = 0, totalFollowers = 0;

  for (const { name, res } of responses) {
    // Use extractKPIs — same logic as individual company chart view
    const tt = extractKPIs('TIKTOK_ORGANIC', res.charts);
    const fb = extractKPIs('FACEBOOK_ORGANIC', res.charts);
    const ig = extractKPIs('INSTAGRAM_ORGANIC', res.charts);
    const yt = extractKPIs('YOUTUBE', res.charts);

    const companyViews = kpiNum(tt, 'tt_profile_views') + kpiNum(fb, 'fb_reach') + kpiNum(ig, 'ig_reach_kpi') + kpiNum(yt, 'yt_views_kpi');
    const companyLikes = kpiNum(tt, 'tt_likes') + kpiNum(fb, 'fb_reactions') + kpiNum(ig, 'ig_likes') + kpiNum(yt, 'yt_likes_kpi');
    const companyComments = kpiNum(tt, 'tt_comments') + kpiNum(fb, 'fb_comments') + kpiNum(ig, 'ig_comments') + kpiNum(yt, 'yt_comments_kpi');
    const companyShares = kpiNum(tt, 'tt_shares') + kpiNum(fb, 'fb_shares') + kpiNum(ig, 'ig_shares') + kpiNum(yt, 'yt_shares_kpi');
    const companyVideos = kpiNum(tt, 'tt_videos') + kpiNum(fb, 'fb_posts') + kpiNum(ig, 'ig_media_count') + kpiNum(yt, 'yt_video_count');
    const companyFollowers = kpiNum(tt, 'tt_total_followers') + kpiNum(fb, 'fb_followers') + kpiNum(ig, 'ig_followers') + kpiNum(yt, 'yt_subs');

    const companyInteractions = companyLikes + companyComments + companyShares;
    const companyER = companyViews > 0 ? Math.min(companyInteractions / companyViews * 100, 100) : 0;

    totalViews += companyViews;
    totalLikes += companyLikes;
    totalComments += companyComments;
    totalShares += companyShares;
    totalVideos += companyVideos;
    totalFollowers += companyFollowers;

    perCompany.push({ name, views: companyViews, likes: companyLikes, comments: companyComments, shares: companyShares, videos: companyVideos, engagementRate: companyER });
  }

  const totalInteractions = totalLikes + totalComments + totalShares;
  const avgER = totalViews > 0 ? Math.min(totalInteractions / totalViews * 100, 100) : 0;
  return {
    companyCount: responses.length, totalViews, totalLikes, totalComments, totalShares,
    totalVideos, totalFollowers, avgEngagementRate: avgER,
    likesPerVideo: totalVideos > 0 ? totalLikes / totalVideos : 0,
    interactionsPerVideo: totalVideos > 0 ? totalInteractions / totalVideos : 0,
    viewsPerVideo: totalVideos > 0 ? totalViews / totalVideos : 0,
    perCompany,
  };
}

const KPI_CHART_KEYS = [
  'followers_growth', 'daily_likes', 'daily_comments', 'daily_shares', 'engagement_rate',
  'all_videos',
  'fb_page_reach', 'fb_engagement', 'fb_page_fans', 'fb_all_posts', 'fb_follows_trend', 'fb_video_views',
  'ig_reach', 'ig_engagement', 'ig_follower_growth', 'ig_all_media', 'ig_daily_followers', 'ig_save_rate', 'ig_story_overview', 'ig_profile_activity',
  'yt_views_trend', 'yt_daily_engagement', 'yt_subscribers_growth', 'yt_watch_time', 'yt_engagement_rate', 'yt_all_videos', 'yt_playlist_adds',
  'ttads_spend_trend', 'ttads_impressions_clicks', 'ttads_ctr_trend', 'ttads_cpc_cpm', 'ttads_conversions', 'ttads_cost_per_conversion',
  'tt_bio_link_clicks', 'tt_total_followers',
];

// ============================================
// MULTI-SELECT DROPDOWN COMPONENT
// ============================================

interface MultiSelectDropdownProps {
  label: string;
  items: MetricItem[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  color?: string;
}

function MultiSelectDropdown({ label, items, selected, onToggle, onSelectAll, onClear, color }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const selectedCount = items.filter(i => selected.has(i.key)).length;

  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors"
      >
        <span className="truncate">{label}</span>
        <span className="flex items-center gap-1.5 shrink-0">
          {selectedCount > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
              style={{ backgroundColor: color || 'var(--accent)' }}
            >
              {selectedCount}/{items.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-raised)]">
            <button
              onClick={onSelectAll}
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Mind kijelöl
            </button>
            <button
              onClick={onClear}
              className="text-xs font-semibold text-[var(--error)] hover:underline"
            >
              Törlés
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto py-1">
            {items.map(item => {
              const isSelected = selected.has(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggle(item.key)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${isSelected
                    ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected
                    ? 'border-transparent text-white'
                    : 'border-[var(--border)]'
                    }`}
                    style={isSelected ? { backgroundColor: color || 'var(--accent)' } : undefined}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function connectionLabel(c: CompanyConnectionLite): string {
  return `${getProviderMeta(c.provider as ConnectionProvider).label} – ${c.externalAccountName || c.externalAccountId}`;
}

function ConnectionMultiSelect({
  connections,
  selected,
  onChange,
}: {
  connections: CompanyConnectionLite[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const allIds = connections.map(c => c.id);
  const selectedCount = connections.filter(c => selected.has(c.id)).length;
  const summary =
    selectedCount === 0
      ? 'Egy fiók sem kiválasztva'
      : selectedCount === connections.length
        ? `Összes fiók (${selectedCount})`
        : `${selectedCount}/${connections.length} fiók`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold flex items-center justify-between gap-2 hover:border-[var(--accent)] transition-colors cursor-pointer"
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-full min-w-[280px] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-raised)]">
            <button
              onClick={() => onChange(new Set(allIds))}
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Mind kijelöl
            </button>
            <button
              onClick={() => onChange(new Set())}
              className="text-xs font-semibold text-[var(--error)] hover:underline"
            >
              Törlés
            </button>
          </div>
          <div className="max-h-[320px] overflow-y-auto py-1">
            {connections.map(c => {
              const isSelected = selected.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${isSelected
                    ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected
                      ? 'border-transparent bg-[var(--accent)] text-white'
                      : 'border-[var(--border)]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <PlatformIcon platform={getPlatformFromProvider(c.provider)} className="w-4 h-4 shrink-0" />
                  <span className="truncate">{connectionLabel(c)}</span>
                  <span className="ml-auto text-xs font-mono text-[var(--text-secondary)] truncate max-w-[80px]" title={c.externalAccountId}>
                    {c.externalAccountId}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PLATFORM SECTION COMPONENT
// ============================================

interface PlatformSectionProps {
  platformKey: string;
  config: PlatformMetricConfig;
  selectedKPIs: Set<string>;
  selectedDaily: Set<string>;
  selectedDist: Set<string>;
  onToggleKPI: (key: string) => void;
  onToggleDaily: (key: string) => void;
  onToggleDist: (key: string) => void;
  onSelectAllKPI: () => void;
  onClearKPI: () => void;
  onSelectAllDaily: () => void;
  onClearDaily: () => void;
  onSelectAllDist: () => void;
  onClearDist: () => void;
  onSelectAllPlatform: () => void;
  onClearPlatform: () => void;
  disabled?: boolean;
}

function PlatformSection({
  platformKey, config,
  selectedKPIs, selectedDaily, selectedDist,
  onToggleKPI, onToggleDaily, onToggleDist,
  onSelectAllKPI, onClearKPI,
  onSelectAllDaily, onClearDaily,
  onSelectAllDist, onClearDist,
  onSelectAllPlatform, onClearPlatform,
  disabled,
}: PlatformSectionProps) {
  const [collapsed, setCollapsed] = useState(true);

  const totalSelected =
    config.kpis.filter(i => selectedKPIs.has(i.key)).length +
    config.daily.filter(i => selectedDaily.has(i.key)).length +
    config.distributions.filter(i => selectedDist.has(i.key)).length;

  const totalItems = config.kpis.length + config.daily.length + config.distributions.length;

  const toggleCollapsed = () => { if (!disabled) setCollapsed(!collapsed); };

  return (
    <div className={`bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl overflow-hidden transition-opacity ${disabled ? 'opacity-40 grayscale' : ''}`}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={!collapsed}
        aria-disabled={disabled}
        onClick={toggleCollapsed}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            toggleCollapsed();
          }
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${disabled ? 'cursor-not-allowed' : 'hover:bg-[var(--accent-subtle)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-inset'}`}
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
        }
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
        <PlatformIcon platform={config.platform} className="w-4 h-4" />
        <span className="font-bold text-sm text-[var(--text-primary)]">{config.label}</span>
        {disabled && <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] border border-[var(--border)] px-1.5 py-0.5 rounded">Fejlesztés alatt</span>}
        <span className="ml-auto flex items-center gap-2">
          {totalSelected > 0 && !disabled && (
            <>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                style={{ backgroundColor: config.color }}
              >
                {totalSelected}/{totalItems}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClearPlatform(); }}
                className="text-xs w-5 h-5 rounded-full bg-[var(--error)] text-white flex items-center justify-center font-bold hover:brightness-110 transition-all"
                aria-label="Összes törlése"
                title="Összes törlése"
              >
                ×
              </button>
            </>
          )}
        </span>
      </div>

      {!collapsed && !disabled && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onSelectAllPlatform(); }}
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Összes kijelölése
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClearPlatform(); }}
              className="text-xs font-semibold text-[var(--error)] hover:underline"
            >
              Összes törlése
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MultiSelectDropdown
              label="KPI-ok"
              items={config.kpis}
              selected={selectedKPIs}
              onToggle={onToggleKPI}
              onSelectAll={onSelectAllKPI}
              onClear={onClearKPI}
              color={config.color}
            />
            <MultiSelectDropdown
              label="Napi diagramok"
              items={config.daily}
              selected={selectedDaily}
              onToggle={onToggleDaily}
              onSelectAll={onSelectAllDaily}
              onClear={onClearDaily}
              color={config.color}
            />
            <MultiSelectDropdown
              label="Megoszlások"
              items={config.distributions}
              selected={selectedDist}
              onToggle={onToggleDist}
              onSelectAll={onSelectAllDist}
              onClear={onClearDist}
              color={config.color}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// AGGREGATE KPI DASHBOARD (all companies)
// ============================================

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString('hu-HU');
}

function AggregateKPIDashboard({ kpis }: { kpis: AggregateKPIs }) {
  return (
    <div className="mb-8 space-y-6">
      <h2 className="text-2xl font-bold border-l-4 border-[var(--accent)] pl-3">
        Összesített KPI-ok
        <span className="text-sm font-normal text-[var(--text-secondary)] ml-3">{kpis.companyCount} cég adatai alapján</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <AggKPICard icon={<Eye className="w-4 h-4" />} label="Összes megtekintés" value={formatNum(kpis.totalViews)} />
        <AggKPICard icon={<Heart className="w-4 h-4" />} label="Összes like" value={formatNum(kpis.totalLikes)} />
        <AggKPICard icon={<MessageCircle className="w-4 h-4" />} label="Összes komment" value={formatNum(kpis.totalComments)} />
        <AggKPICard icon={<Share2 className="w-4 h-4" />} label="Összes megosztás" value={formatNum(kpis.totalShares)} />
        <AggKPICard icon={<Video className="w-4 h-4" />} label="Összes videó/poszt" value={formatNum(kpis.totalVideos)} />
        <AggKPICard icon={<Users className="w-4 h-4" />} label="Összes követő" value={formatNum(kpis.totalFollowers)} />
        <AggKPICard icon={<TrendingUp className="w-4 h-4" />} label="Átlag ER%" value={kpis.avgEngagementRate.toFixed(2) + '%'} />
        <AggKPICard icon={<Heart className="w-4 h-4" />} label="Like / videó" value={formatNum(kpis.likesPerVideo)} />
        <AggKPICard icon={<BarChart3 className="w-4 h-4" />} label="Interakció / videó" value={formatNum(kpis.interactionsPerVideo)} />
        <AggKPICard icon={<Eye className="w-4 h-4" />} label="Megtekintés / videó" value={formatNum(kpis.viewsPerVideo)} />
      </div>
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

function AggKPICard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
      <div className="text-[var(--text-secondary)] mb-2">{icon}</div>
      <div className="text-xl font-bold text-[var(--text-primary)]">{value}</div>
      <div className="text-xs text-[var(--text-secondary)] mt-0.5">{label}</div>
    </div>
  );
}

// ============================================
// RENDER CHART RESULT
// ============================================

function RenderChart({ chart }: { chart: ChartData }) {
  if (chart.error) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6">
        <h3 className="font-bold text-[var(--error)]">{chart.key}</h3>
        <p className="text-[var(--error)] text-sm opacity-80">{chart.error}</p>
      </div>
    );
  }
  if (chart.empty || !chart.data) {
    return (
      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-6">
        <h3 className="font-bold text-[var(--text-secondary)]">{chart.title || chart.key}</h3>
        <p className="text-[var(--text-secondary)] text-sm opacity-60">Nincs adat</p>
      </div>
    );
  }
  if (chart.type === 'table') {
    return (
      <VideoTable
        chartVideos={chart.data.series?.[0]?.data as any || []}
        title={chart.title}
        color={chart.color}
      />
    );
  }
  return (
    <Chart
      type={chart.type as 'line' | 'bar'}
      labels={chart.data.labels || []}
      data={(chart.data.series?.[0]?.data || []) as number[]}
      label={chart.data.series?.[0]?.name || chart.title}
      color={chart.color}
      title={chart.title}
    />
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminChartsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [catalog, setCatalog] = useState<ChartDefinition[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());

  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState<string>(defaultRange.start);
  const [endDate, setEndDate] = useState<string>(defaultRange.end);

  const [selectedConnectionIds, setSelectedConnectionIds] = useState<Set<string>>(new Set());
  const [selections, setSelections] = useState<Record<string, { kpis: Set<string>; daily: Set<string>; dist: Set<string> }>>({});
  const [results, setResults] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aggregateKPIs, setAggregateKPIs] = useState<AggregateKPIs | null>(null);
  const [aggregateProgress, setAggregateProgress] = useState({ done: 0, total: 0 });
  const [platformKPIs, setPlatformKPIs] = useState<Record<string, KPI[]>>({});
  const [accountCount, setAccountCount] = useState(0);

  const selectedCompanies = useMemo(
    () => companies.filter(c => selectedCompanyIds.has(c.id)),
    [companies, selectedCompanyIds]
  );
  const isMultiCompany = selectedCompanies.length > 1;
  const isAllCompanies = isMultiCompany;
  const singleCompany = selectedCompanies.length === 1 ? selectedCompanies[0] : null;
  const selectedCompany = singleCompany?.id || '';
  const allConnections: CompanyConnectionLite[] = singleCompany?.connections || [];
  const connectedPlatforms = isMultiCompany
    ? new Set(selectedCompanies.flatMap(c => c.connectedPlatforms || []))
    : new Set(singleCompany?.connectedPlatforms || []);
  const activePlatforms = PLATFORM_ORDER.filter(p => connectedPlatforms.has(p) && !DISABLED_PLATFORMS.has(p));

  // Auto-select all connections of the picked company. Reads `allConnections` indirectly
  // via `selectedCompany`/`companies`; using ID list as the dep avoids re-running on
  // unrelated re-renders that produce a new array reference for the same content.
  const allConnectionIdsKey = useMemo(
    () => allConnections.map(c => c.id).sort().join(','),
    [allConnections]
  );
  useEffect(() => {
    if (isMultiCompany) {
      setSelectedConnectionIds(new Set());
      return;
    }
    setSelectedConnectionIds(new Set(allConnectionIdsKey ? allConnectionIdsKey.split(',') : []));
  }, [selectedCompany, allConnectionIdsKey, isMultiCompany]);

  const selectedConnections = useMemo(
    () => allConnections.filter(c => selectedConnectionIds.has(c.id)),
    [allConnections, selectedConnectionIds]
  );

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
      if (companiesData.length > 0) {
        setSelectedCompanyIds(new Set([companiesData[0].id]));
      }

      // Initialize all platform selections with everything selected (except disabled platforms)
      const initial: Record<string, { kpis: Set<string>; daily: Set<string>; dist: Set<string> }> = {};
      for (const [platKey, config] of Object.entries(PLATFORM_METRICS)) {
        if (DISABLED_PLATFORMS.has(platKey)) {
          initial[platKey] = { kpis: new Set(), daily: new Set(), dist: new Set() };
        } else {
          initial[platKey] = {
            kpis: new Set(config.kpis.map(i => i.key)),
            daily: new Set(config.daily.map(i => i.key)),
            dist: new Set(config.distributions.map(i => i.key)),
          };
        }
      }
      setSelections(initial);
    } catch {
      setError('Nem sikerült betölteni az adatokat');
    }
  }

  // Collect all needed chart keys from selections
  const allSelectedChartKeys = useMemo(() => {
    const keys = new Set<string>();
    const catalogKeys = new Set(catalog.map(c => c.key));
    for (const [platKey, sel] of Object.entries(selections)) {
      const config = PLATFORM_METRICS[platKey];
      if (!config) continue;
      for (const kpi of config.kpis) {
        if (sel.kpis.has(kpi.key)) {
          kpi.chartKeys.forEach(k => { if (catalogKeys.size === 0 || catalogKeys.has(k)) keys.add(k); });
        }
      }
      for (const daily of config.daily) {
        if (sel.daily.has(daily.key)) {
          daily.chartKeys.forEach(k => { if (catalogKeys.size === 0 || catalogKeys.has(k)) keys.add(k); });
        }
      }
      for (const dist of config.distributions) {
        if (sel.dist.has(dist.key)) {
          dist.chartKeys.forEach(k => { if (catalogKeys.size === 0 || catalogKeys.has(k)) keys.add(k); });
        }
      }
    }
    return keys;
  }, [selections, catalog]);

  const totalSelectedCount = useMemo(() => {
    let count = 0;
    for (const sel of Object.values(selections)) {
      count += sel.kpis.size + sel.daily.size + sel.dist.size;
    }
    return count;
  }, [selections]);

  function toggleInSet(platformKey: string, category: 'kpis' | 'daily' | 'dist', key: string) {
    setSelections(prev => {
      const platSel = prev[platformKey];
      if (!platSel) return prev;
      const newSet = new Set(platSel[category]);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return { ...prev, [platformKey]: { ...platSel, [category]: newSet } };
    });
  }

  function selectAllInCategory(platformKey: string, category: 'kpis' | 'daily' | 'dist') {
    const config = PLATFORM_METRICS[platformKey];
    if (!config) return;
    const items = category === 'kpis' ? config.kpis : category === 'daily' ? config.daily : config.distributions;
    setSelections(prev => {
      const platSel = prev[platformKey];
      if (!platSel) return prev;
      return { ...prev, [platformKey]: { ...platSel, [category]: new Set(items.map(i => i.key)) } };
    });
  }

  function clearCategory(platformKey: string, category: 'kpis' | 'daily' | 'dist') {
    setSelections(prev => {
      const platSel = prev[platformKey];
      if (!platSel) return prev;
      return { ...prev, [platformKey]: { ...platSel, [category]: new Set<string>() } };
    });
  }

  function selectAllPlatform(platformKey: string) {
    const config = PLATFORM_METRICS[platformKey];
    if (!config) return;
    setSelections(prev => ({
      ...prev,
      [platformKey]: {
        kpis: new Set(config.kpis.map(i => i.key)),
        daily: new Set(config.daily.map(i => i.key)),
        dist: new Set(config.distributions.map(i => i.key)),
      },
    }));
  }

  function clearPlatform(platformKey: string) {
    setSelections(prev => ({
      ...prev,
      [platformKey]: {
        kpis: new Set<string>(),
        daily: new Set<string>(),
        dist: new Set<string>(),
      },
    }));
  }

  async function handleGenerate() {
    if (allSelectedChartKeys.size === 0) {
      setError('Válassz legalább egy elemet!');
      return;
    }
    if (selectedCompanies.length === 0) {
      setError('Válassz legalább egy céget!');
      return;
    }
    if (!isMultiCompany && selectedConnections.length === 0) {
      setError('Válassz legalább egy fiókot!');
      return;
    }
    if (!startDate || !endDate || startDate > endDate) {
      setError('Érvénytelen dátum-tartomány');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setAggregateKPIs(null);
    setPlatformKPIs({});
    setAccountCount(0);

    try {
      const chartKeysArray = [...allSelectedChartKeys];

      if (isMultiCompany) {
        // Aggregate mode across the selected companies
        setAggregateProgress({ done: 0, total: selectedCompanies.length });
        const allKeys = [...new Set([...KPI_CHART_KEYS, ...chartKeysArray])];
        const chartRequests = allKeys.map(key => ({ key }));
        const companyResponses: { name: string; res: ChartsResponse }[] = [];
        const BATCH_SIZE = 3;
        for (let i = 0; i < selectedCompanies.length; i += BATCH_SIZE) {
          const batch = selectedCompanies.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(c => generateCharts({ accountId: c.id, startDate, endDate, charts: chartRequests }))
          );
          for (let j = 0; j < batch.length; j++) {
            const result = batchResults[j];
            if (result.status === 'fulfilled') {
              companyResponses.push({ name: batch[j].name, res: result.value });
            }
          }
          setAggregateProgress({ done: Math.min(i + BATCH_SIZE, selectedCompanies.length), total: selectedCompanies.length });
        }
        const kpis = aggregateFromResponses(companyResponses);
        setAggregateKPIs(kpis);
        const selectedSet = allSelectedChartKeys;
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
        // Single company. One Windsor request per selected account so that
        // metrics never get merged across distinct external account IDs.
        // Each request asks ONLY for charts that belong to that connection's platform —
        // otherwise we'd also re-fetch unrelated platforms N times for free.
        const responses = await Promise.all(
          selectedConnections.map(c => {
            const platformKeys = chartKeysArray.filter(key => {
              const def = catalog.find(d => d.key === key);
              return def?.platform === c.provider;
            });
            if (platformKeys.length === 0) return Promise.resolve(null);
            return generateCharts({
              accountId: selectedCompany,
              externalAccountId: c.externalAccountId,
              provider: c.provider,
              startDate,
              endDate,
              charts: platformKeys.map(key => ({ key })),
            }).catch(err => {
              console.error(`[AdminCharts] fetch failed for ${c.provider} ${c.externalAccountId}`, err);
              return null;
            });
          })
        );

        const ok = responses.filter((r): r is ChartsResponse => !!r);
        if (ok.length === 0) {
          setError('Nem sikerült adatot lekérni a kiválasztott fiókokhoz');
          return;
        }

        // Aggregate KPIs per platform across the picked accounts.
        const perPlatform: Record<string, KPI[][]> = {};
        for (const res of ok) {
          for (const platKey of PLATFORM_ORDER) {
            const sel = selections[platKey];
            if (!sel || sel.kpis.size === 0) continue;
            const platCharts = res.charts.filter(c => {
              const def = catalog.find(d => d.key === c.key);
              return def?.platform === platKey;
            });
            if (platCharts.length === 0) continue;
            const kpis = extractKPIs(platKey, platCharts);
            if (kpis.length === 0) continue;
            if (!perPlatform[platKey]) perPlatform[platKey] = [];
            perPlatform[platKey].push(kpis);
          }
        }

        const aggregated: Record<string, KPI[]> = {};
        for (const [plat, accountKpis] of Object.entries(perPlatform)) {
          const merged = accountKpis.length > 1 ? aggregateAccountKPIs(accountKpis) : accountKpis[0];
          // Re-derive ratio / per-unit KPIs from the aggregated base counters so they
          // don't underflow to 0.00% (which would otherwise be rendered as N/A).
          const rederived = recomputeDerivedKPIs(merged, plat);
          const sel = selections[plat];
          const filtered = sel ? rederived.filter(k => sel.kpis.has(k.key)) : rederived;
          aggregated[plat] = filtered.map(k => {
            const v = k.value;
            const isZero = (typeof v === 'number' && v === 0)
              || (typeof v === 'string' && ['0', '0.00%', '0.0', '0%'].includes(v));
            return isZero ? { ...k, value: 'N/A' } : k;
          });
        }

        setPlatformKPIs(aggregated);
        setAccountCount(ok.length);
        // Charts: only show when a single account is in scope — multi-account chart merging
        // would silently double-count series, so we hide them and surface aggregated KPIs only.
        setResults(ok.length === 1 ? ok[0].charts : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  // Group results by platform for rendering. Charts are only shown when there's a single
  // result set in scope (i.e. one company with one selected account); multi-account would
  // require chart-level merging which is not safe to do without re-aggregating series.
  const resultsByPlatform = useMemo(() => {
    if (results.length === 0) return {};
    const grouped: Record<string, { daily: ChartData[]; distributions: ChartData[] }> = {};
    for (const platKey of PLATFORM_ORDER) {
      const sel = selections[platKey];
      if (!sel) continue;
      const config = PLATFORM_METRICS[platKey];
      if (!config) continue;

      const selectedDailyKeys = new Set(config.daily.filter(i => sel.daily.has(i.key)).flatMap(i => i.chartKeys));
      const selectedDistKeys = new Set(config.distributions.filter(i => sel.dist.has(i.key)).flatMap(i => i.chartKeys));

      const daily: ChartData[] = [];
      const distributions: ChartData[] = [];

      for (const chart of results) {
        if (chart.empty || chart.error) continue;
        const def = catalog.find(d => d.key === chart.key);
        if (def?.platform !== platKey) continue;

        if (selectedDailyKeys.has(chart.key)) daily.push(chart);
        else if (selectedDistKeys.has(chart.key)) distributions.push(chart);
      }

      if (daily.length > 0 || distributions.length > 0) {
        grouped[platKey] = { daily, distributions };
      }
    }
    return grouped;
  }, [results, catalog, selections]);

  const generateButtonLabel = !loading
    ? `Generálás (${totalSelectedCount})`
    : isAllCompanies
      ? `Betöltés... (${aggregateProgress.done}/${aggregateProgress.total})`
      : 'Generálás...';

  return (
    <WindsorKeyGuard>
      <div className="p-4 md:p-8">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Összesített riport</h1>
          <p className="text-[var(--text-secondary)] mt-1">Multi-platform chart generálás platformonkénti beállításokkal</p>
        </header>

        {/* Controls */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-6 mb-6 md:mb-8 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1.4fr_auto] gap-4 md:gap-4 items-end mb-5">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Cégek</label>
              <CompanyMultiPicker
                companies={companies}
                selectedIds={selectedCompanyIds}
                onChange={setSelectedCompanyIds}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Fiókok</label>
              {isMultiCompany ? (
                <div className="px-4 py-3 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">
                  Több cég módban a fiók-szűrő nem aktív
                </div>
              ) : allConnections.length === 0 ? (
                <div className="px-4 py-3 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">
                  Nincs csatlakoztatott fiók
                </div>
              ) : (
                <ConnectionMultiSelect
                  connections={allConnections}
                  selected={selectedConnectionIds}
                  onChange={setSelectedConnectionIds}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Időszak</label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
              />
            </div>

            <div>
              <button
                onClick={handleGenerate}
                disabled={loading || allSelectedChartKeys.size === 0}
                className="btn-gradient w-full font-bold py-3 px-6 rounded-xl"
              >
                {generateButtonLabel}
              </button>
            </div>
          </div>

          {/* Platform Sections */}
          <div className="border-t border-[var(--border)] pt-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase">Platform beállítások</h3>
            </div>
            {activePlatforms.map(platKey => {
              const config = PLATFORM_METRICS[platKey];
              const sel = selections[platKey];
              if (!config || !sel) return null;
              return (
                <PlatformSection
                  key={platKey}
                  platformKey={platKey}
                  config={config}
                  selectedKPIs={sel.kpis}
                  selectedDaily={sel.daily}
                  selectedDist={sel.dist}
                  onToggleKPI={(key) => toggleInSet(platKey, 'kpis', key)}
                  onToggleDaily={(key) => toggleInSet(platKey, 'daily', key)}
                  onToggleDist={(key) => toggleInSet(platKey, 'dist', key)}
                  onSelectAllKPI={() => selectAllInCategory(platKey, 'kpis')}
                  onClearKPI={() => clearCategory(platKey, 'kpis')}
                  onSelectAllDaily={() => selectAllInCategory(platKey, 'daily')}
                  onClearDaily={() => clearCategory(platKey, 'daily')}
                  onSelectAllDist={() => selectAllInCategory(platKey, 'dist')}
                  onClearDist={() => clearCategory(platKey, 'dist')}
                  onSelectAllPlatform={() => selectAllPlatform(platKey)}
                  onClearPlatform={() => clearPlatform(platKey)}
                  disabled={DISABLED_PLATFORMS.has(platKey)}
                />
              );
            })}
          </div>

          {error && (
            <div className="mt-4 alert-error rounded-xl p-4">
              {error}
            </div>
          )}
        </div>

        {/* Aggregate KPI Dashboard (all companies mode) */}
        {aggregateKPIs && <AggregateKPIDashboard kpis={aggregateKPIs} />}

        {/* Per-platform aggregated KPIs (single company, 1+ accounts) */}
        {Object.keys(platformKPIs).length > 0 && (
          <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-bold border-l-4 border-[var(--accent)] pl-3 flex items-baseline gap-3">
              Összesített KPI-ok
              {accountCount > 1 && (
                <span className="text-sm font-normal text-[var(--text-secondary)]">{accountCount} fiók</span>
              )}
            </h2>
            {activePlatforms.map(platKey => {
              const kpiList = platformKPIs[platKey];
              if (!kpiList || kpiList.length === 0) return null;
              const config = PLATFORM_METRICS[platKey];
              return (
                <div key={platKey} className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6">
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                    <PlatformIcon platform={config.platform} className="w-4 h-4" />
                    {config.label}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {kpiList.map((kpi) => (
                      <PlatformKPICard key={kpi.label} label={kpi.label} value={kpi.value} description={kpi.description} />
                    ))}
                  </div>
                  {accountCount === 1 && (
                    <QuickEvaluation companyId={selectedCompany} platformKey={platKey} month={toYearMonth(startDate)} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Per-platform chart results */}
        {Object.keys(resultsByPlatform).length > 0 ? (
          <div className="space-y-8">
            {activePlatforms.map(platKey => {
              const group = resultsByPlatform[platKey];
              if (!group) return null;
              const config = PLATFORM_METRICS[platKey];
              return (
                <div key={platKey}>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                    <PlatformIcon platform={config.platform} className="w-5 h-5" />
                    {config.label}
                  </h2>

                  {/* Daily charts - 2 col grid */}
                  {group.daily.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase mb-3">Napi diagramok</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {group.daily.map((chart, i) => (
                          <div key={`${chart.key}-${i}`}>
                            <RenderChart chart={chart} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Distribution charts */}
                  {group.distributions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase mb-3">Megoszlások</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {group.distributions.map((chart, i) => (
                          <div key={`${chart.key}-${i}`} className={chart.type === 'table' ? 'lg:col-span-2' : ''}>
                            <RenderChart chart={chart} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : !loading && results.length === 0 && !aggregateKPIs && Object.keys(platformKPIs).length === 0 ? (
          <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Válaszd ki a chartokat</h2>
            <p className="text-[var(--text-secondary)]">Állítsd be a platformonkénti beállításokat és kattints a Generálás gombra</p>
          </div>
        ) : null}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        )}
      </div>
    </WindsorKeyGuard>
  );
}
