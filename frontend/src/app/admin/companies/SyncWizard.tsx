'use client';

import { useState, useCallback, useEffect } from 'react';
import { syncAllPlatforms, executeSyncPlan } from './actions';
import type { SyncDiscoveryResult, SyncPlanGroup } from './actions';
import type { AccountGroup, DiscoveredAccount, ExistingCompany } from '@/lib/accountGrouping';
import { PROVIDERS, getProviderMeta } from '@/types/integration';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';
import { X, Check, ChevronDown, SkipForward, Loader2 } from 'lucide-react';

type Step = 'idle' | 'loading' | 'review' | 'executing' | 'done';

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'text-[var(--platform-tiktok)]',
  facebook: 'text-[var(--platform-facebook)]',
  instagram: 'text-[var(--platform-instagram)]',
  youtube: 'text-[var(--platform-youtube)]',
};

export function SyncWizard({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<Step>('loading');
  const [discovery, setDiscovery] = useState<SyncDiscoveryResult | null>(null);
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; details: string[] } | null>(null);

  // Auto-start discovery on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await syncAllPlatforms();
        if (cancelled) return;
        setDiscovery(res);
        setGroups(res.groups);
        setStep('review');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Hiba történt a szinkronizálás során');
        setStep('review');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleExecute = useCallback(async () => {
    setStep('executing');
    try {
      const plan: SyncPlanGroup[] = groups.map(g => ({
        companyName: g.companyName,
        existingCompanyId: g.existingCompanyId,
        skip: g.skip,
        accounts: g.accounts.map(a => ({
          provider: a.provider,
          accountId: a.accountId,
          accountName: a.accountName,
        })),
      }));
      const res = await executeSyncPlan(plan);
      setResult(res);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
      setStep('review');
    }
  }, [groups]);

  const handleClose = useCallback(() => {
    setStep('idle');
    setDiscovery(null);
    setGroups([]);
    setResult(null);
    setError(null);
    onComplete?.();
  }, [onComplete]);

  const updateGroup = useCallback((id: string, update: Partial<AccountGroup>) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...update } : g));
  }, []);

  const moveAccount = useCallback((account: DiscoveredAccount, fromGroupId: string, toGroupId: string) => {
    setGroups(prev => {
      const next = prev.map(g => {
        if (g.id === fromGroupId) {
          return { ...g, accounts: g.accounts.filter(a => !(a.accountId === account.accountId && a.provider === account.provider)) };
        }
        if (g.id === toGroupId) {
          return { ...g, accounts: [...g.accounts, account] };
        }
        return g;
      });
      // Remove empty groups
      return next.filter(g => g.accounts.length > 0);
    });
  }, []);

  const splitAccount = useCallback((account: DiscoveredAccount, fromGroupId: string) => {
    setGroups(prev => {
      const newId = `split-${Date.now()}`;
      const next = prev.map(g => {
        if (g.id === fromGroupId) {
          return { ...g, accounts: g.accounts.filter(a => !(a.accountId === account.accountId && a.provider === account.provider)) };
        }
        return g;
      }).filter(g => g.accounts.length > 0);

      next.push({
        id: newId,
        companyName: account.accountName,
        existingCompanyId: null,
        skip: false,
        accounts: [account],
      });

      return next;
    });
  }, []);

  // Summary stats
  const activeGroups = groups.filter(g => !g.skip);
  const newCount = activeGroups.filter(g => !g.existingCompanyId).length;
  const updateCount = activeGroups.filter(g => g.existingCompanyId).length;
  const skipCount = groups.filter(g => g.skip).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {step === 'loading' && 'Fiókok keresése...'}
              {step === 'review' && 'Szinkronizálás jóváhagyása'}
              {step === 'executing' && 'Végrehajtás...'}
              {step === 'done' && 'Szinkronizálás kész'}
            </h2>
            {step === 'review' && discovery && (
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {discovery.platforms.reduce((sum, p) => sum + p.accounts.length, 0)} fiók találva
                {discovery.platforms.filter(p => p.accounts.length > 0).length > 0
                  ? ` ${discovery.platforms.filter(p => p.accounts.length > 0).length} platformon`
                  : ''}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-secondary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'loading' && <LoadingStep />}
          {step === 'review' && discovery && (
            <ReviewStep
              discovery={discovery}
              groups={groups}
              updateGroup={updateGroup}
              moveAccount={moveAccount}
              splitAccount={splitAccount}
              error={error}
            />
          )}
          {step === 'executing' && <ExecutingStep />}
          {step === 'done' && result && <DoneStep result={result} />}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-raised)]">
            <div className="text-sm text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)]">{newCount}</span> új cég,{' '}
              <span className="font-bold text-[var(--text-primary)]">{updateCount}</span> frissítés,{' '}
              <span className="font-bold text-[var(--text-primary)]">{skipCount}</span> kihagyva
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-bold rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
              >
                Mégse
              </button>
              <button
                onClick={handleExecute}
                disabled={activeGroups.length === 0}
                className="px-6 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-[#1a6b8a] to-[#0d3b5e] text-white dark:text-[var(--surface)] hover:from-[#8ec8d8] hover:to-[#1a6b8a] active:scale-[0.97] transition-all disabled:opacity-50"
              >
                Véglegesítés
              </button>
            </div>
          </div>
        )}
        {step === 'done' && (
          <div className="flex justify-end px-6 py-4 border-t border-[var(--border)]">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-[#1a6b8a] to-[#0d3b5e] text-white dark:text-[var(--surface)] hover:from-[#8ec8d8] hover:to-[#1a6b8a] active:scale-[0.97] transition-all"
            >
              Bezárás
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-10 h-10 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[var(--text-secondary)]">Fiókok keresése az összes platformon...</p>
      <div className="flex flex-wrap gap-3 mt-4">
        {PROVIDERS.map(p => {
          const platform = getPlatformFromProvider(p.key);
          return (
            <span key={p.key} className={`flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-full text-xs text-[var(--text-secondary)] ${PLATFORM_COLORS[platform]}`}>
              <PlatformIcon platform={platform} className="w-3.5 h-3.5" />
              {p.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ReviewStep({
  discovery,
  groups,
  updateGroup,
  moveAccount,
  splitAccount,
  error,
}: {
  discovery: SyncDiscoveryResult;
  groups: AccountGroup[];
  updateGroup: (id: string, update: Partial<AccountGroup>) => void;
  moveAccount: (account: DiscoveredAccount, fromGroupId: string, toGroupId: string) => void;
  splitAccount: (account: DiscoveredAccount, fromGroupId: string) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      {/* Platform summary — only show platforms that found accounts */}
      {discovery.platforms.some(p => p.accounts.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {discovery.platforms
            .filter(p => p.accounts.length > 0)
            .map(p => {
              const platform = getPlatformFromProvider(p.provider);
              return (
                <div key={p.provider} className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3 text-center">
                  <div className={`flex justify-center ${PLATFORM_COLORS[platform]}`}>
                    <PlatformIcon platform={platform} className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-[var(--text-primary)] mt-1">{p.label}</div>
                  <div className="text-lg font-bold text-[var(--text-primary)]">{p.accounts.length}</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">fiók</div>
                </div>
              );
            })}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="text-center py-12 text-sm text-[var(--text-secondary)]">
          Nem találtunk új fiókokat a szinkronizáláshoz.
        </div>
      ) : (
        groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            allGroups={groups}
            existingCompanies={discovery.existingCompanies}
            onUpdate={updateGroup}
            onMoveAccount={moveAccount}
            onSplitAccount={splitAccount}
          />
        ))
      )}
    </div>
  );
}

function GroupCard({
  group,
  allGroups,
  existingCompanies,
  onUpdate,
  onMoveAccount,
  onSplitAccount,
}: {
  group: AccountGroup;
  allGroups: AccountGroup[];
  existingCompanies: ExistingCompany[];
  onUpdate: (id: string, update: Partial<AccountGroup>) => void;
  onMoveAccount: (account: DiscoveredAccount, fromGroupId: string, toGroupId: string) => void;
  onSplitAccount: (account: DiscoveredAccount, fromGroupId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.companyName);


  return (
    <div className={`border rounded-2xl transition-all ${
      group.skip
        ? 'border-[var(--border)] opacity-50'
        : group.existingCompanyId
          ? 'border-blue-300 dark:border-blue-500/40'
          : 'border-emerald-300 dark:border-emerald-500/40'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[var(--surface-raised)]">
        <div className="flex items-center gap-3 min-w-0">
          {editing ? (
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => { onUpdate(group.id, { companyName: name }); setEditing(false); }}
              onKeyDown={e => { if (e.key === 'Enter') { onUpdate(group.id, { companyName: name }); setEditing(false); } }}
              autoFocus
              className="px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--accent)] text-sm font-bold text-[var(--text-primary)] focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate"
            >
              {group.companyName}
            </button>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            group.existingCompanyId
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
          }`}>
            {group.existingCompanyId ? 'Meglévő' : 'Új cég'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onUpdate(group.id, { skip: !group.skip })}
            title={group.skip ? 'Visszavonás' : 'Kihagyás'}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              group.skip
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                : 'hover:bg-[var(--surface)] text-[var(--text-secondary)]'
            }`}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Accounts */}
      {!group.skip && (
        <div className="px-5 py-3 space-y-2">
          {group.accounts.map(account => {
            const meta = getProviderMeta(account.provider);
            const platform = getPlatformFromProvider(account.provider);
            return (
              <div key={`${account.provider}:${account.accountId}`} className="flex items-center justify-between group/account">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={PLATFORM_COLORS[platform]}>
                    <PlatformIcon platform={platform} className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">{meta.label}:</span>
                  <span className="text-sm text-[var(--text-secondary)] truncate">{account.accountName}</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">({account.accountId.slice(0, 8)}...)</span>
                </div>
                {group.accounts.length > 1 && (
                  <div className="flex gap-1 opacity-0 group-hover/account:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => onSplitAccount(account, group.id)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
                    >
                      Leválasztás
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Assign to existing company */}
          <div className="pt-2 border-t border-[var(--border)]">
            {!group.existingCompanyId ? (
              <select
                value=""
                onChange={(e) => {
                  const company = existingCompanies.find(c => c.id === e.target.value);
                  if (company) {
                    onUpdate(group.id, { existingCompanyId: company.id, companyName: company.name });
                  }
                }}
                className="text-xs bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] rounded-lg px-2 py-1.5 w-full max-w-xs cursor-pointer hover:border-[var(--accent)] transition-colors"
              >
                <option value="" disabled>Hozzárendelés meglévő céghez</option>
                {existingCompanies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => onUpdate(group.id, { existingCompanyId: null })}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Leválasztás a cégtől
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ExecutingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
      <p className="text-sm text-[var(--text-secondary)]">Cégek és integrációk létrehozása...</p>
    </div>
  );
}

function DoneStep({ result }: { result: { created: number; updated: number; skipped: number; details: string[] } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-3 py-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
          <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-[var(--text-primary)]">Szinkronizálás kész!</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {result.created} létrehozva, {result.updated} frissítve, {result.skipped} kihagyva
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.created}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">Új cég</div>
        </div>
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{result.updated}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Frissítve</div>
        </div>
        <div className="text-center p-4 bg-[var(--surface-raised)] rounded-xl">
          <div className="text-2xl font-bold text-[var(--text-secondary)]">{result.skipped}</div>
          <div className="text-xs text-[var(--text-secondary)]">Kihagyva</div>
        </div>
      </div>

      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 max-h-48 overflow-y-auto">
        {result.details.map((d, i) => (
          <div key={i} className="text-xs text-[var(--text-secondary)] py-1 border-b border-[var(--border)] last:border-0">
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}
