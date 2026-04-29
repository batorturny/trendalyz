'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Company, getCompanies, getChartCatalog, generateCharts, ChartDefinition, ChartData } from '@/lib/api';
import { extractKPIs, mergeKPIs, groupByCategory, computeKPIChanges, KPI } from '@/lib/chartHelpers';
import { KPICard } from '@/components/KPICard';
import { ChartLazy as Chart } from '@/components/ChartLazy';
import { VideoTable } from '@/components/VideoTable';
import { DateRangePicker, getDefaultRange, toIsoDate } from '@/components/DateRangePicker';
import { AccountPicker, ALL_ACCOUNTS_ID, buildAccountList, type AccountSelection } from '@/components/AccountPicker';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';
import { Loader2, Mail, AlertTriangle, FileDown } from 'lucide-react';
import { WindsorKeyGuard } from '@/components/WindsorKeyGuard';
import { SendReportModal } from '@/components/SendReportModal';
import { FeatureGate } from '@/components/FeatureGate';
import { canUseFeature } from '@/lib/featureGate';
import { exportPdfFromDOM } from '@/lib/exportPdfClient';
import { collectChartKeysForConfig } from '@/lib/platformMetrics';
import { SkeletonKPI } from '@/components/SkeletonKPI';
import { SkeletonChart } from '@/components/SkeletonChart';
import { QuickEvaluation } from '@/components/QuickEvaluation';

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

// ===== Component =====

