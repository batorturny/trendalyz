'use client';

import { Company } from '@/lib/api';
import { MonthPicker } from './MonthPicker';

interface Props {
  companies?: Company[];
  selectedCompany: string;
  onCompanyChange?: (id: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
  companyName?: string;
}

const inputClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors";

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
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-8 shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Company selector or fixed company display */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
            {companyName ? 'Cég' : 'Cég kiválasztása'}
          </label>
          {companyName ? (
            <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold">
              {companyName}
            </div>
          ) : (
            <select
              value={selectedCompany}
              onChange={(e) => onCompanyChange?.(e.target.value)}
              className={inputClass}
            >
              <option value="">Válassz céget...</option>
              {companies?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Hónap</label>
          <MonthPicker value={selectedMonth} onChange={onMonthChange} />
        </div>

        <div className="flex items-end">
          <button
            onClick={onGenerate}
            disabled={loading}
            className="btn-press w-full bg-[var(--accent)]/30 font-bold py-3 px-6 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generálás...' : 'Riport generálása'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-xl p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
