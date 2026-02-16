'use client';

import { useState } from 'react';
import { deleteCompany } from './actions';

export function DeleteCompanyButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteCompany(companyId);
    setDeleting(false);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-press px-3 py-1 bg-transparent text-red-300/50 dark:text-red-400/30 text-xs font-semibold rounded-lg hover:bg-red-500/10 hover:text-red-400 dark:hover:text-red-400/60"
      >
        Törlés
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-lg)] w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Cég törlése</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Biztosan törlöd a(z) <strong className="text-[var(--text-primary)]">{companyName}</strong> céget?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="btn-press px-4 py-2 bg-[var(--accent-subtle)] text-[var(--text-secondary)] text-sm font-semibold rounded-xl hover:bg-[var(--border)]"
              >
                Mégse
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-press px-4 py-2 bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/30 disabled:opacity-50"
              >
                {deleting ? 'Törlés...' : 'Törlés'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
