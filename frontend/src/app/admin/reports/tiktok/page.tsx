'use client';

import { useState, useEffect } from 'react';
import { getCompanies, generateReport, Company, ReportResponse } from '@/lib/api';
import { ReportDashboard } from '@/components/ReportDashboard';
import { MonthPicker } from '@/components/MonthPicker';
import { CompanyPicker, ALL_COMPANIES_ID } from '@/components/CompanyPicker';
import { PlatformIcon } from '@/components/PlatformIcon';
import { KPICard } from '@/components/KPICard';
import { Loader2, AlertTriangle } from 'lucide-react';
import { WindsorKeyGuard } from '@/components/WindsorKeyGuard';

// ===== Raw totals for proper aggregation =====

interface RawTotals {
  currentFollowers: number;
  totalNewFollowers: number;
  totalViews: number;
  totalReach: number;
  totalLikes: number;       // daily likes
  totalComments: number;    // daily comments
  totalShares: number;      // daily shares
  totalProfileViews: number;
  videoCount: number;
  videoLikes: number;       // video-level likes
  videoComments: number;    // video-level comments
  videoShares: number;      // video-level shares
  videoNewFollowers: number;
  avgEngagement: number;    // weighted: sum of per-video ER
  avgFullWatchRate: number; // weighted: sum of per-video watch rate
}

function extractRawTotals(report: ReportResponse): RawTotals {
  const d = report.data.daily.totals;
  const v = report.data.video.totals;
  return {
    currentFollowers: d.currentFollowers,
    totalNewFollowers: d.totalNewFollowers,
    totalViews: v.totalViews,
    totalReach: v.totalReach,
    totalLikes: d.totalLikes,
    totalComments: d.totalComments,
    totalShares: d.totalShares,
    totalProfileViews: d.totalProfileViews,
    videoCount: v.videoCount,
    videoLikes: v.totalLikes,
    videoComments: v.totalComments,
    videoShares: v.totalShares,
    videoNewFollowers: v.totalNewFollowers,
    // Store weighted sum (avg * count) so we can average it later by dividing by total video count
    avgEngagement: (v.avgEngagement || 0) * v.videoCount,
    avgFullWatchRate: (v.avgFullWatchRate || 0) * v.videoCount,
  };
}

function mergeRawTotals(all: RawTotals[]): RawTotals {
  const merged: RawTotals = {
    currentFollowers: 0, totalNewFollowers: 0, totalViews: 0, totalReach: 0,
    totalLikes: 0, totalComments: 0, totalShares: 0, totalProfileViews: 0,
    videoCount: 0, videoLikes: 0, videoComments: 0, videoShares: 0,
    videoNewFollowers: 0, avgEngagement: 0, avgFullWatchRate: 0,
  };
  for (const r of all) {
    for (const key of Object.keys(merged) as (keyof RawTotals)[]) {
      (merged as any)[key] += r[key];
    }
  }
  return merged;
}

function hasData(r: RawTotals): boolean {
  return r.totalViews > 0 || r.totalLikes > 0 || r.currentFollowers > 0;
}

// ===== Display helpers =====

interface DisplayKPI {
  label: string;
  value: number | string;
}

function buildMainKPIs(r: RawTotals, isAggregate: boolean): DisplayKPI[] {
  // User requested average of individual video ERs: sum(video_ER) / count(videos)
  // r.avgEngagement stores the sum of ERs (see extractRawTotals)
  const er = r.videoCount > 0 ? r.avgEngagement / r.videoCount : 0;

  return [
    { label: isAggregate ? 'Össz követők' : 'Követők', value: r.currentFollowers },
    { label: 'Új követők', value: r.totalNewFollowers },
    { label: 'Megtekintések', value: r.totalViews },
    { label: 'Elérés', value: r.totalReach },
    { label: 'Like-ok', value: r.totalLikes },
    { label: 'Kommentek', value: r.totalComments },
    { label: 'Megosztások', value: r.totalShares },
    { label: 'Profilnézetek', value: r.totalProfileViews },
    { label: 'Videók', value: r.videoCount },
    { label: 'Átlag ER%', value: `${er.toFixed(2)}%` },
  ];
}

