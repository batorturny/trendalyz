'use client';

import { addUserToCompany, removeUserFromCompany } from '../actions';

interface Props {
  companyId: string;
  users: { id: string; email: string; name: string | null; createdAt: string }[];
}

export function CompanyUsers({ companyId, users }: Props) {
  const handleAdd = async (formData: FormData) => {
    await addUserToCompany(companyId, formData);
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Biztosan eltávolítod ezt a felhasználót?')) return;
    await removeUserFromCompany(userId, companyId);
  };

  return (
    <div className="bg-white/5 border border-white/15 rounded-2xl p-6">
      <h2 className="text-lg font-bold mb-4">Felhasználók</h2>

      {/* User list */}
      {users.length > 0 ? (
        <div className="space-y-2 mb-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between bg-slate-900/50 rounded-xl p-3">
              <div>
                <div className="text-sm font-semibold text-white">{user.email}</div>
                {user.name && <div className="text-xs text-slate-400">{user.name}</div>}
              </div>
              <button
                onClick={() => handleRemove(user.id)}
                className="text-xs text-red-400 hover:text-red-300 font-semibold"
              >
                Eltávolítás
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 mb-4">Nincs hozzárendelt felhasználó</p>
      )}

      {/* Add user form */}
      <form action={handleAdd} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="email@ceg.hu"
          className="flex-1 bg-slate-900 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-cyan-500 text-white text-sm font-bold rounded-xl hover:bg-cyan-400 transition-all"
        >
          Meghívás
        </button>
      </form>
    </div>
  );
}
