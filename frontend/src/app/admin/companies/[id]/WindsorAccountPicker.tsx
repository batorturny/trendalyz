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
        <div className="text-xs font-bold text-slate-400 uppercase">Windsor-ben talalt fiokok</div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-white/10">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-300">Fiokok betoltese...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase">Windsor-ben talalt fiokok</div>
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-300">Nem sikerult betolteni a fiokokat: {error}</p>
          <p className="text-xs text-slate-400 mt-1">Hasznald a manualis megadast lentebb.</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase">Windsor-ben talalt fiokok</div>
        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10">
          <p className="text-sm text-slate-400">Nem talalhato kapcsolt fiok a Windsor-ben ehhez a platformhoz.</p>
          <p className="text-xs text-slate-500 mt-1">Hasznald a manualis megadast lentebb.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-slate-400 uppercase">Windsor-ben talalt fiokok</div>
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
                  ? 'border-white/5 opacity-40 cursor-not-allowed'
                  : isSelected
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/10 hover:border-white/25 hover:bg-white/5'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'border-cyan-400' : 'border-slate-500'
              }`}>
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{account.accountName}</div>
                <div className="text-xs text-slate-500 font-mono truncate">{account.accountId}</div>
              </div>
              {alreadyAdded && (
                <span className="text-xs text-cyan-400 flex-shrink-0">Mar hozzaadva</span>
              )}
              {!alreadyAdded && account.hasData && (
                <span className="text-xs text-green-400 flex-shrink-0">Aktiv</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
