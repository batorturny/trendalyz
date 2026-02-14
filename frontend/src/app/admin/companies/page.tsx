import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { DeleteCompanyButton } from './DeleteCompanyButton';
import { WindsorSyncButton } from './WindsorSyncButton';

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Cégek</h1>
          <p className="text-[var(--text-secondary)] mt-1">{companies.length} cég</p>
        </div>
        <div className="flex items-center gap-3">
          <WindsorSyncButton />
          <Link
            href="/admin/companies/new"
            className="px-4 py-2 bg-[var(--accent)] text-white dark:text-[var(--surface)] text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] transition-all duration-150"
          >
            + Uj ceg
          </Link>
        </div>
      </header>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-[var(--text-secondary)] uppercase bg-[var(--surface-raised)]">
              <th className="px-6 py-4">Cégnév</th>
              <th className="px-6 py-4">Státusz</th>
              <th className="px-6 py-4">Felhasználók</th>
              <th className="px-6 py-4">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company: any) => (
              <tr key={company.id} className="border-t border-[var(--border)] hover:bg-[var(--accent-subtle)]">
                <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">
                  <Link href={`/admin/companies/${company.id}`} className="hover:opacity-70">
                    {company.name}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    company.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                    company.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' :
                    'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    {company.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-[var(--text-secondary)]">{company._count.users}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="btn-press px-3 py-1 bg-[var(--accent-subtle)] text-[var(--text-secondary)] text-xs font-semibold rounded-lg hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
                    >
                      Szerkesztés
                    </Link>
                    <DeleteCompanyButton companyId={company.id} companyName={company.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
