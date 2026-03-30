'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Company, getCompanies, getChartCatalog, generateCharts, ChartDefinition, ChartData } from '@/lib/api';
import { extractKPIs, mergeKPIs, groupByCategory, aggregateMonthlyKPIs, generateMonthRanges, computeKPIChanges, KPI } from '@/lib/chartHelpers';
import { KPICard } from '@/components/KPICard';
import { ChartLazy as Chart } from '@/components/ChartLazy';
import { VideoTable } from '@/components/VideoTable';
import { MonthPicker } from '@/components/MonthPicker';
import { CompanyPicker, ALL_COMPANIES_ID } from '@/components/CompanyPicker';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';
import { Loader2, Mail, AlertTriangle, FileDown } from 'lucide-react';
import { WindsorKeyGuard } from '@/components/WindsorKeyGuard';
import { SendReportModal } from '@/components/SendReportModal';
import { FeatureGate } from '@/components/FeatureGate';
import { canUseFeature } from '@/lib/featureGate';
import { exportPdfFromDOM } from '@/lib/exportPdfClient';
import { collectChartKeysForConfig } from '@/lib/platformMetrics';

export interface PlatformConfig {
  platformKey: string;
  label: string;
  gradient: string;
  headerGradient: string;
  description: string;
  borderColor: string;
}

/** Pick columns so every row is full (no orphan cards) */
function bestCols(count: number): number {
  if (count <= 2) return count;
  if (count <= 4) return count;
  // Try 5, 4, 3 columns — pick the first that divides evenly
  for (const c of [5, 4, 3]) {
    if (count % c === 0) return c;
  }
  // If nothing divides evenly, try to find close fit
  for (const c of [4, 5, 3]) {
    if (count % c === 0) return c;
  }
  // Fallback: use 5 for larger sets, 4 for medium, 3 for small
  if (count >= 10) return 5;
  if (count >= 6) return count <= 8 ? 4 : 5;
  return 3;
}

// ===== Quick Evaluation =====

