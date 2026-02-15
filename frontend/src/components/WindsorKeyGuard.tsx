'use client';

import { useState, useEffect, ReactNode } from 'react';
import { hasWindsorApiKey } from '@/app/admin/settings/actions';
import Link from 'next/link';
import { Key, ArrowRight } from 'lucide-react';

export function WindsorKeyGuard({ children }: { children: ReactNode }) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    hasWindsorApiKey().then(setHasKey);
  }, []);

  // Still loading
  if (hasKey === null) return <>{children}</>;

  if (!hasKey) {
    return (
      <div className="p-8">
        <div className="max-w-xl mx-auto mt-12">
          <div className="bg-[var(--surface-raised)] border border-amber-300 dark:border-amber-500/40 rounded-2xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto">
              <Key className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Windsor API kulcs szükséges
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              A riportok, chartok és szinkronizáció használatához először add meg a Windsor API kulcsod a Beállítások oldalon.
            </p>
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:brightness-110 transition-all"
            >
              Beállítások megnyitása
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
