'use client';

import { useState, useTransition } from 'react';
import { updateEmailSchedule } from '../actions';

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

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
      <h3 className="text-base font-semibold mb-1">Automatikus email ütemezés</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Válaszd ki, hogy a havi riport emailt a hónap melyik napján és hány órakor kapják az ügyfelek.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Hónap napja
          </label>
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] min-w-[80px]"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}.
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Óra (UTC)
          </label>
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] min-w-[80px]"
          >
            {Array.from({ length: 24 }, (_, i) => i).map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isPending ? 'Mentés...' : saved ? 'Mentve!' : 'Mentés'}
        </button>
      </div>
    </div>
  );
}
