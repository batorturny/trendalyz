'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { deleteMyAccount } from './actions';
import { signOut } from 'next-auth/react';

export function DeleteAccountButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmText !== 'TÖRLÉS') return;

    setDeleting(true);
    setError(null);

    const result = await deleteMyAccount();

    if (result.success) {
      await signOut({ callbackUrl: '/login' });
    } else {
      setError(result.error || 'Hiba történt');
      setDeleting(false);
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--error)] bg-red-500/10 hover:bg-red-500/20 transition"
      >
        <Trash2 className="w-4 h-4" />
        Fiók törlése
      </button>
    );
  }

  return (
    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[var(--error)] shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-[var(--error)]">Fiók végleges törlése</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Ez a művelet visszavonhatatlan. Az összes adatod, beállításod és hozzáférésed véglegesen törlődik az adatbázisból.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">
          Írd be: TÖRLÉS
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="TÖRLÉS"
          className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={deleting}
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--error)]">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => { setShowConfirm(false); setConfirmText(''); setError(null); }}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--accent-subtle)] transition"
          disabled={deleting}
        >
          Mégse
        </button>
        <button
          onClick={handleDelete}
          disabled={confirmText !== 'TÖRLÉS' || deleting}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
        >
          {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Törlés...</> : <><Trash2 className="w-4 h-4" /> Végleges törlés</>}
        </button>
      </div>
    </div>
  );
}
