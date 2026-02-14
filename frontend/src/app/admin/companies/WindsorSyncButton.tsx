'use client';

import { useState } from 'react';
import { syncWindsorAccounts } from './actions';
import { RefreshCw } from 'lucide-react';

export function WindsorSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    discovered: number;
    created: number;
    skipped: number;
    details: string[];
  } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await syncWindsorAccounts();
      setResult(res);
    } catch (err) {
      setResult({
        discovered: 0,
        created: 0,
        skipped: 0,
        details: [err instanceof Error ? err.message : 'Hiba tortent'],
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="px-4 py-2 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-bold rounded-xl hover:bg-[var(--accent-subtle)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        {syncing ? (
          <>
            <span className="w-4 h-4 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
            Szinkronizalas...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Windsor szinkronizalas
          </>
        )}
      </button>

      {result && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-lg)] z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--text-primary)]">Eredmeny</span>
            <button onClick={() => setResult(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">&times;</button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-[var(--surface-raised)] rounded-lg">
              <div className="text-lg font-bold text-[var(--text-primary)]">{result.discovered}</div>
              <div className="text-[10px] text-[var(--text-secondary)]">Talalt</div>
            </div>
            <div className="text-center p-2 bg-[var(--surface-raised)] rounded-lg">
              <div className="text-lg font-bold text-[var(--success)]">{result.created}</div>
              <div className="text-[10px] text-[var(--text-secondary)]">Uj</div>
            </div>
            <div className="text-center p-2 bg-[var(--surface-raised)] rounded-lg">
              <div className="text-lg font-bold text-[var(--text-secondary)]">{result.skipped}</div>
              <div className="text-[10px] text-[var(--text-secondary)]">Meglevo</div>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {result.details.map((d, i) => (
              <div key={i} className="text-xs text-[var(--text-secondary)] py-1 border-t border-[var(--border)]">
                {d}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