function buildSecondaryKPIs(r: RawTotals): DisplayKPI[] {
  const vc = r.videoCount || 1;
  const avgWatchRate = r.avgFullWatchRate / vc;

  return [
    { label: 'Megtekintés / videó', value: Math.round(r.totalViews / vc) },
    { label: 'Elérés / videó', value: Math.round(r.totalReach / vc) },
    { label: 'Like / videó', value: Math.round(r.videoLikes / vc) },
    { label: 'Komment / videó', value: Math.round(r.videoComments / vc) },
    { label: 'Megosztás / videó', value: Math.round(r.videoShares / vc) },
    { label: 'Új követő / videó', value: Math.round(r.videoNewFollowers / vc) },
    { label: 'Átl. végignézési arány', value: `${avgWatchRate.toFixed(1)}%` },
    { label: 'Like / megtekintés', value: `${r.totalViews > 0 ? ((r.videoLikes / r.totalViews) * 100).toFixed(2) : '0.00'}%` },
    { label: 'Komment / megtekintés', value: `${r.totalViews > 0 ? ((r.videoComments / r.totalViews) * 100).toFixed(2) : '0.00'}%` },
  ];
}

// ===== Batched fetching =====

async function fetchWithRetry(companyId: string, month: string): Promise<ReportResponse> {
  try {
    return await generateReport({ companyId, month });
  } catch {
    await new Promise(r => setTimeout(r, 2000));
    return generateReport({ companyId, month });
  }
}

async function fetchAllInBatches(
  companies: Company[],
  month: string,
  batchSize = 3,
): Promise<{ succeeded: { company: Company; report: ReportResponse }[]; failed: Company[] }> {
  const succeeded: { company: Company; report: ReportResponse }[] = [];
  const failed: Company[] = [];

  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(company => fetchWithRetry(company.id, month))
    );
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        succeeded.push({ company: batch[idx], report: result.value });
      } else {
        failed.push(batch[idx]);
      }
    });
  }

  return { succeeded, failed };
}

