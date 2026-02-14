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

const inputClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-semibold focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors";

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
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Státusz</label>
        <select
          name="status"
          defaultValue={company.status}
          className={inputClass}
        >
          <option value="ACTIVE">Aktív</option>
          <option value="INACTIVE">Inaktív</option>
          <option value="PENDING">Függőben</option>
        </select>
      </div>

      <button
        type="submit"
        className="px-6 py-3 bg-[var(--accent)] text-white dark:text-[var(--surface)] font-bold rounded-xl hover:brightness-110 active:scale-[0.97] transition-all duration-150"
      >
        Mentés
      </button>
    </form>
  );
}
