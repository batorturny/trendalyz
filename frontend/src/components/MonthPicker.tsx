'use client';

import { useState, useRef, useEffect } from 'react';

const MONTH_NAMES = [
  'Január', 'Február', 'Március', 'Április',
  'Május', 'Június', 'Július', 'Augusztus',
  'Szeptember', 'Október', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Már', 'Ápr',
  'Máj', 'Jún', 'Júl', 'Aug',
  'Sze', 'Okt', 'Nov', 'Dec',
];

interface MonthPickerProps {
  value: string; // YYYY-MM format
  onChange: (value: string) => void;
  periodMonths?: number; // current period (1 = single month)
  onPeriodChange?: (months: number) => void; // callback when period changes
}

/** Calculate the month string N months before a given YYYY-MM */
function subtractMonths(yyyyMm: string, n: number): string {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y, m - 1 - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthPicker({ value, onChange, periodMonths = 1, onPeriodChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Parse current value
  const [selectedYear, selectedMonthIdx] = value
    ? value.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];

  const [viewYear, setViewYear] = useState(selectedYear);

  // Sync viewYear when value changes
  useEffect(() => {
    if (value) {
      setViewYear(Number(value.split('-')[0]));
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleSelect = (monthIdx: number) => {
    const mm = String(monthIdx).padStart(2, '0');
    onChange(`${viewYear}-${mm}`);
    onPeriodChange?.(1); // reset to single month on manual pick
    setOpen(false);
  };

  const handlePeriod = (months: number) => {
    const now = new Date();
    // End month = previous completed month
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    onChange(endMonthStr);
    setViewYear(prevMonth.getFullYear());
    onPeriodChange?.(months);
    setOpen(false);
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Build display text
  let displayText: string;
  if (!value) {
    displayText = 'Válassz hónapot...';
  } else if (periodMonths > 1) {
    const startMonth = subtractMonths(value, periodMonths - 1);
    const [sy, sm] = startMonth.split('-').map(Number);
    displayText = `${sy}. ${MONTH_NAMES[sm - 1]} – ${selectedYear}. ${MONTH_NAMES[selectedMonthIdx - 1]} (${periodMonths} hó)`;
  } else {
    displayText = `${selectedYear}. ${MONTH_NAMES[selectedMonthIdx - 1]}`;
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-left font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all flex items-center justify-between gap-2 hover:border-[var(--text-secondary)]"
      >
        <span className={value ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
          {displayText}
        </span>
        <svg
          className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden">
          {/* Year navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <button
              type="button"
              onClick={() => setViewYear(y => y - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-bold text-[var(--text-primary)]">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear(y => y + 1)}
              disabled={viewYear >= currentYear}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5 p-3">
            {MONTH_SHORT.map((name, idx) => {
              const monthNum = idx + 1;
              const isSelected = periodMonths === 1 && viewYear === selectedYear && monthNum === selectedMonthIdx;
              const isFuture = viewYear > currentYear || (viewYear === currentYear && monthNum > currentMonth);
              const isCurrent = viewYear === currentYear && monthNum === currentMonth;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !isFuture && handleSelect(monthNum)}
                  disabled={isFuture}
                  className={`
                    px-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${isSelected
                      ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
                      : isFuture
                        ? 'text-[var(--text-secondary)] opacity-30 cursor-not-allowed'
                        : isCurrent
                          ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)] hover:bg-[var(--accent-subtle)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => {
                const prev = new Date(currentYear, currentMonth - 2, 1);
                handleSelect(prev.getMonth() + 1);
                setViewYear(prev.getFullYear());
              }}
              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Elozo honap
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelect(currentMonth);
                setViewYear(currentYear);
              }}
              className="text-xs font-semibold text-[var(--text-primary)] hover:opacity-70 transition-colors"
            >
              Aktualis honap
            </button>
          </div>

          {/* Period quick buttons */}
          {onPeriodChange && (
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mr-auto">Időszak</span>
              <button
                type="button"
                onClick={() => handlePeriod(3)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  periodMonths === 3
                    ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
                    : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
                }`}
              >
                3 hónap
              </button>
              <button
                type="button"
                onClick={() => handlePeriod(6)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  periodMonths === 6
                    ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
                    : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
                }`}
              >
                6 hónap
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
