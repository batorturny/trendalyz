'use client';

import { useState, useRef, useEffect } from 'react';

interface Company {
  id: string;
  name: string;
}

interface CompanyPickerProps {
  companies: Company[];
  value: string;
  onChange: (value: string) => void;
  showAll?: boolean;
}

const ALL_COMPANIES_ID = '__ALL__';

export { ALL_COMPANIES_ID };

export function CompanyPicker({ companies, value, onChange, showAll = false }: CompanyPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  // Reset search when closed
  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const isAll = value === ALL_COMPANIES_ID;
  const selectedCompany = isAll ? null : companies.find(c => c.id === value);
  const displayText = isAll ? `Összes cég (${companies.length})` : selectedCompany ? selectedCompany.name : 'Válassz céget...';

  const filtered = search
    ? companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : companies;

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-left font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all flex items-center justify-between gap-2 hover:border-[var(--text-secondary)]"
      >
        <span className={value ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
          {displayText}
        </span>
        <svg
          className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 w-full min-w-[280px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden">
          {/* Search */}
          {companies.length > 5 && (
            <div className="px-3 pt-3 pb-2">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés..."
                className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
              />
            </div>
          )}

          {/* Company list */}
          <div className="max-h-[280px] overflow-y-auto py-1.5">
            {/* "All companies" option */}
            {showAll && !search && (
              <button
                type="button"
                onClick={() => handleSelect(ALL_COMPANIES_ID)}
                className={`
                  w-full text-left px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2.5 border-b border-[var(--border)]
                  ${isAll
                    ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                {isAll && (
                  <svg className="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className={!isAll ? 'pl-6.5' : ''}>Összes cég ({companies.length})</span>
              </button>
            )}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-[var(--text-secondary)] text-center">
                Nincs találat
              </div>
            )}
            {filtered.map((company) => {
              const isSelected = company.id === value;
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => handleSelect(company.id)}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2.5
                    ${isSelected
                      ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  {isSelected && (
                    <svg className="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={!isSelected ? 'pl-6.5' : ''}>{company.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
