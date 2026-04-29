'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown } from 'lucide-react';

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

const MONTH_HU = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];

function formatHu(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}. ${MONTH_HU[m - 1]} ${d}.`;
}

function resolve(start: string, end: string, presets: RangePreset[]): { label: string; subtitle: string | null; activeIdx: number } {
  for (let i = 0; i < presets.length; i++) {
    const r = presets[i].range();
    if (r.start === start && r.end === end) {
      return { label: presets[i].label, subtitle: `${formatHu(start)} – ${formatHu(end)}`, activeIdx: i };
    }
  }
  if (start && end && start === end) return { label: formatHu(start), subtitle: null, activeIdx: -1 };
  if (start && end) return { label: `${formatHu(start)} – ${formatHu(end)}`, subtitle: null, activeIdx: -1 };
  return { label: 'Válassz időszakot...', subtitle: null, activeIdx: -1 };
}

interface Props {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  presets?: RangePreset[];
}

export function DateRangePicker({ startDate, endDate, onChange, presets = DEFAULT_PRESETS }: Props) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setDraftStart(startDate);
      setDraftEnd(endDate);
    }
  }, [open, startDate, endDate]);

  const today = toIsoDate(new Date());
  const { label, subtitle, activeIdx: activePresetIdx } = resolve(startDate, endDate, presets);

  const applyPreset = (preset: RangePreset) => {
    const r = preset.range();
    onChange(r.start, r.end);
    setOpen(false);
  };

  const applyCustom = () => {
    if (!draftStart || !draftEnd) return;
    if (draftStart > draftEnd) return;
    onChange(draftStart, draftEnd);
    setOpen(false);
  };

  const customDirty = draftStart !== startDate || draftEnd !== endDate;
  const customInvalid = !draftStart || !draftEnd || draftStart > draftEnd;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-left focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all flex items-center justify-between gap-3 hover:border-[var(--text-secondary)]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarDays className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-[var(--text-primary)] truncate">{label}</div>
            {subtitle && (
              <div className="text-xs text-[var(--text-secondary)] truncate">{subtitle}</div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 w-full min-w-[320px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-[var(--border)] bg-[var(--surface-raised)]">
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Gyors választás</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-2">
            {presets.map((p, i) => {
              const active = i === activePresetIdx;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between gap-2 ${active
                    ? 'bg-[var(--accent)] text-white dark:text-[var(--surface)]'
                    : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-subtle)]'
                  }`}
                >
                  <span>{p.label}</span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--surface-raised)]">
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Egyéni időszak</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={draftStart}
                max={draftEnd || today}
                onChange={(e) => setDraftStart(e.target.value)}
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <span className="text-[var(--text-secondary)] font-bold">—</span>
              <input
                type="date"
                value={draftEnd}
                max={today}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <button
              type="button"
              onClick={applyCustom}
              disabled={!customDirty || customInvalid}
              className="mt-2 w-full bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold py-2 px-3 rounded-lg text-sm hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Alkalmaz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
