'use client';

import { useState } from 'react';
import { addUserToCompany, removeUserFromCompany, resendInvite } from '../actions';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  hasPassword: boolean;
  createdAt: string;
}

interface Props {
  companyId: string;
  users: User[];
}

export function CompanyUsers({ companyId, users }: Props) {
  const [resending, setResending] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAdd = async (formData: FormData) => {
    await addUserToCompany(companyId, formData);
  };

  const handleRemove = async (userId: string) => {
    setRemoveTarget(null);
    await removeUserFromCompany(userId, companyId);
  };

  const handleResend = async (userId: string) => {
    setResending(userId);
    try {
      await resendInvite(userId, companyId);
      toast('Meghívó újraküldve', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Hiba történt', 'error');
    } finally {
      setResending(null);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-bold mb-4">Felhasználók</h2>

      {/* User list */}
      {users.length > 0 ? (
        <div className="space-y-2 mb-4">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--surface-raised)] rounded-xl p-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-none">{user.email}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-cyan-500/20 dark:text-cyan-300'
                  }`}>
                    {user.role}
                  </span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    user.hasPassword
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                  }`}>
                    {user.hasPassword ? 'Aktív' : 'Meghívott'}
                  </span>
                </div>
                {user.name && <div className="text-xs text-[var(--text-secondary)]">{user.name}</div>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!user.hasPassword && (
                  <button
                    onClick={() => handleResend(user.id)}
                    disabled={resending === user.id}
                    className="text-xs text-[var(--accent)] hover:opacity-70 font-semibold disabled:opacity-50"
                  >
                    {resending === user.id ? 'Küldés...' : 'Újraküldés'}
                  </button>
                )}
                <button
                  onClick={() => setRemoveTarget(user.id)}
                  className="text-xs text-[var(--error)] hover:opacity-70 font-semibold"
                >
                  Eltávolítás
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)] mb-4">Nincs hozzárendelt felhasználó</p>
      )}

      {/* Add user form */}
      <form action={handleAdd} className="flex flex-col sm:flex-row gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="email@ceg.hu"
          className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white dark:text-[var(--surface)] text-sm font-bold rounded-xl hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.97] transition-all duration-150"
        >
          Meghívás
        </button>
      </form>

      {/* Confirm remove dialog */}
      <ConfirmDialog
        open={!!removeTarget}
        title="Felhasználó eltávolítása"
        message="Biztosan eltávolítod ezt a felhasználót?"
        confirmLabel="Eltávolítás"
        cancelLabel="Mégse"
        variant="danger"
        onConfirm={() => removeTarget && handleRemove(removeTarget)}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
