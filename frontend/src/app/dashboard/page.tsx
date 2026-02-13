'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { generateReport, ReportResponse } from '@/lib/api';
import { ReportDashboard } from '@/components/ReportDashboard';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);

  useEffect(() => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setSelectedMonth(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const companyId = session?.user?.companyId;

  const handleGenerate = async () => {
    if (!companyId || !selectedMonth) {
      setError('Nincs hozzárendelt cég vagy hónap nincs kiválasztva');
      return;
    }

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
  };

  if (!companyId) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🏢</div>
        <h2 className="text-2xl font-bold text-white mb-2">Nincs hozzárendelt cég</h2>
        <p className="text-slate-400">Kérd meg az adminisztrátort, hogy rendeljen hozzád egy céget.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Form */}
      <div className="bg-white/5 border border-white/15 rounded-3xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {!report && !loading && (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-white mb-2">TikTok havi riport</h2>
          <p className="text-slate-400">Válassz hónapot és generáld a riportot</p>
        </div>
      )}
    </div>
  );
}