/** Generate array of month strings from endMonth going back periodMonths */
function generateMonths(endMonth: string, periodMonths: number): string[] {
  const [endYear, endMonthNum] = endMonth.split('-').map(Number);
  const months: string[] = [];
  for (let i = periodMonths - 1; i >= 0; i--) {
    const d = new Date(endYear, endMonthNum - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    months.push(`${y}-${String(m).padStart(2, '0')}`);
  }
  return months;
}

// ===== Component =====

export default function TikTokReportPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [periodMonths, setPeriodMonths] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [aggregatedTotals, setAggregatedTotals] = useState<RawTotals | null>(null);
  const [aggregatedCount, setAggregatedCount] = useState(0);
  const [companyConnections, setCompanyConnections] = useState<string[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  const isAllCompanies = selectedCompany === ALL_COMPANIES_ID;

  // Check platform availability
  const platformAvailable = !selectedCompany || isAllCompanies ||
    companyConnections.includes('TIKTOK_ORGANIC');

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(err => setError('Nem sikerült betölteni a cégeket: ' + err.message));

    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setSelectedMonth(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`);
  }, []);

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

  const handleGenerate = async () => {
    if (!selectedCompany || !selectedMonth) {
      setError('Kérlek válassz céget és hónapot!');
      return;
    }
    if (!isAllCompanies && !platformAvailable) {
      setError('Ennek a cégnek nincs TikTok integrációja beállítva');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);
    setAggregatedTotals(null);
    setAggregatedCount(0);

    try {
      if (periodMonths > 1 && !isAllCompanies) {
        // Multi-month, single company: fetch each month, aggregate
        const months = generateMonths(selectedMonth, periodMonths);
        const allRaw: RawTotals[] = [];

        for (const month of months) {
          try {
            const result = await fetchWithRetry(selectedCompany, month);
            const raw = extractRawTotals(result);
            if (hasData(raw)) allRaw.push(raw);
          } catch {
            // Skip failed months
          }
        }

        if (allRaw.length === 0) {
          setError('Nem sikerült adatot lekérni a megadott időszakra');
        } else {
          setAggregatedTotals(mergeRawTotals(allRaw));
          setAggregatedCount(allRaw.length);
        }
      } else if (isAllCompanies) {
        // All companies, single or multi-month
        if (periodMonths > 1) {
          // Multi-month + all companies
          const months = generateMonths(selectedMonth, periodMonths);
          const allRaw: RawTotals[] = [];

          for (const month of months) {
            const { succeeded } = await fetchAllInBatches(companies, month, 3);
            for (const { report: r } of succeeded) {
              const raw = extractRawTotals(r);
              if (hasData(raw)) allRaw.push(raw);
            }
          }

          if (allRaw.length === 0) {
            setError('Egyik cégnek sincs TikTok adata a kiválasztott időszakban');
          } else {
            setAggregatedTotals(mergeRawTotals(allRaw));
            setAggregatedCount(allRaw.length);
          }
        } else {
          // Single month, all companies (original logic)
          const { succeeded, failed } = await fetchAllInBatches(companies, selectedMonth, 3);

          const allRaw: RawTotals[] = [];
          for (const { report: r } of succeeded) {
            const raw = extractRawTotals(r);
            if (hasData(raw)) allRaw.push(raw);
          }

          if (allRaw.length === 0) {
            setError('Egyik cégnek sincs TikTok adata a kiválasztott hónapban');
          } else {
            setAggregatedTotals(mergeRawTotals(allRaw));
            setAggregatedCount(allRaw.length);

            if (failed.length > 0) {
              setError(`${failed.length} cég adatait nem sikerült lekérni: ${failed.map(c => c.name).join(', ')}`);
            }
          }
        }
      } else {
        // Single company, single month
        const result = await generateReport({ companyId: selectedCompany, month: selectedMonth });
        setReport(result);
      }
    } catch (err: any) {
      setError('Hiba történt: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const mainKPIs = aggregatedTotals ? buildMainKPIs(aggregatedTotals, isAllCompanies || periodMonths > 1) : [];
  const secondaryKPIs = aggregatedTotals ? buildSecondaryKPIs(aggregatedTotals) : [];

  const hasResults = isAllCompanies || periodMonths > 1 ? !!aggregatedTotals : !!report;

  const periodLabel = periodMonths > 1 && !isAllCompanies
    ? `${aggregatedCount} hónap`
    : isAllCompanies
      ? `${aggregatedCount} cég`
      : '';

  return (
    <WindsorKeyGuard>
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <PlatformIcon platform="tiktok" className="w-7 h-7" /> TikTok
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">TikTok havi riport generálása</p>
        </header>

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
              <MonthPicker
                value={selectedMonth}
                onChange={setSelectedMonth}
                periodMonths={periodMonths}
                onPeriodChange={setPeriodMonths}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={loading || (!isAllCompanies && !platformAvailable)}
                className="btn-press w-full font-bold py-3 px-6 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: 'color-mix(in srgb, var(--platform-tiktok) 35%, transparent)' }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generálás...</> : 'Riport generálása'}
              </button>
            </div>
          </div>

          {/* Platform not available warning */}
          {selectedCompany && !isAllCompanies && !connectionsLoading && !platformAvailable && (
            <div className="mt-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">
                Ennek a cégnek nincs <strong>TikTok</strong> integrációja beállítva.
                Először adj hozzá egy TikTok kapcsolatot a cég beállításainál.
              </span>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-4 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Aggregated KPI view (all companies or multi-month) */}
        {aggregatedTotals && (
          <div className="space-y-4 mb-8">
            {/* Main KPIs */}
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6">
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">
                Összesített TikTok KPI-ok ({periodLabel})
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {mainKPIs.map((kpi) => (
                  <KPICard key={kpi.label} label={kpi.label} value={kpi.value} />
                ))}
              </div>
            </div>

            {/* Secondary per-video stats */}
            {aggregatedTotals.videoCount > 0 && (
              <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-4">
                  Videónkénti átlagok
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {secondaryKPIs.map((kpi) => (
                    <KPICard key={kpi.label} label={kpi.label} value={kpi.value} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Single company full report (charts, demographics, etc.) */}
        {!isAllCompanies && periodMonths === 1 && report && <ReportDashboard report={report} />}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-[var(--text-secondary)]" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              {isAllCompanies
                ? `Összesítés... (${companies.length} cég${periodMonths > 1 ? `, ${periodMonths} hónap` : ''})`
                : periodMonths > 1
                  ? `Összesítés... (${periodMonths} hónap)`
                  : 'Riport generálása...'}
            </h2>
            <p className="text-[var(--text-secondary)]">Adatok lekérése és feldolgozása folyamatban</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasResults && (
          <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
            <PlatformIcon platform="tiktok" className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">TikTok havi riport</h2>
            <p className="text-[var(--text-secondary)]">Válassz céget és hónapot, majd generáld a riportot</p>
          </div>
        )}
      </div>
    </WindsorKeyGuard>
  );
}
