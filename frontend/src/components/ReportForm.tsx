'use client';

import { Company } from '@/lib/api';

interface Props {
  companies?: Company[];
  selectedCompany: string;
  onCompanyChange?: (id: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
  companyName?: string; // For fixed company mode (client)
}

export function ReportForm({
  companies,
  selectedCompany,
  onCompanyChange,
  selectedMonth,
  onMonthChange,
  onGenerate,
  loading,
  error,
  companyName,
}: Props) {
  return (
    <div className="bg-white/5 border border-white/15 rounded-3xl p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Company selector or fixed company display */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
            {companyName ? 'Cég' : 'Cég kiválasztása'}
          </label>
          {companyName ? (
            <div className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold">
              {companyName}
            </div>
          ) : (
            <select
              value={selectedCompany}
              onChange={(e) => onCompanyChange?.(e.target.value)}
              className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Válassz céget...</option>
              {companies?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Hónap</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={onGenerate}
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
  );
}
