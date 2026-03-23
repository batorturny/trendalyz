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
    <form action={handleSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-bold mb-2">Cég adatok</h2>

      <div>
        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Cégnév</label>
        <input
          name="name"
          defaultValue={company.name}
          required
          className="input-field"
        />
      </div>

      <button
        type="submit"
        className="px-6 py-3 bg-gradient-to-r from-[#1a6b8a] to-[#0d3b5e] text-white dark:text-[var(--surface)] font-bold rounded-xl hover:from-[#8ec8d8] hover:to-[#1a6b8a] active:scale-[0.97] transition-all duration-150"
      >
        Mentés
      </button>
    </form>
  );
}
