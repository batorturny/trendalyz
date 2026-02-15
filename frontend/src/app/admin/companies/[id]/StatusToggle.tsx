'use client';

import { useState, useTransition } from 'react';
import { toggleCompanyStatus } from '../actions';

interface Props {
  companyId: string;
  isActive: boolean;
}

export function StatusToggle({ companyId, isActive: initialActive }: Props) {
  const [active, setActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newActive = !active;
    setActive(newActive);
    startTransition(async () => {
      try {
        await toggleCompanyStatus(companyId, newActive ? 'ACTIVE' : 'INACTIVE');
      } catch {
        setActive(!newActive); // revert on error
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="flex items-center gap-3 group"
    >
      {/* Track */}
      <span
        className={`
          relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
          ${active ? 'bg-emerald-500' : 'bg-[var(--border)]'}
          ${isPending ? 'opacity-60' : ''}
        `}
      >
        {/* Thumb */}
        <span
          className={`
            pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg
            ring-0 transition-transform duration-200 ease-in-out
            ${active ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </span>

      {/* Label */}
      <span className={`text-sm font-semibold ${active ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
        {active ? 'Aktív' : 'Inaktív'}
      </span>
    </button>
  );
}
