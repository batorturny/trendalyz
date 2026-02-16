'use client';

import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Hidden input name for form submission */
  name?: string;
}

export function CustomSelect({ options, value, onChange, placeholder, name }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const selected = options.find(o => o.value === value);
  const displayText = selected ? selected.label : (placeholder || 'Válassz...');

  return (
    <div ref={ref} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
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

      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden">
          <div className="max-h-[280px] overflow-y-auto py-1.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { onChange(option.value); setOpen(false); }}
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
                  <span className={!isSelected ? 'pl-6.5' : ''}>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
