'use client';

import { useEffect, useState } from 'react';
import type { ConnectionProvider, WindsorDiscoveredAccount } from '@/types/integration';

interface Props {
  provider: ConnectionProvider;
  existingAccountIds: string[];
  onSelect: (accountId: string, accountName: string) => void;
  onEmpty?: () => void;
}

export function WindsorAccountPicker({ provider, existingAccountIds, onSelect, onEmpty }: Props) {
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
        const accts = data.accounts || [];
        setAccounts(accts);
        if (accts.length === 0) onEmpty?.();
      })
      .catch(() => {
        onEmpty?.();
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
    return null;
  }

  if (accounts.length === 0) {
    return null;
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
