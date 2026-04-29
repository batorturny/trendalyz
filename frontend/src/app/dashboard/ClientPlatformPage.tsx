'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getChartCatalog, generateCharts, ChartDefinition, ChartData } from '@/lib/api';
import { extractKPIs, groupByCategory, computeKPIChanges, KPI } from '@/lib/chartHelpers';
import { Building2, Settings, MessageSquare, HelpCircle, ChevronDown } from 'lucide-react';
import type { IntegrationConnection } from '@/types/integration';
import { KPICard } from '@/components/KPICard';
import { ChartLazy as Chart } from '@/components/ChartLazy';
import { VideoTable } from '@/components/VideoTable';
import { DateRangePicker, getDefaultRange, toIsoDate } from '@/components/DateRangePicker';
import { collectChartKeysForConfig } from '@/lib/platformMetrics';
import { exportPdfFromDOM } from '@/lib/exportPdfClient';
import { useT } from '@/lib/i18n';
import { EvaluationBubble } from '@/components/EvaluationBubble';
import { SkeletonKPI } from '@/components/SkeletonKPI';
import { SkeletonChart } from '@/components/SkeletonChart';
import { OnboardingModal, ONBOARDING_STORAGE_KEY } from '@/components/OnboardingModal';

interface PlatformConfig {
  platformKey: string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  headerGradient: string;
  borderColor: string;
}

/** Pick columns so every row is full (no orphan cards) */
function bestCols(count: number): number {
  if (count <= 2) return count;
  if (count <= 4) return count;
  for (const c of [5, 4, 3]) {
    if (count % c === 0) return c;
  }
  if (count >= 10) return 5;
  if (count >= 6) return count <= 8 ? 4 : 5;
  return 3;
}

interface DashboardConfigType {
  kpis: string[];
  charts: string[];
}

// ===== Component =====

