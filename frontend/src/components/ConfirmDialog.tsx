'use client';

import { BaseModal } from './BaseModal';

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
  return (
    <BaseModal open={open} onClose={onCancel} className="max-w-sm mx-4 overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{message}</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 pb-6">
        <button
          onClick={onCancel}
          className="btn-secondary px-4 py-2.5 text-sm active:scale-[0.97]"
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
    </BaseModal>
  );
}
