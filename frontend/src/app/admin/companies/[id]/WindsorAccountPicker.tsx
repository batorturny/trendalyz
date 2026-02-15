'use client';

import { useEffect, useState } from 'react';
import type { ConnectionProvider, WindsorDiscoveredAccount } from '@/types/integration';

interface Props {
  provider: ConnectionProvider;
  existingAccountIds: string[];
  onSelect: (accountId: string, accountName: string) => void;
}

export function WindsorAccountPicker({ provider, existingAccountIds, onSelect }: Props) {
  const [accounts, setAccounts] = useState<WindsorDiscoveredAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedId(null);

    fetch(`/api/windsor/discover?provider=${encodeURIComponent(provider)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setAccounts(data.accounts || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [provider]);

  const handleSelect = (account: WindsorDiscoveredAccount) => {
    setSelectedId(account.accountId);
    onSelect(account.accountId, account.accountName);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase">Windsor-ben talált fiókok</div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
          <div className="w-4 h-4 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--text-secondary)]">Fiókok betöltése...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase">Windsor-ben talált fiókok</div>
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
          <p className="text-sm text-red-700 dark:text-red-300">Nem sikerült betölteni a fiókokat: {error}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Használd a manuális megadást lentebb.</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase">Windsor-ben talált fiókok</div>
        <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
          <p className="text-sm text-[var(--text-secondary)]">Nem található kapcsolt fiók a Windsor-ben ehhez a platformhoz.</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-70">Használd a manuális megadást lentebb.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-[var(--text-secondary)] uppercase">Windsor-ben talált fiókok</div>
      <div className="space-y-2">
        {accounts.map((account) => {
          const alreadyAdded = existingAccountIds.includes(account.accountId);
          const isSelected = selectedId === account.accountId;

          return (
            <button
              key={account.accountId}
              type="button"
              onClick={() => !alreadyAdded && handleSelect(account)}
              disabled={alreadyAdded}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                alreadyAdded
                  ? 'border-[var(--border)] opacity-40 cursor-not-allowed'
                  : isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                    : 'border-[var(--border)] hover:bg-[var(--accent-subtle)]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'border-[var(--accent)]' : 'border-[var(--text-secondary)]'
              }`}>
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">{account.accountName}</div>
                <div className="text-xs text-[var(--text-secondary)] font-mono truncate">{account.accountId}</div>
              </div>
              {alreadyAdded && (
                <span className="text-xs text-[var(--success)] flex-shrink-0">Már hozzáadva</span>
              )}
              {!alreadyAdded && account.hasData && (
                <span className="text-xs text-[var(--success)] flex-shrink-0">Aktív</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