function QuickEvaluation({ companyId, platformKey, month }: { companyId: string; platformKey: string; month: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = useCallback(async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ companyId, platform: platformKey, month, adminMessage: text.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setSent(true);
      setText('');
      setTimeout(() => { setSent(false); setOpen(false); }, 1500);
    } catch {
      // silent fail
    } finally {
      setSending(false);
    }
  }, [companyId, platformKey, month, text]);

  return (
    <div className="mt-4">
      <button
        onClick={() => { setOpen(!open); setSent(false); }}
        className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>Gyors értékelés küldése</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {sent ? (
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Elküldve!</p>
          ) : (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Írd ide az értékelést..."
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y"
              />
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="text-sm font-bold px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {sending ? 'Küldés...' : 'Küldés'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Component =====

export function PlatformChartsPage({ platform }: { platform: PlatformConfig }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCatalog, setAllCatalog] = useState<ChartDefinition[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [periodMonths, setPeriodMonths] = useState(1);
  const [results, setResults] = useState<ChartData[]>([]);
  const [aggregatedKPIs, setAggregatedKPIs] = useState<KPI[] | null>(null);
  const [aggregatedCount, setAggregatedCount] = useState(0);
  const [failedCompanies, setFailedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [companyConnections, setCompanyConnections] = useState<string[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [prevMonthKpis, setPrevMonthKpis] = useState<KPI[] | null>(null);
  const [userTier, setUserTier] = useState<string>('FREE');
  const [pdfExporting, setPdfExporting] = useState(false);
  const [chartCols, setChartCols] = useState<1 | 2>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('trendalyz-chart-cols') === '2' ? 2 : 1) as 1 | 2;
    }
    return 1;
  });
  const reportRef = useRef<HTMLDivElement>(null);

  const isAllCompanies = selectedCompany === ALL_COMPANIES_ID;

  // Filter companies to only those with an active connection for this platform
  const platformCompanies = useMemo(
    () => companies.filter(c => c.connectedPlatforms?.includes(platform.platformKey)),
    [companies, platform.platformKey]
  );

  // Get dashboardConfig for selected company
  const selectedCompanyObj = useMemo(
    () => companies.find(c => c.id === selectedCompany),
    [companies, selectedCompany]
  );
  const dashboardConfig = useMemo(() => {
    if (!selectedCompanyObj?.dashboardConfig) return null;
    return (selectedCompanyObj.dashboardConfig as Record<string, { kpis: string[]; charts: string[] }>)?.[platform.platformKey] ?? null;
  }, [selectedCompanyObj, platform.platformKey]);

  const isConfigured = dashboardConfig != null &&
    (dashboardConfig.kpis.length > 0 || dashboardConfig.charts.length > 0);

  const platformCatalog = useMemo(
    () => allCatalog.filter(c => c.platform === platform.platformKey),
    [allCatalog, platform.platformKey]
  );

  // Use configured chart keys if available, otherwise fall back to full catalog
  const configuredChartKeys = useMemo(() => {
    if (!dashboardConfig || !isConfigured) return [];
    return collectChartKeysForConfig(platform.platformKey, dashboardConfig);
  }, [platform.platformKey, dashboardConfig, isConfigured]);

  const platformChartKeys = useMemo(() => {
    if (configuredChartKeys.length > 0) return configuredChartKeys;
    return platformCatalog.map(c => c.key);
  }, [configuredChartKeys, platformCatalog]);

  const kpis = useMemo(() => {
    if (isAllCompanies) return aggregatedKPIs || [];
    // Use prevMonthKpis if available (has change values), otherwise extract from results
    const all = prevMonthKpis || extractKPIs(platform.platformKey, results);
    if (!dashboardConfig || dashboardConfig.kpis.length === 0) return all;
    const allowedKpis = new Set(dashboardConfig.kpis);
    return all.filter(k => allowedKpis.has(k.key));
  }, [platform.platformKey, results, isAllCompanies, aggregatedKPIs, dashboardConfig, prevMonthKpis]);

  const sections = useMemo(() => {
    if (isAllCompanies) return []; // No charts for "all companies"
    const all = groupByCategory(platformCatalog, results);
    if (!dashboardConfig || dashboardConfig.charts.length === 0) return all;
    const allowedCharts = new Set(dashboardConfig.charts);
    return all
      .map(section => ({
        ...section,
        charts: section.charts.filter(c => allowedCharts.has(c.key)),
      }))
      .filter(section => section.charts.length > 0);
  }, [platformCatalog, results, isAllCompanies, dashboardConfig]);

  // Check if platform is available for selected company
  const platformAvailable = !selectedCompany || isAllCompanies ||
    companyConnections.includes(platform.platformKey);

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

    // Fetch user tier for feature gating
    fetch('/api/billing/subscription', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUserTier(data?.tier || 'FREE'))
      .catch(() => {});
  }, [platform.platformKey]);

  // Fetch connections when company changes
  useEffect(() => {
    if (selectedCompany && selectedCompany !== ALL_COMPANIES_ID) {
      setConnectionsLoading(true);
      fetch(`/api/admin/connections/${selectedCompany}`, { credentials: 'include' })
        .then(res => res.json())
        .then((conns: any[]) => {
          setCompanyConnections(Array.isArray(conns) ? conns.map((c: any) => c.provider) : []);
        })
        .catch(() => setCompanyConnections([]))
        .finally(() => setConnectionsLoading(false));
    } else {
      setCompanyConnections([]);
    }
  }, [selectedCompany]);

  async function handleGenerate() {
    if (!selectedCompany) {
      setError('Válassz céget!');
      return;
    }
    if (!platformAvailable) {
      setError(`Ennek a cégnek nincs ${platform.label} integrációja beállítva`);
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
    setPrevMonthKpis(null);

    try {
      if (periodMonths > 1 && !isAllCompanies) {
        // Multi-month: fetch each month separately, aggregate KPIs
        const monthRanges = generateMonthRanges(selectedMonth, periodMonths);
        const allMonthKpis: KPI[][] = [];
        let lastMonthCharts: ChartData[] = [];

        for (const range of monthRanges) {
          try {
            const response = await generateCharts({
              accountId: selectedCompany,
              startDate: range.startDate,
              endDate: range.endDate,
              charts: platformChartKeys.map(key => ({ key })),
            });
            const monthKpis = extractKPIs(platform.platformKey, response.charts);
            allMonthKpis.push(monthKpis);
            lastMonthCharts = response.charts; // keep last month's charts for display
          } catch {
            // Skip failed months
          }
        }

        if (allMonthKpis.length === 0) {
          setError('Nem sikerült adatot lekérni a megadott időszakra');
        } else {
          setAggregatedKPIs(aggregateMonthlyKPIs(allMonthKpis));
          setAggregatedCount(allMonthKpis.length);
          setResults(lastMonthCharts); // show last month's charts
        }
      } else if (isAllCompanies) {
        // All companies mode
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = `${selectedMonth}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

        const BATCH_SIZE = 3;
        const allKpis: KPI[][] = [];
        const failed: Company[] = [];

        for (let i = 0; i < platformCompanies.length; i += BATCH_SIZE) {
          const batch = platformCompanies.slice(i, i + BATCH_SIZE);
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
        // Single company, single month
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = `${selectedMonth}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

        // Also fetch previous month for % change calculation
        const prevDate = new Date(year, month - 2, 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;
        const prevMM = String(prevMonth).padStart(2, '0');
        const prevStartDate = `${prevYear}-${prevMM}-01`;
        const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
        const prevEndDate = `${prevYear}-${prevMM}-${String(prevLastDay).padStart(2, '0')}`;

        const [response, prevResponse] = await Promise.all([
          generateCharts({
            accountId: selectedCompany,
            startDate,
            endDate,
            charts: platformChartKeys.map(key => ({ key })),
          }),
          generateCharts({
            accountId: selectedCompany,
            startDate: prevStartDate,
            endDate: prevEndDate,
            charts: platformChartKeys.map(key => ({ key })),
          }).catch(() => null),
        ]);

        setResults(response.charts);

        // Compute KPI changes vs previous month
        if (prevResponse?.charts) {
          const currentKpis = extractKPIs(platform.platformKey, response.charts);
          const prevKpis = extractKPIs(platform.platformKey, prevResponse.charts);
          const kpisWithChange = computeKPIChanges(currentKpis, prevKpis);
          setPrevMonthKpis(kpisWithChange);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  const hasResults = isAllCompanies
    ? (aggregatedKPIs && aggregatedKPIs.length > 0)
    : (periodMonths > 1 ? (aggregatedKPIs && aggregatedKPIs.length > 0) : results.length > 0);

  const rawKpis = periodMonths > 1 && !isAllCompanies ? (aggregatedKPIs || []) : kpis;
  // Hide KPIs with zero/empty values — they clutter the dashboard
  const displayKpis = rawKpis.filter(kpi => {
    const v = kpi.value;
    if (v === 0 || v === '0' || v === '0.0' || v === '0.00%' || v === '0.0%') return false;
    return true;
  });

  return (
    <WindsorKeyGuard>
      <div className="p-4 md:p-8">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <PlatformIcon platform={getPlatformFromProvider(platform.platformKey)} className="w-7 h-7" />
            {platform.label}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">{platform.description}</p>
        </header>

        {/* Controls */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-6 mb-6 md:mb-8 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Cég kiválasztása</label>
              <CompanyPicker
                companies={platformCompanies}
                value={selectedCompany}
                onChange={setSelectedCompany}
                showAll
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Hónap</label>
              <MonthPicker
                value={selectedMonth}
                onChange={setSelectedMonth}
                periodMonths={periodMonths}
                onPeriodChange={setPeriodMonths}
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleGenerate}
                disabled={loading || (!platformAvailable && !isAllCompanies)}
                className="btn-press flex-1 font-bold py-3 px-6 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: `color-mix(in srgb, ${platform.borderColor} 35%, transparent)` }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generálás...</> : 'Riport generálása'}
              </button>
              {hasResults && !isAllCompanies && periodMonths === 1 && (
                <>
                  <FeatureGate feature="email_reports" tier={userTier}>
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="btn-press py-3 px-4 rounded-xl bg-gradient-to-r from-[#1a6b8a] to-[#0d3b5e] text-white dark:text-[var(--surface)] hover:from-[#8ec8d8] hover:to-[#1a6b8a] flex items-center gap-2 font-bold"
                      title="Riport küldés emailben"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </FeatureGate>
                  <FeatureGate feature="pdf_export" tier={userTier}>
                    <button
                      onClick={async () => {
                        if (!canUseFeature(userTier, 'pdf_export')) return;
                        setPdfExporting(true);
                        try {
                          const companyName = companies.find(c => c.id === selectedCompany)?.name || 'riport';
                          const pdfFilename = `${companyName}-${platform.label}-${selectedMonth}`;

                          // Client-side DOM capture — includes charts as rendered Canvas
                          const reportEl = reportRef.current;
                          if (!reportEl) {
                            throw new Error('Nincs megjeleníthető riport tartalom');
                          }
                          await exportPdfFromDOM({
                            element: reportEl,
                            filename: pdfFilename,
                          });
                        } catch (err) {
                          console.error('PDF export failed:', err);
                          setError('PDF letöltés sikertelen');
                        } finally {
                          setPdfExporting(false);
                        }
                      }}
                      disabled={pdfExporting}
                      className="btn-press py-3 px-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] hover:brightness-110 flex items-center gap-2 font-bold disabled:opacity-50"
                      title="PDF exportálás"
                    >
                      {pdfExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    </button>
                  </FeatureGate>
                </>
              )}
            </div>
          </div>

          {/* Platform not available warning */}
          {selectedCompany && !isAllCompanies && !connectionsLoading && !platformAvailable && (
            <div className="mt-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">
                Ennek a cégnek nincs <strong>{platform.label}</strong> integrációja beállítva.
                Először adj hozzá egy {platform.label} kapcsolatot a cég beállításainál.
              </span>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-4 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {hasResults && (
          <div id="report-results" ref={reportRef} className="space-y-8">
            {/* KPI Header */}
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6">
              {isAllCompanies && (
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">
                  Összesített KPI-ok ({aggregatedCount} cég)
                </p>
              )}
              {periodMonths > 1 && !isAllCompanies && (
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">
                  Összesített KPI-ok ({aggregatedCount} hónap)
                </p>
              )}
              {periodMonths === 1 && !isAllCompanies && selectedMonth && (() => {
                const [y, mo] = selectedMonth.split('-').map(Number);
                const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
                return (
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">
                    {y}. {MONTHS[mo - 1]} számai
                  </p>
                );
              })()}
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
              >
                {displayKpis.map((kpi) => (
                  <KPICard
                    key={kpi.label}
                    label={kpi.label}
                    value={kpi.value}
                    change={kpi.change}
                    description={kpi.description}
                  />
                ))}
              </div>
              {/* Quick evaluation — only for single company */}
              {selectedCompany && !isAllCompanies && selectedMonth && (
                <QuickEvaluation companyId={selectedCompany} platformKey={platform.platformKey} month={selectedMonth} />
              )}
            </div>

            {/* Chart Sections - only for single company, single month */}
            {/* Chart layout toggle */}
            {!isAllCompanies && periodMonths === 1 && sections.length > 0 && (
              <div className="flex items-center justify-end gap-2 mb-2" data-pdf-skip="true">
                <span className="text-xs text-[var(--text-secondary)]">Nézet:</span>
                <button
                  onClick={() => { setChartCols(1); localStorage.setItem('trendalyz-chart-cols', '1'); }}
                  className={`p-1.5 rounded-lg transition ${chartCols === 1 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'}`}
                  title="1 oszlop"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="6" rx="1"/><rect x="1" y="9" width="14" height="6" rx="1"/></svg>
                </button>
                <button
                  onClick={() => { setChartCols(2); localStorage.setItem('trendalyz-chart-cols', '2'); }}
                  className={`p-1.5 rounded-lg transition ${chartCols === 2 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'}`}
                  title="2 oszlop"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
                </button>
              </div>
            )}

            {!isAllCompanies && periodMonths === 1 && sections.map(({ category, label, charts }) => (
              <section key={category}>
                <h3 className="text-xl font-bold mb-4 border-l-4 pl-3" style={{ borderColor: platform.borderColor }}>
                  {label}
                </h3>
                <div className={`grid gap-4 ${chartCols === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {charts.map((chart) => {
                    if (chart.type === 'table') {
                      return (
                        <div key={chart.key}>
                          <VideoTable
                            chartVideos={chart.data?.series?.[0]?.data as any || []}
                            chartLabels={chart.data?.labels as string[] || undefined}
                            title={chart.title}
                            color={chart.color}
                          />
                        </div>
                      );
                    }

                    // Render demographics/audience charts as tables
                    const isDemographics = chart.key.includes('demographics') || chart.key.includes('gender') || chart.key.includes('audience') || chart.key.includes('country') || chart.key.includes('city');
                    if (isDemographics && chart.data?.labels && chart.data?.series?.[0]?.data) {
                      const labels = chart.data.labels;
                      const values = chart.data.series[0].data as number[];
                      const headerLabel = chart.key.includes('gender') ? 'Nem'
                        : chart.key.includes('age') ? 'Korcsoport'
                        : chart.key.includes('country') ? 'Ország'
                        : chart.key.includes('city') ? 'Város'
                        : 'Kategória';
                      return (
                        <div key={chart.key} className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5">
                          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">{chart.title}</h4>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[var(--border)]">
                                <th className="text-left py-2 px-3 text-xs font-bold text-[var(--text-secondary)] uppercase">
                                  {headerLabel}
                                </th>
                                <th className="text-right py-2 px-3 text-xs font-bold text-[var(--text-secondary)] uppercase">Megoszlás</th>
                              </tr>
                            </thead>
                            <tbody>
                              {labels.map((label: string, i: number) => (
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
              {isAllCompanies
                ? `Összesítés... (${companies.length} cég)`
                : periodMonths > 1
                  ? `Összesítés... (${periodMonths} hónap)`
                  : 'Riport generálása...'}
            </h2>
            <p className="text-[var(--text-secondary)]">Adatok lekérése és feldolgozása folyamatban</p>
          </div>
        )}
      </div>
      {/* Email modal */}
      {showEmailModal && selectedCompany && !isAllCompanies && (
        <SendReportModal
          companyId={selectedCompany}
          companyName={companies.find(c => c.id === selectedCompany)?.name || ''}
          platform={platform.platformKey}
          month={selectedMonth}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </WindsorKeyGuard>
  );
}
