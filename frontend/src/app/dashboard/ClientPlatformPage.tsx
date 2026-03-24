'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getChartCatalog, generateCharts, ChartDefinition, ChartData } from '@/lib/api';
import { extractKPIs, groupByCategory, aggregateMonthlyKPIs, generateMonthRanges, computeKPIChanges, KPI } from '@/lib/chartHelpers';
import { Building2, Settings, MessageSquare } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { ChartLazy as Chart } from '@/components/ChartLazy';
import { VideoTable } from '@/components/VideoTable';
import { MonthPicker } from '@/components/MonthPicker';
import { collectChartKeysForConfig } from '@/lib/platformMetrics';
import { exportPdfFromDOM } from '@/lib/exportPdfClient';
import { useT } from '@/lib/i18n';

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
  const [selectedMonth, setSelectedMonth] = useState('');
  const [periodMonths, setPeriodMonths] = useState(1);
  const [results, setResults] = useState<ChartData[]>([]);
  const [aggregatedKPIs, setAggregatedKPIs] = useState<KPI[] | null>(null);
  const [aggregatedCount, setAggregatedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [prevMonthKpis, setPrevMonthKpis] = useState<KPI[] | null>(null);
  const [monthlyAnalysis, setMonthlyAnalysis] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const companyId = session?.user?.companyId;

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
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setSelectedMonth(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`);

    getChartCatalog()
      .then(data => setAllCatalog(data.charts))
      .catch(() => setError(t('Nem sikerült betölteni a chart katalógust')));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!companyId || !selectedMonth || platformChartKeys.length === 0) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setAggregatedKPIs(null);
    setAggregatedCount(0);
    setPrevMonthKpis(null);
    setMonthlyAnalysis(null);

    try {
      if (periodMonths > 1) {
        // Multi-month: fetch each month separately, aggregate KPIs only
        const monthRanges = generateMonthRanges(selectedMonth, periodMonths);
        const allMonthKpis: KPI[][] = [];

        for (const range of monthRanges) {
          try {
            const response = await generateCharts({
              accountId: companyId,
              startDate: range.startDate,
              endDate: range.endDate,
              charts: platformChartKeys.map(key => ({ key })),
            });
            const monthKpis = extractKPIs(platform.platformKey, response.charts);
            allMonthKpis.push(monthKpis);
          } catch {
            // Skip failed months
          }
        }

        if (allMonthKpis.length === 0) {
          setError(t('Nem sikerült adatot lekérni a megadott időszakra'));
        } else {
          setAggregatedKPIs(aggregateMonthlyKPIs(allMonthKpis));
          setAggregatedCount(allMonthKpis.length);
          setResults([{ key: '_placeholder', title: '', description: '', type: '', color: '', data: { labels: [], series: [] }, source: '', generatedAt: '', empty: true }]); // trigger hasResults
        }
      } else {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = `${selectedMonth}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

        // Also fetch previous month for % change
        const prevDate = new Date(year, month - 2, 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;
        const prevMM = String(prevMonth).padStart(2, '0');
        const prevStartDate = `${prevYear}-${prevMM}-01`;
        const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
        const prevEndDate = `${prevYear}-${prevMM}-${String(prevLastDay).padStart(2, '0')}`;

        const [response, prevResponse] = await Promise.all([
          generateCharts({
            accountId: companyId,
            startDate,
            endDate,
            charts: platformChartKeys.map(key => ({ key })),
          }),
          generateCharts({
            accountId: companyId,
            startDate: prevStartDate,
            endDate: prevEndDate,
            charts: platformChartKeys.map(key => ({ key })),
          }).catch(() => null),
        ]);

        setResults(response.charts);

        if (prevResponse?.charts) {
          const currentKpis = extractKPIs(platform.platformKey, response.charts);
          const prevKpis = extractKPIs(platform.platformKey, prevResponse.charts);
          setPrevMonthKpis(computeKPIChanges(currentKpis, prevKpis));
        }
      }
    // Fetch monthly analysis (only for single month)
    if (periodMonths === 1) {
      const [year, month] = selectedMonth.split('-').map(Number);
      const mm = String(month).padStart(2, '0');
      fetch(`/api/analysis/client?month=${year}-${mm}`)
        .then(r => r.json())
        .then(data => setMonthlyAnalysis(data.content ?? null))
        .catch(() => {});
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : t('Hiba történt'));
  } finally {
    setLoading(false);
  }
  }, [companyId, selectedMonth, platformChartKeys, periodMonths, platform.platformKey]);

  // Auto-generate on first load
  useEffect(() => {
    if (companyId && selectedMonth && platformChartKeys.length > 0 && status === 'authenticated' && !autoLoaded && isConfigured) {
      setAutoLoaded(true);
      handleGenerate();
    }
  }, [companyId, selectedMonth, platformChartKeys, status, autoLoaded, handleGenerate, isConfigured]);

  async function handleExportPdf() {
    setExporting(true);
    setError(null);
    try {
      const pdfFilename = `${platform.label}_riport_${selectedMonth}`;
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
      {/* Controls */}
      <div data-no-print className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-6 mb-4 md:mb-8 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">{t('Hónap')}</label>
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} periodMonths={periodMonths} onPeriodChange={setPeriodMonths} />
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
              disabled={(results.length === 0 && !aggregatedKPIs) || exporting}
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
            {monthlyAnalysis && (
              <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: platform.borderColor }} />
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {(() => {
                      const [y, mo] = selectedMonth.split('-').map(Number);
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
              const rawKpis = periodMonths > 1 ? (aggregatedKPIs || []) : kpis;
              const displayKpis = rawKpis.filter(kpi => {
                const v = kpi.value;
                return v !== 0 && v !== '0' && v !== '0.0' && v !== '0.00%' && v !== '0.0%';
              });
              return displayKpis.length > 0 ? (
                <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-4 md:p-6">
                  {periodMonths > 1 && (
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">
                      {t('Összesített KPI-ok')} ({aggregatedCount} {t('hónap')})
                    </p>
                  )}
                  {periodMonths === 1 && selectedMonth && (() => {
                    const [y, mo] = selectedMonth.split('-').map(Number);
                    const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
                    return (
                      <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">
                        {y}. {MONTHS[mo - 1]} {t('számai')}
                      </p>
                    );
                  })()}
                  <div
                    className="kpi-grid grid gap-2 md:gap-3"
                    style={{ gridTemplateColumns: `repeat(${bestCols(displayKpis.length)}, minmax(0, 1fr))` }}
                  >
                    {displayKpis.map((kpi) => (
                      <KPICard key={kpi.label} label={kpi.label} value={kpi.value} change={kpi.change} description={kpi.description} />
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Chart Sections - only for single month */}
            {periodMonths === 1 && sections.map(({ category, label, charts }) => (
              <section key={category}>
                <h3 className="text-base md:text-xl font-bold mb-3 md:mb-4 border-l-4 pl-3" style={{ borderColor: platform.borderColor }}>
                  {label}
                </h3>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
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
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
          <div className="mb-4 animate-pulse flex justify-center">{platform.icon}</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('Riport generálása...')}</h2>
          <p className="text-[var(--text-secondary)]">{t('Adatok lekérése és feldolgozása folyamatban')}</p>
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
    </div>
  );
}
