'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Company } from '@/lib/api';

export const ALL_ACCOUNTS_ID = '__ALL__';

export interface AccountSelection {
  companyId: string;
  companyName: string;
  connectionId: string | null; // null for legacy tiktokAccountId fallback
  externalAccountId: string;
  externalAccountName: string | null;
  provider: string;
}

interface AccountPickerProps {
  companies: Company[];
  platformKey: string;
  value: string; // selection key: `${companyId}:${externalAccountId}` or ALL_ACCOUNTS_ID
  onChange: (key: string, selection: AccountSelection | null) => void;
  showAll?: boolean;
}

function accountKey(companyId: string, externalAccountId: string) {
  return `${companyId}:${externalAccountId}`;
}

export function buildAccountList(companies: Company[], platformKey: string): AccountSelection[] {
  const list: AccountSelection[] = [];
  for (const c of companies) {
    const conns = (c.connections ?? []).filter(conn => conn.provider === platformKey);
    if (conns.length > 0) {
      for (const conn of conns) {
        list.push({
          companyId: c.id,
          companyName: c.name,
          connectionId: conn.id,
          externalAccountId: conn.externalAccountId,
          externalAccountName: conn.externalAccountName,
          provider: conn.provider,
        });
      }
    }
  }
  return list;
}

export function AccountPicker({ companies, platformKey, value, onChange, showAll = false }: AccountPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const accounts = useMemo(() => buildAccountList(companies, platformKey), [companies, platformKey]);

  // Group by company for display
  const groups = useMemo(() => {
    const map = new Map<string, { companyName: string; accounts: AccountSelection[] }>();
    for (const a of accounts) {
      if (!map.has(a.companyId)) map.set(a.companyId, { companyName: a.companyName, accounts: [] });
      map.get(a.companyId)!.accounts.push(a);
    }
    return Array.from(map.entries()).map(([companyId, v]) => ({ companyId, ...v }));
  }, [accounts]);

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    const q = search.toLowerCase();
    return groups
      .map(g => ({
        ...g,
        accounts: g.accounts.filter(a =>
          a.companyName.toLowerCase().includes(q) ||
          (a.externalAccountName ?? '').toLowerCase().includes(q) ||
          a.externalAccountId.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.accounts.length > 0);
  }, [groups, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  useEffect(() => { if (open && searchRef.current) searchRef.current.focus(); }, [open]);

  function toggleOpen() {
    setOpen(prev => {
      if (prev) setSearch(''); // clear search when closing
      return !prev;
    });
  }

  const isAll = value === ALL_ACCOUNTS_ID;
  const selected = accounts.find(a => accountKey(a.companyId, a.externalAccountId) === value) ?? null;

  const displayText = isAll
    ? `Összes fiók (${accounts.length})`
    : selected
      ? `${selected.companyName} — ${selected.externalAccountName || selected.externalAccountId}`
      : 'Válassz fiókot...';

  function handleSelectAll() {
    onChange(ALL_ACCOUNTS_ID, null);
    setOpen(false);
  }

  function handleSelectAccount(a: AccountSelection) {
    onChange(accountKey(a.companyId, a.externalAccountId), a);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full min-h-[64px] bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-left font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all flex items-center justify-between gap-2 hover:border-[var(--text-secondary)]"
      >
        <span className={value ? 'text-[var(--text-primary)] truncate' : 'text-[var(--text-secondary)]'}>
          {displayText}
        </span>
        <svg
          className={`w-4 h-4 text-[var(--text-secondary)] transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 w-full min-w-[320px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden">
          {accounts.length > 5 && (
            <div className="px-3 pt-3 pb-2">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés cég vagy fiók szerint..."
                className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
              />
            </div>
          )}

          <div className="max-h-[360px] overflow-y-auto py-1.5">
            {showAll && !search && (
              <button
                type="button"
                onClick={handleSelectAll}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2.5 border-b border-[var(--border)] ${isAll ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)]' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]'}`}
              >
                {isAll && (
                  <svg className="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className={!isAll ? 'pl-6.5' : ''}>Összes fiók ({accounts.length})</span>
              </button>
            )}

            {filteredGroups.length === 0 && (
              <div className="px-4 py-3 text-sm text-[var(--text-secondary)] text-center">
                Nincs találat
              </div>
            )}

            {filteredGroups.map(group => (
              <div key={group.companyId}>
                <div className="px-4 pt-3 pb-1 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {group.companyName} ({group.accounts.length})
                </div>
                {group.accounts.map(a => {
                  const key = accountKey(a.companyId, a.externalAccountId);
                  const isSelected = key === value;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectAccount(a)}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-all flex items-center gap-2.5 ${isSelected ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)]' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]'}`}
                    >
                      {isSelected ? (
                        <svg className="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-4 shrink-0" />
                      )}
                      <span className="truncate">{a.externalAccountName || a.externalAccountId}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
