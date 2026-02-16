'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getChartCatalog, generateCharts, ChartDefinition, ChartData } from '@/lib/api';
import { extractKPIs, groupByCategory } from '@/lib/chartHelpers';
import { Building2 } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { ChartLazy as Chart } from '@/components/ChartLazy';
import { VideoTable } from '@/components/VideoTable';
import { MonthPicker } from '@/components/MonthPicker';

interface PlatformConfig {
  platformKey: string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  headerGradient: string;
  borderColor: string;
}

// ===== Component =====

export function ClientPlatformPage({ platform }: { platform: PlatformConfig }) {
  const { data: session, status } = useSession();
  const [allCatalog, setAllCatalog] = useState<ChartDefinition[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [results, setResults] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoLoaded, setAutoLoaded] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const companyId = session?.user?.companyId;

  const platformCatalog = useMemo(
    () => allCatalog.filter(c => c.platform === platform.platformKey),
    [allCatalog, platform.platformKey]
  );
  const platformChartKeys = useMemo(() => platformCatalog.map(c => c.key), [platformCatalog]);
  const kpis = useMemo(() => extractKPIs(platform.platformKey, results), [platform.platformKey, results]);
  const sections = useMemo(() => groupByCategory(platformCatalog, results), [platformCatalog, results]);

  useEffect(() => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setSelectedMonth(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`);

    getChartCatalog()
      .then(data => setAllCatalog(data.charts))
      .catch(() => setError('Nem sikerült betölteni a chart katalógust'));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!companyId || !selectedMonth || platformChartKeys.length === 0) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = `${selectedMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

      const response = await generateCharts({
        accountId: companyId,
        startDate,
        endDate,
        charts: platformChartKeys.map(key => ({ key })),
      });
      setResults(response.charts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedMonth, platformChartKeys]);

  // Auto-generate on first load
  useEffect(() => {
    if (companyId && selectedMonth && platformChartKeys.length > 0 && status === 'authenticated' && !autoLoaded) {
      setAutoLoaded(true);
      handleGenerate();
    }
  }, [companyId, selectedMonth, platformChartKeys, status, autoLoaded, handleGenerate]);

  async function handleExportPdf() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const { exportPdf } = await import('@/lib/exportPdf');
      await exportPdf(reportRef.current, `${platform.label}_riport_${selectedMonth}`);
    } catch (err) {
      console.error('PDF export error:', err);
      setError('PDF letöltés sikertelen: ' + (err instanceof Error ? err.message : 'Ismeretlen hiba'));
    } finally {
      setExporting(false);
    }
  }

  if (!companyId) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Nincs hozzárendelt cég</h2>
        <p className="text-[var(--text-secondary)]">Kérd meg az adminisztrátort, hogy rendeljen hozzád egy céget.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div data-no-print className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-8 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Hónap</label>
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full text-white font-bold py-3 px-6 rounded-xl hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              style={{ backgroundColor: platform.borderColor }}
            >
              {loading ? 'Generálás...' : 'Riport generálása'}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExportPdf}
              disabled={results.length === 0 || exporting}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] font-bold py-3 px-6 rounded-xl hover:bg-[var(--accent-subtle)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {exporting ? 'PDF készítése...' : 'Letöltés PDF-ben'}
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
            {/* KPI Header */}
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {kpis.map((kpi) => (
                  <KPICard key={kpi.label} label={kpi.label} value={kpi.value} change={kpi.change} />
                ))}
              </div>
            </div>

            {/* Chart Sections */}
            {sections.map(({ category, label, charts }) => (
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
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
          <div className="mb-4 animate-pulse flex justify-center">{platform.icon}</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Riport generálása...</h2>
          <p className="text-[var(--text-secondary)]">Adatok lekérése és feldolgozása folyamatban</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && autoLoaded && (
        <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
          <div className="mb-4 flex justify-center">{platform.icon}</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Nincs adat</h2>
          <p className="text-[var(--text-secondary)]">Ehhez a hónaphoz nem található adat. Próbálj másik hónapot választani.</p>
        </div>
      )}
    </div>
  );
}
