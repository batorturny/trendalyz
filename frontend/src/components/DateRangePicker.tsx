'use client';

import { CalendarDays } from 'lucide-react';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function previousMonthRange(): { start: string; end: string } {
  const now = new Date();
  const firstOfThis = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfPrev = new Date(firstOfThis.getTime() - 24 * 60 * 60 * 1000);
  const firstOfPrev = new Date(lastOfPrev.getFullYear(), lastOfPrev.getMonth(), 1);
  return { start: toIsoDate(firstOfPrev), end: toIsoDate(lastOfPrev) };
}

export interface RangePreset {
  label: string;
  range: () => { start: string; end: string };
}

export const DEFAULT_PRESETS: RangePreset[] = [
  {
    label: 'Tegnap',
    range: () => {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const iso = toIsoDate(y);
      return { start: iso, end: iso };
    },
  },
  {
    label: 'Elmúlt 7 nap',
    range: () => {
      const end = new Date(); end.setDate(end.getDate() - 1);
      const start = new Date(end); start.setDate(end.getDate() - 6);
      return { start: toIsoDate(start), end: toIsoDate(end) };
    },
  },
  {
    label: 'Elmúlt 30 nap',
    range: () => {
      const end = new Date(); end.setDate(end.getDate() - 1);
      const start = new Date(end); start.setDate(end.getDate() - 29);
      return { start: toIsoDate(start), end: toIsoDate(end) };
    },
  },
  {
    label: 'Elmúlt hónap',
    range: () => previousMonthRange(),
  },
  {
    label: 'Elmúlt 3 hónap',
    range: () => {
      const { end } = previousMonthRange();
      const e = new Date(end);
      const s = new Date(e.getFullYear(), e.getMonth() - 2, 1);
      return { start: toIsoDate(s), end };
    },
  },
  {
    label: 'Elmúlt 6 hónap',
    range: () => {
      const { end } = previousMonthRange();
      const e = new Date(end);
      const s = new Date(e.getFullYear(), e.getMonth() - 5, 1);
      return { start: toIsoDate(s), end };
    },
  },
];

export function getDefaultRange(): { start: string; end: string } {
  return previousMonthRange();
}

interface Props {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  presets?: RangePreset[];
}

export function DateRangePicker({ startDate, endDate, onChange, presets = DEFAULT_PRESETS }: Props) {
  const today = toIsoDate(new Date());

  const activeIdx = (() => {
    for (let i = 0; i < presets.length; i++) {
      const r = presets[i].range();
      if (r.start === startDate && r.end === endDate) return i;
    }
    return -1;
  })();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          max={endDate || today}
          onChange={(e) => onChange(e.target.value, endDate)}
          className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <span className="text-[var(--text-secondary)] font-bold px-1">&mdash;</span>
        <input
          type="date"
          value={endDate}
          max={today}
          onChange={(e) => onChange(startDate, e.target.value)}
          className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <CalendarDays className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        {presets.map((p, i) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              const r = p.range();
              onChange(r.start, r.end);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${activeIdx === i
              ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
              : 'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
