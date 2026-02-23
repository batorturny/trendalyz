'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SyncWizard } from './SyncWizard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function SyncAllButton({ hasWindsorKey }: { hasWindsorKey: boolean }) {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();

  if (!hasWindsorKey) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowTooltip(!showTooltip)}
          className="px-4 py-2 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-bold rounded-xl transition-all flex items-center gap-2 cursor-not-allowed opacity-60"
        >
          <RefreshCw className="w-4 h-4" />
          Szinkronizálás
        </button>
        {showTooltip && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowTooltip(false)} />
            <div className="absolute right-0 top-full mt-2 z-50 w-72 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] shadow-lg">
              <p className="text-sm text-[var(--text-primary)] font-medium mb-2">
                Szinkronizáláshoz saját Windsor API kulcs szükséges.
              </p>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                A Beállítások oldalon tudod megadni az API kulcsot.
              </p>
              <Link
                href="/admin/settings"
                className="inline-block px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] hover:brightness-110 transition-all"
              >
                Beállítások
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-bold rounded-xl hover:bg-[var(--accent-subtle)] transition-all flex items-center gap-2 active:scale-[0.97]"
      >
        <RefreshCw className="w-4 h-4" />
        Szinkronizálás
      </button>
      {open && (
        <SyncWizard
          onComplete={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
