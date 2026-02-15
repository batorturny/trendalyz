'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SyncWizard } from './SyncWizard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function SyncAllButton({ hasWindsorKey }: { hasWindsorKey: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!hasWindsorKey) {
    return (
      <Link
        href="/admin/settings"
        className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
        title="Először add meg a Windsor API kulcsot a Beállításokban"
      >
        <RefreshCw className="w-4 h-4" />
        API kulcs szükséges
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-bold rounded-xl hover:bg-[var(--accent-subtle)] transition-all flex items-center gap-2 active:scale-[0.97]"
      >
        <RefreshCw className="w-4 h-4" />
        Összes platform szinkronizálása
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
