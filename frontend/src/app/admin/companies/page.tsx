import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { DeleteCompanyButton } from './DeleteCompanyButton';
import { SyncAllButton } from './SyncAllButton';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';

export default async function CompaniesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login');

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { windsorApiKeyEnc: true },
  });
  const hasWindsorKey = !!adminUser?.windsorApiKeyEnc;

  const companies = await prisma.company.findMany({
    where: { adminId: session.user.id },
    include: {
      _count: { select: { users: true } },
      connections: {
        select: { provider: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const PLATFORM_COLORS: Record<string, string> = {
    tiktok: 'text-[var(--platform-tiktok)]',
    facebook: 'text-[var(--platform-facebook)]',
    instagram: 'text-[var(--platform-instagram)]',
    youtube: 'text-[var(--platform-youtube)]',
  };

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cégek</h1>
          <p className="text-[var(--text-secondary)] mt-1">{companies.length} cég</p>
        </div>
        <div className="flex items-center gap-3">
          <SyncAllButton hasWindsorKey={hasWindsorKey} />
          <Link
            href="/admin/companies/new"
            className="px-4 py-2 bg-[var(--accent)] text-white dark:text-[var(--surface)] text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] transition-all duration-150"
          >
            + Új cég
          </Link>
        </div>
      </header>

      {/* Desktop table */}
      <div className="hidden md:block bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-[var(--text-secondary)] uppercase bg-[var(--surface-raised)]">
              <th className="px-6 py-4">Cégnév</th>
              <th className="px-6 py-4">Platformok</th>
              <th className="px-6 py-4">Státusz</th>
              <th className="px-6 py-4">Felhasználók</th>
              <th className="px-6 py-4">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company: any) => {
              const providers: string[] = Array.from(new Set(company.connections.map((c: any) => c.provider)));
              return (
                <tr key={company.id} className="border-t border-[var(--border)] hover:bg-[var(--accent-subtle)]">
                  <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">
                    <Link href={`/admin/companies/${company.id}`} className="hover:opacity-70">
                      {company.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      {providers.length > 0 ? (
                        providers.map((p: string) => {
                          const platform = getPlatformFromProvider(p);
                          return (
                            <span key={p} title={p} className={PLATFORM_COLORS[platform]}>
                              <PlatformIcon platform={platform} className="w-4.5 h-4.5" />
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-[var(--text-secondary)]">-</span>
                      )}
                    </div>
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {companies.map((company: any) => {
          const providers: string[] = Array.from(new Set(company.connections.map((c: any) => c.provider)));
          return (
            <Link
              key={company.id}
              href={`/admin/companies/${company.id}`}
              className="block bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 hover:bg-[var(--accent-subtle)] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[var(--text-primary)]">{company.name}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  company.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                  company.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' :
                  'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                }`}>
                  {company.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {providers.length > 0 ? (
                    providers.map((p: string) => {
                      const platform = getPlatformFromProvider(p);
                      return (
                        <span key={p} className={PLATFORM_COLORS[platform]}>
                          <PlatformIcon platform={platform} className="w-4 h-4" />
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-[var(--text-secondary)]">Nincs platform</span>
                  )}
                </div>
                <span className="text-xs text-[var(--text-secondary)]">{company._count.users} felhasználó</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
