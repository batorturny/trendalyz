'use client';

import { updateCompany } from '../actions';

interface Props {
  company: {
    id: string;
    name: string;
    tiktokAccountId: string | null;
    status: string;
  };
}

export function CompanyEditForm({ company }: Props) {
  const handleSubmit = async (formData: FormData) => {
    await updateCompany(company.id, formData);
  };

  return (
    <form action={handleSubmit} className="bg-white/5 border border-white/15 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold mb-2">Cég adatok</h2>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cégnév</label>
        <input
          name="name"
          defaultValue={company.name}
          required
          className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">TikTok Account ID</label>
        <input
          name="tiktokAccountId"
          defaultValue={company.tiktokAccountId || ''}
          className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Státusz</label>
        <select
          name="status"
          defaultValue={company.status}
          className="w-full bg-slate-900 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold focus:border-cyan-500 focus:outline-none"
        >
          <option value="ACTIVE">Aktív</option>
          <option value="INACTIVE">Inaktív</option>
          <option value="PENDING">Függőben</option>
        </select>
      </div>

      <button
        type="submit"
        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-purple-400 transition-all"
      >
        Mentés
      </button>
    </form>
  );
}