export function PlatformChartsPage({ platform }: { platform: PlatformConfig }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCatalog, setAllCatalog] = useState<ChartDefinition[]>([]);
  const [selectedAccountKey, setSelectedAccountKey] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<AccountSelection | null>(null);
  const initialRange = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState<string>(initialRange.start);
  const [endDate, setEndDate] = useState<string>(initialRange.end);
  const [results, setResults] = useState<ChartData[]>([]);
  const [aggregatedKPIs, setAggregatedKPIs] = useState<KPI[] | null>(null);
  const [aggregatedCount, setAggregatedCount] = useState(0);
  const [failedCompanies, setFailedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
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

  const isAllCompanies = selectedAccountKey === ALL_ACCOUNTS_ID;
  const selectedCompany = selectedAccount?.companyId ?? '';

  // Flat list of all accounts across companies for this platform — drives the AccountPicker.
  const platformAccounts = useMemo(
    () => buildAccountList(companies, platform.platformKey),
    [companies, platform.platformKey]
  );

  // Get dashboardConfig for selected company (behind the picked account)
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

  // Detect when the picked range is exactly one calendar month — controls "month-only" UI bits
  // like the QuickEvaluation widget that still needs a YYYY-MM key.
  const monthAlignedKey = useMemo(() => {
    if (!startDate || !endDate) return null;
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    if (sy !== ey || sm !== em || sd !== 1) return null;
    const lastDay = new Date(sy, sm, 0).getDate();
    if (ed !== lastDay) return null;
    return `${sy}-${String(sm).padStart(2, '0')}`;
  }, [startDate, endDate]);

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

  // Account is "available" once a selection exists; aggregate mode is always available.
  const platformAvailable = isAllCompanies || !!selectedAccount;

  useEffect(() => {
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
      .catch(err => console.error('[PlatformChartsPage] fetchSubscription', err));
  }, [platform.platformKey]);

  async function handleGenerate() {
    if (!isAllCompanies && !selectedAccount) {
      setError('Válassz fiókot!');
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

    // Params identifying the picked account — backend uses these to override connection resolution.
    const accountParams = selectedAccount
      ? { externalAccountId: selectedAccount.externalAccountId, provider: selectedAccount.provider }
      : {};

    try {
      if (isAllCompanies) {
        // Aggregate mode: iterate every account on this platform (across companies)
        const BATCH_SIZE = 3;
        const allKpis: KPI[][] = [];
        const failed: Company[] = [];

        for (let i = 0; i < platformAccounts.length; i += BATCH_SIZE) {
          const batch = platformAccounts.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(async (acc) => {
              const call = () => generateCharts({
                accountId: acc.companyId,
                startDate,
                endDate,
                charts: platformChartKeys.map(key => ({ key })),
                externalAccountId: acc.externalAccountId,
                provider: acc.provider,
              });
              try { return await call(); }
              catch (err) {
                console.error('[PlatformChartsPage] chart fetch retry', err);
                await new Promise(r => setTimeout(r, 2000));
                return call();
              }
            })
          );

          batchResults.forEach((result, idx) => {
            if (result.status === 'fulfilled' && result.value.charts.length > 0) {
              const accKpis = extractKPIs(platform.platformKey, result.value.charts);
              if (accKpis.some(k => typeof k.value === 'number' && k.value > 0)) {
                allKpis.push(accKpis);
              }
            } else {
              const acc = batch[idx];
              const company = companies.find(c => c.id === acc.companyId);
              if (company) failed.push(company);
            }
          });
        }

        setFailedCompanies(failed);

        if (allKpis.length === 0) {
          setError('Egyik fióknak sincs adata ezen a platformon a kiválasztott időszakban');
        } else {
          setAggregatedKPIs(mergeKPIs(allKpis));
          setAggregatedCount(allKpis.length);

          if (failed.length > 0) {
            const names = [...new Set(failed.map(c => c.name))].join(', ');
            setError(`${failed.length} fiók adatait nem sikerült lekérni (${names})`);
          }
        }
      } else if (selectedAccount) {
        // Single account: one request for the picked range, plus a same-length preceding window for the delta.
        const startMs = new Date(`${startDate}T00:00:00`).getTime();
        const endMs = new Date(`${endDate}T00:00:00`).getTime();
        const dayMs = 24 * 60 * 60 * 1000;
        const dayCount = Math.max(1, Math.round((endMs - startMs) / dayMs) + 1);
        const prevEnd = new Date(startMs - dayMs);
        const prevStart = new Date(prevEnd.getTime() - (dayCount - 1) * dayMs);
        const prevStartStr = toIsoDate(prevStart);
        const prevEndStr = toIsoDate(prevEnd);

        const [response, prevResponse] = await Promise.all([
          generateCharts({
            accountId: selectedAccount.companyId,
            startDate,
            endDate,
            charts: platformChartKeys.map(key => ({ key })),
            ...accountParams,
          }),
          generateCharts({
            accountId: selectedAccount.companyId,
            startDate: prevStartStr,
            endDate: prevEndStr,
            charts: platformChartKeys.map(key => ({ key })),
            ...accountParams,
          }).catch(() => null),
        ]);

        setResults(response.charts);

        if (prevResponse?.charts) {
          const currentKpis = extractKPIs(platform.platformKey, response.charts);
          const prevKpis = extractKPIs(platform.platformKey, prevResponse.charts);
          setPrevMonthKpis(computeKPIChanges(currentKpis, prevKpis));
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
    : results.length > 0;

  const rawKpis = kpis;
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
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Fiók kiválasztása</label>
              <AccountPicker
                companies={companies}
                platformKey={platform.platformKey}
                value={selectedAccountKey}
                onChange={(key, sel) => {
                  setSelectedAccountKey(key);
                  setSelectedAccount(sel);
                }}
                showAll
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Időszak</label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
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
              {hasResults && !isAllCompanies && (
                <>
                  {monthAlignedKey && (
                    <FeatureGate feature="email_reports" tier={userTier}>
                      <button
                        onClick={() => setShowEmailModal(true)}
                        className="btn-press py-3 px-4 rounded-xl bg-gradient-to-r from-[#1a6b8a] to-[#0d3b5e] text-white dark:text-[var(--surface)] hover:from-[#8ec8d8] hover:to-[#1a6b8a] flex items-center gap-2 font-bold"
                        title="Riport küldés emailben"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </FeatureGate>
                  )}
                  <FeatureGate feature="pdf_export" tier={userTier}>
                    <button
                      onClick={async () => {
                        if (!canUseFeature(userTier, 'pdf_export')) return;
                        setPdfExporting(true);
                        try {
                          const companyName = companies.find(c => c.id === selectedCompany)?.name || 'riport';
                          const pdfFilename = `${companyName}-${platform.label}-${startDate}_${endDate}`;

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

          {/* No accounts configured on this platform */}
          {platformAccounts.length === 0 && (
            <div className="mt-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">
                Még egyik cégnél sincs <strong>{platform.label}</strong> fiók konfigurálva.
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
              {!isAllCompanies && (() => {
                if (monthAlignedKey) {
                  const [y, mo] = monthAlignedKey.split('-').map(Number);
                  const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
                  return (
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">
                      {y}. {MONTHS[mo - 1]} számai
                    </p>
                  );
                }
                return (
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">
                    {startDate} — {endDate}
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
              {selectedCompany && !isAllCompanies && monthAlignedKey && (
                <QuickEvaluation companyId={selectedCompany} platformKey={platform.platformKey} month={monthAlignedKey} />
              )}
            </div>

            {/* Chart Sections - only for single company, single month */}
            {/* Chart layout toggle */}
            {!isAllCompanies && sections.length > 0 && (
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

            {!isAllCompanies && sections.map(({ category, label, charts }) => (
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
                        description={chart.description || undefined}
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

        {/* Loading state — skeleton placeholders */}
        {loading && !hasResults && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonKPI key={i} />)}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonChart key={i} />)}
            </div>
          </div>
        )}
      </div>
      {/* Email modal */}
      {showEmailModal && selectedCompany && !isAllCompanies && monthAlignedKey && (
        <SendReportModal
          companyId={selectedCompany}
          companyName={companies.find(c => c.id === selectedCompany)?.name || ''}
          platform={platform.platformKey}
          month={monthAlignedKey}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </WindsorKeyGuard>
  );
}
