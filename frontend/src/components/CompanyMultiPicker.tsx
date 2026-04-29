'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface Props {
  companies: Company[];
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}

export function CompanyMultiPicker({ companies, selectedIds, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const total = companies.length;
  const selected = companies.filter(c => selectedIds.has(c.id));
  const summary =
    selected.length === 0
      ? 'Válassz cégeket...'
      : selected.length === total
        ? `Összes cég (${total})`
        : selected.length === 1
          ? selected[0].name
          : `${selected.length}/${total} cég`;

  const filtered = search
    ? companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : companies;

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  };

  const selectAll = () => onChange(new Set(companies.map(c => c.id)));
  const clear = () => onChange(new Set());

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-left font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all flex items-center justify-between gap-2 hover:border-[var(--text-secondary)]"
      >
        <span className={selected.length > 0 ? 'text-[var(--text-primary)] truncate' : 'text-[var(--text-secondary)] truncate'}>
          {summary}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 w-full min-w-[280px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden">
          {companies.length > 5 && (
            <div className="px-3 pt-3 pb-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés..."
                className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-raised)]">
            <button
              onClick={selectAll}
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Mind kijelöl
            </button>
            <button
              onClick={clear}
              className="text-xs font-semibold text-[var(--error)] hover:underline"
            >
              Törlés
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto py-1.5">
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-[var(--text-secondary)] text-center">Nincs találat</div>
            )}
            {filtered.map((c) => {
              const isSelected = selectedIds.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${isSelected
                    ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected
                      ? 'border-transparent bg-[var(--accent)] text-white'
                      : 'border-[var(--border)]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
