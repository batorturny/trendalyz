'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Megerősítés',
  cancelLabel = 'Mégse',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-lg)] w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-all active:scale-[0.97]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-[0.97] ${
              variant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[var(--accent)] text-white dark:text-[var(--surface)] hover:brightness-110'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
