'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { updateEmailSchedule } from '../actions';

function CustomSelect({
  value,
  options,
  onChange,
}: {
  value: number;
  options: { value: number; label: string }[];
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] min-w-[90px] hover:border-[var(--accent)] transition-colors"
      >
        <span className="flex-1 text-left">{selected?.label}</span>
        <svg className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] shadow-lg"
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              data-active={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                o.value === value
                  ? 'bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white'
                  : 'text-[var(--text-primary)] hover:bg-[var(--surface)]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmailSchedule({
  companyId,
  initialDay,
  initialHour,
}: {
  companyId: string;
  initialDay: number;
  initialHour: number;
}) {
  const [day, setDay] = useState(initialDay);
  const [hour, setHour] = useState(initialHour);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const hasChanges = day !== initialDay || hour !== initialHour;

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateEmailSchedule(companyId, day, hour);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const dayOptions = Array.from({ length: 28 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}.`,
  }));

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${String(i).padStart(2, '0')}:00`,
  }));

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
      <h3 className="text-base font-semibold mb-1">Automatikus email ütemezés</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Válaszd ki, hogy a havi riport emailt a hónap melyik napján és hány órakor kapják az ügyfelek.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Hónap napja
          </label>
          <CustomSelect value={day} options={dayOptions} onChange={setDay} />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Óra (UTC)
          </label>
          <CustomSelect value={hour} options={hourOptions} onChange={setHour} />
        </div>

        <button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {isPending ? 'Mentés...' : saved ? 'Mentve!' : 'Mentés'}
        </button>
      </div>
    </div>
  );
}
