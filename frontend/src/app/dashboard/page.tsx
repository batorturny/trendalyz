'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { generateReport, ReportResponse } from '@/lib/api';
import { Building2 } from 'lucide-react';
import { ReportDashboard } from '@/components/ReportDashboard';
import { MonthPicker } from '@/components/MonthPicker';
// exportPdf is loaded dynamically on demand to avoid bundling jspdf + html-to-image
import { PlatformIcon } from '@/components/PlatformIcon';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [autoLoaded, setAutoLoaded] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const companyId = session?.user?.companyId;

  // Set default month
  useEffect(() => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setSelectedMonth(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!companyId || !selectedMonth) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await generateReport({ companyId, month: selectedMonth });
      setReport(result);
    } catch (err: any) {
      setError('Hiba történt: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedMonth]);

  // Auto-generate on first load
  useEffect(() => {
    if (companyId && selectedMonth && status === 'authenticated' && !autoLoaded) {
      setAutoLoaded(true);
      handleGenerate();
    }
  }, [companyId, selectedMonth, status, autoLoaded, handleGenerate]);

  async function handleExportPdf() {
    if (!reportRef.current || !report) return;
    setExporting(true);
    try {
      const { exportPdf } = await import('@/lib/exportPdf');
      await exportPdf(reportRef.current, `TikTok_riport_${report.company.name}_${selectedMonth}`);
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
              className="btn-press w-full font-bold py-3 px-6 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'color-mix(in srgb, var(--platform-tiktok) 35%, transparent)' }}
            >
              {loading ? 'Generálás...' : 'Riport generálása'}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExportPdf}
              disabled={!report || exporting}
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

      <div ref={reportRef}>
        {report && <ReportDashboard report={report} />}
      </div>

      {loading && (
        <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
          <div className="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--platform-tiktok)]" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Riport generálása...</h2>
          <p className="text-[var(--text-secondary)]">Adatok lekérése és feldolgozása folyamatban</p>
        </div>
      )}

      {!report && !loading && (
        <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
          <PlatformIcon platform="tiktok" className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">TikTok havi riport</h2>
          <p className="text-[var(--text-secondary)]">Válassz hónapot, majd generáld a riportot</p>
        </div>
      )}
    </div>
  );
}