export function ClientPlatformPage({
  platform,
  dashboardConfig,
  adminNote,
}: {
  platform: PlatformConfig;
  dashboardConfig?: DashboardConfigType | null;
  adminNote?: string | null;
}) {
  const t = useT();
  const { data: session, status } = useSession();
  const [allCatalog, setAllCatalog] = useState<ChartDefinition[]>([]);
  const initialRange = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState<string>(initialRange.start);
  const [endDate, setEndDate] = useState<string>(initialRange.end);
  const [results, setResults] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [prevMonthKpis, setPrevMonthKpis] = useState<KPI[] | null>(null);
  const [monthlyAnalysis, setMonthlyAnalysis] = useState<string | null>(null);
  const [chartCols, setChartCols] = useState<1 | 2>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('trendalyz-chart-cols') === '2' ? 2 : 1) as 1 | 2;
    return 1;
  });
  const [tourOpen, setTourOpen] = useState(false);
  const [platformConnections, setPlatformConnections] = useState<IntegrationConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const companyId = session?.user?.companyId;

  const selectedConnection = useMemo(
    () => platformConnections.find(c => c.id === selectedConnectionId) ?? null,
    [platformConnections, selectedConnectionId]
  );

  // Always show dashboard — if no config, show everything
  const isConfigured = true;

  // Compute which chart keys to fetch from API based on config
  const configuredChartKeys = useMemo(() => {
    if (!dashboardConfig) return [];
    return collectChartKeysForConfig(platform.platformKey, dashboardConfig);
  }, [platform.platformKey, dashboardConfig]);

  const platformCatalog = useMemo(
    () => allCatalog.filter(c => c.platform === platform.platformKey),
    [allCatalog, platform.platformKey]
  );

  // Use configured chart keys if available, otherwise fall back to full catalog
  const platformChartKeys = useMemo(() => {
    if (configuredChartKeys.length > 0) return configuredChartKeys;
    return platformCatalog.map(c => c.key);
  }, [configuredChartKeys, platformCatalog]);

  // Filter KPIs based on config, use prevMonthKpis if available (has change values)
  const kpis = useMemo(() => {
    const all = prevMonthKpis || extractKPIs(platform.platformKey, results);
    if (!dashboardConfig || dashboardConfig.kpis.length === 0) return all;
    const allowedKpis = new Set(dashboardConfig.kpis);
    return all.filter(k => allowedKpis.has(k.key));
  }, [platform.platformKey, results, dashboardConfig, prevMonthKpis]);

  // Filter chart sections based on config
  const sections = useMemo(() => {
    const all = groupByCategory(platformCatalog, results);
    if (!dashboardConfig || dashboardConfig.charts.length === 0) return all;
    const allowedCharts = new Set(dashboardConfig.charts);
    return all
      .map(section => ({
        ...section,
        charts: section.charts.filter(c => allowedCharts.has(c.key)),
      }))
      .filter(section => section.charts.length > 0);
  }, [platformCatalog, results, dashboardConfig]);

  useEffect(() => {
    getChartCatalog()
      .then(data => setAllCatalog(data.charts))
      .catch(() => setError(t('Nem sikerült betölteni a chart katalógust')));
  }, []);

  // Derived: a "single complete month" means start = first-of-month and end = last-of-same-month
  const monthAlignedKey = useMemo(() => {
    if (!startDate || !endDate) return null;
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    if (sy !== ey || sm !== em || sd !== 1) return null;
    const lastDay = new Date(sy, sm, 0).getDate();
    if (ed !== lastDay) return null;
    return `${sy}-${String(sm).padStart(2, '0')}`;
  }, [startDate, endDate]);

  // Fetch connections for this company, filter to current platform
  useEffect(() => {
    if (!companyId || status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/connections', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((all: IntegrationConnection[]) => {
        if (cancelled) return;
        const filtered = (Array.isArray(all) ? all : [])
          .filter(c => c.provider === platform.platformKey)
          .filter(c => c.status === 'CONNECTED' || ((platform.platformKey === 'FACEBOOK_ORGANIC' || platform.platformKey === 'INSTAGRAM_ORGANIC') && c.status === 'ERROR'));
        setPlatformConnections(filtered);
        // Pick remembered selection or first
        const storageKey = `trendalyz-acc-${companyId}-${platform.platformKey}`;
        const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
        const initial = filtered.find(c => c.id === stored) ?? filtered[0] ?? null;
        setSelectedConnectionId(initial?.id ?? null);
      })
      .catch(err => console.error('[ClientPlatformPage] connections fetch', err));
    return () => { cancelled = true; };
  }, [companyId, status, platform.platformKey]);

  // Persist selected account per company+platform
  useEffect(() => {
    if (!companyId || !selectedConnectionId) return;
    const storageKey = `trendalyz-acc-${companyId}-${platform.platformKey}`;
    try { localStorage.setItem(storageKey, selectedConnectionId); } catch { /* ignore quota errors */ }
  }, [companyId, platform.platformKey, selectedConnectionId]);

  const handleGenerate = useCallback(async () => {
    if (!companyId || !startDate || !endDate || platformChartKeys.length === 0) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setPrevMonthKpis(null);
    setMonthlyAnalysis(null);

    const accountParams = selectedConnection
      ? { externalAccountId: selectedConnection.externalAccountId, provider: selectedConnection.provider }
      : {};

    try {
      const chartRequests = platformChartKeys.map(key => ({ key }));
      const response = await generateCharts({
        accountId: companyId,
        startDate,
        endDate,
        charts: chartRequests,
        ...accountParams,
      });
      setResults(response.charts);

      // Previous-period delta only when the picked range is a full calendar month —
      // arbitrary-window deltas aren't meaningful for "monthly" KPIs and would double
      // every dashboard's Windsor cost for no UI gain.
      if (monthAlignedKey) {
        const startMs = new Date(`${startDate}T00:00:00`).getTime();
        const endMs = new Date(`${endDate}T00:00:00`).getTime();
        const dayMs = 24 * 60 * 60 * 1000;
        const dayCount = Math.max(1, Math.round((endMs - startMs) / dayMs) + 1);
        const prevEnd = new Date(startMs - dayMs);
        const prevStart = new Date(prevEnd.getTime() - (dayCount - 1) * dayMs);

        generateCharts({
          accountId: companyId,
          startDate: toIsoDate(prevStart),
          endDate: toIsoDate(prevEnd),
          charts: chartRequests,
          ...accountParams,
        }).then(prevResponse => {
          const currentKpis = extractKPIs(platform.platformKey, response.charts);
          const prevKpis = extractKPIs(platform.platformKey, prevResponse.charts);
          setPrevMonthKpis(computeKPIChanges(currentKpis, prevKpis));
        }).catch(err => console.error('[ClientPlatformPage] prev-period fetch', err));
      }

      // Monthly AI analysis only makes sense for a single complete month.
      if (monthAlignedKey) {
        fetch(`/api/analysis/client?month=${monthAlignedKey}`)
          .then(r => r.json())
          .then(data => setMonthlyAnalysis(data.content ?? null))
          .catch(err => console.error('[ClientPlatformPage] fetchAnalysis', err));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Hiba történt'));
    } finally {
      setLoading(false);
    }
  }, [companyId, startDate, endDate, platformChartKeys, platform.platformKey, selectedConnection, monthAlignedKey, t]);

  // Single load/reload effect. Waits for connections to settle before firing so we
  // don't burn Windsor calls on a first render where selectedConnection is still null,
  // then re-runs whenever the user picks a different account.
  const lastLoadedConnIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!companyId || !startDate || !endDate || platformChartKeys.length === 0) return;
    if (status !== 'authenticated' || !isConfigured) return;
    // platformConnections === [] is a valid "this platform has no connection" state — load anyway.
    if (platformConnections.length > 0 && !selectedConnectionId) return;
    const connKey = selectedConnectionId ?? '__none__';
    if (lastLoadedConnIdRef.current === connKey) return;
    lastLoadedConnIdRef.current = connKey;
    setAutoLoaded(true);
    handleGenerate();
  }, [companyId, startDate, endDate, platformChartKeys, status, isConfigured, platformConnections.length, selectedConnectionId, handleGenerate]);

  async function handleExportPdf() {
    setExporting(true);
    setError(null);
    try {
      const pdfFilename = `${platform.label}_riport_${startDate}_${endDate}`;
      const reportEl = reportRef.current;
      if (!reportEl) {
        throw new Error(t('Nincs megjeleníthető riport tartalom'));
      }
      await exportPdfFromDOM({
        element: reportEl,
        filename: pdfFilename,
      });
    } catch (err) {
      console.error('PDF export error:', err);
      setError(t('PDF letöltés sikertelen') + ': ' + (err instanceof Error ? err.message : t('Ismeretlen hiba')));
    } finally {
      setExporting(false);
    }
  }

  if (!companyId) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('Nincs hozzárendelt cég')}</h2>
        <p className="text-[var(--text-secondary)]">{t('Kérd meg az adminisztrátort, hogy rendeljen hozzád egy céget.')}</p>
      </div>
    );
  }

  // Not configured state
  if (!isConfigured) {
    return (
      <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
        <Settings className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('Dashboard még nincs konfigurálva')}</h2>
        <p className="text-[var(--text-secondary)]">{t('Az adminisztrátor még nem állította be, mely adatokat lásd ezen a platformon.')}</p>
      </div>
    );
  }

  return (
    <div>
      <OnboardingModal forceOpen={tourOpen} onClose={() => setTourOpen(false)} />
      {/* Controls */}
      <div data-no-print className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-6 mb-4 md:mb-8 shadow-[var(--shadow-card)]">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setTourOpen(true)}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Hogyan működik?
          </button>
        </div>
        {platformConnections.length > 1 && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
              {t('Fiók')} <span className="text-[var(--text-secondary)]/70 normal-case font-normal">({platformConnections.length})</span>
            </label>
            <div className="relative">
              <select
                value={selectedConnectionId ?? ''}
                onChange={(e) => setSelectedConnectionId(e.target.value || null)}
                disabled={loading}
                className="w-full appearance-none bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-3 pr-10 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderLeftWidth: 4, borderLeftColor: platform.borderColor }}
              >
                {platformConnections.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.externalAccountName || c.externalAccountId}
                    {c.status === 'ERROR' ? ` — ${t('hiba')}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">{t('Időszak')}</label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full text-white font-bold py-3 px-6 rounded-xl hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              style={{ backgroundColor: platform.borderColor }}
            >
              {loading ? t('Generálás...') : t('Riport generálása')}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExportPdf}
              disabled={results.length === 0 || exporting}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] font-bold py-3 px-6 rounded-xl hover:bg-[var(--accent-subtle)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {exporting ? t('PDF készítése...') : t('Letöltés PDF-ben')}
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
      <div ref={reportRef}>
        {results.length > 0 && (
          <div className="space-y-8">
            {/* Monthly Analysis */}
            {monthlyAnalysis && monthAlignedKey && (
              <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: platform.borderColor }} />
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {(() => {
                      const [y, mo] = monthAlignedKey.split('-').map(Number);
                      const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
                      return `${y}. ${MONTHS[mo - 1]} — ${t('havi elemzés')}`;
                    })()}
                  </p>
                </div>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{monthlyAnalysis}</p>
              </div>
            )}

            {/* Admin Note */}
            {adminNote && (
              <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5 flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">{t('Megjegyzés')}</p>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{adminNote}</p>
                </div>
              </div>
            )}

            {/* KPI Header */}
            {(() => {
              const rawKpis = kpis;
              const displayKpis = rawKpis.filter(kpi => {
                const v = kpi.value;
                return v !== 0 && v !== '0' && v !== '0.0' && v !== '0.00%' && v !== '0.0%';
              });
              return displayKpis.length > 0 ? (
                <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                      {monthAlignedKey
                        ? (() => {
                            const [y, mo] = monthAlignedKey.split('-').map(Number);
                            const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
                            return `${y}. ${MONTHS[mo - 1]} ${t('számai')}`;
                          })()
                        : `${startDate} — ${endDate}`
                      }
                    </p>
                    <button
                      onClick={() => setTourOpen(true)}
                      className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Kattints a számokra a magyarázathoz
                    </button>
                  </div>
                  <div
                    className="kpi-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3"
                  >
                    {displayKpis.map((kpi) => (
                      <KPICard key={kpi.label} label={kpi.label} value={kpi.value} change={kpi.change} description={kpi.description} />
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Chart layout toggle */}
            {sections.length > 0 && (
              <div className="flex items-center justify-end gap-2 mb-2" data-pdf-skip="true">
                <span className="text-xs text-[var(--text-secondary)]">Nézet:</span>
                <button onClick={() => { setChartCols(1); localStorage.setItem('trendalyz-chart-cols', '1'); }}
                  className={`p-1.5 rounded-lg transition ${chartCols === 1 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-raised)] text-[var(--text-secondary)]'}`} title="1 oszlop">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="6" rx="1"/><rect x="1" y="9" width="14" height="6" rx="1"/></svg>
                </button>
                <button onClick={() => { setChartCols(2); localStorage.setItem('trendalyz-chart-cols', '2'); }}
                  className={`p-1.5 rounded-lg transition ${chartCols === 2 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-raised)] text-[var(--text-secondary)]'}`} title="2 oszlop">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
                </button>
              </div>
            )}

            {/* Chart Sections */}
            {sections.map(({ category, label, charts }) => (
              <section key={category}>
                <h3 className="text-base md:text-xl font-bold mb-3 md:mb-4 border-l-4 pl-3" style={{ borderColor: platform.borderColor }}>
                  {label}
                </h3>
                <div className={`grid gap-3 md:gap-4 ${chartCols === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {charts.map((chart) => {
                    if (chart.type === 'table') {
                      return (
                        <div key={chart.key}>
                          <VideoTable
                            chartVideos={chart.data?.series?.[0]?.data as any || []}
                            title={chart.title}
                            color={chart.color}
                          />
                        </div>
                      );
                    }

                    // Render demographics charts as tables
                    const isDemographics = chart.key.includes('demographics') || chart.key.includes('gender');
                    if (isDemographics && chart.data?.labels && chart.data?.series?.[0]?.data) {
                      const labels = chart.data.labels;
                      const values = chart.data.series[0].data as number[];
                      return (
                        <div key={chart.key} className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5">
                          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">{chart.title}</h4>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[var(--border)]">
                                <th className="text-left py-2 px-3 text-xs font-bold text-[var(--text-secondary)] uppercase">
                                  {chart.key.includes('gender') ? t('Nem') : t('Korcsoport')}
                                </th>
                                <th className="text-right py-2 px-3 text-xs font-bold text-[var(--text-secondary)] uppercase">{t('Megoszlás')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {labels.map((label, i) => (
                                <tr key={label} className="border-b border-[var(--border)] last:border-0">
                                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">{label}</td>
                                  <td className="py-2.5 px-3 text-right font-semibold text-[var(--text-primary)]">
                                    {typeof values[i] === 'number' ? `${values[i].toFixed(1)}%` : values[i]}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
                        description={chart.description || undefined}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Loading state — skeleton placeholders */}
      {loading && results.length === 0 && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonKPI key={i} />)}
          </div>
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonChart key={i} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && autoLoaded && (
        <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
          <div className="mb-4 flex justify-center">{platform.icon}</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('Nincs adat')}</h2>
          <p className="text-[var(--text-secondary)]">{t('Ehhez a hónaphoz nem található adat. Próbálj másik hónapot választani.')}</p>
        </div>
      )}
      {/* Evaluation floating bubble — only for a complete month */}
      {companyId && monthAlignedKey && (
        <EvaluationBubble
          companyId={companyId}
          platform={platform.platformKey}
          month={monthAlignedKey}
        />
      )}
    </div>
  );
}
