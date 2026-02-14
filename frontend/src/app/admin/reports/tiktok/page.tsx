'use client';

import { useState, useEffect } from 'react';
import { getCompanies, generateReport, Company, ReportResponse } from '@/lib/api';
import { ReportDashboard } from '@/components/ReportDashboard';
import { MonthPicker } from '@/components/MonthPicker';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Loader2 } from 'lucide-react';

const inputClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors";

export default function TikTokReportPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(err => setError('Nem sikerült betölteni a cégeket: ' + err.message));

    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setSelectedMonth(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const handleGenerate = async () => {
    if (!selectedCompany || !selectedMonth) {
      setError('Kérlek válassz céget és hónapot!');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await generateReport({ companyId: selectedCompany, month: selectedMonth });
      setReport(result);
    } catch (err: any) {
      setError('Hiba történt: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className={inputClass}
            >
              <option value="">Válassz céget...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
              style={{ backgroundColor: 'color-mix(in srgb, var(--platform-tiktok) 35%, transparent)' }}
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

      {report && <ReportDashboard report={report} />}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-[var(--text-secondary)]" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Riport generálása...</h2>
          <p className="text-[var(--text-secondary)]">Adatok lekérése és feldolgozása folyamatban</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !report && (
        <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
          <PlatformIcon platform="tiktok" className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">TikTok havi riport</h2>
          <p className="text-[var(--text-secondary)]">Válassz céget és hónapot, majd generáld a riportot</p>
        </div>
      )}
    </div>
  );
}
