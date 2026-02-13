'use client';

import { useState, useEffect } from 'react';
import { getCompanies, generateReport, Company, ReportResponse } from '@/lib/api';
import { ReportDashboard } from '@/components/ReportDashboard';

export default function AdminReportsPage() {
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
        <h1 className="text-3xl font-black">Riportok</h1>
        <p className="text-slate-400 mt-1">TikTok havi riport generálása</p>
      </header>

      {/* Form */}
      <div className="bg-white/5 border border-white/15 rounded-3xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cég kiválasztása</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Válassz céget...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Hónap</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Generálás...' : 'Riport generálása'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300">
            {error}
          </div>
        )}
      </div>

      {report && <ReportDashboard report={report} />}
    </div>
  );
}
