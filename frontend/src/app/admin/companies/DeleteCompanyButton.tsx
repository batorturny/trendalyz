'use client';

import { deleteCompany } from './actions';

export function DeleteCompanyButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  async function handleDelete() {
    if (!confirm(`Biztosan törlöd a(z) "${companyName}" céget?`)) return;
    await deleteCompany(companyId);
  }

  return (
    <button
      onClick={handleDelete}
      className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30"
    >
      Törlés
    </button>
  );
}
