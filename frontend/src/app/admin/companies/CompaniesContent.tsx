'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { DeleteCompanyButton } from './DeleteCompanyButton';
import { SyncAllButton } from './SyncAllButton';
import { PlatformIcon, getPlatformFromProvider } from '@/components/PlatformIcon';

interface CompanyData {
  id: string;
  name: string;
  status: string;
  _count: { users: number };
  connections: { provider: string }[];
}

interface Props {
  companies: CompanyData[];
  hasWindsorKey: boolean;
  companyLimit: number | null;
  isOverLimit: boolean;
  isAtLimit: boolean;
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'text-[var(--platform-tiktok)]',
  facebook: 'text-[var(--platform-facebook)]',
  instagram: 'text-[var(--platform-instagram)]',
  youtube: 'text-[var(--platform-youtube)]',
};

export function CompaniesContent({ companies, hasWindsorKey, companyLimit, isOverLimit, isAtLimit }: Props) {
  const t = useT();

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('Cégek')}</h1>
          <p className={`mt-1 font-medium ${
            isOverLimit || isAtLimit
              ? 'text-red-500 dark:text-red-400'
              : companyLimit !== null && companies.length >= companyLimit * 0.8
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-[var(--text-secondary)]'
          }`}>
            {companies.length}{companyLimit !== null ? ` / ${companyLimit}` : ''} {t('cég')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SyncAllButton hasWindsorKey={hasWindsorKey} />
          {isAtLimit ? (
            <Link
              href="/admin/billing"
              className="px-4 py-2 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm font-bold rounded-xl hover:brightness-110 transition-all"
            >
              {t('Csomag váltás')}
            </Link>
          ) : (
            <Link
              href="/admin/companies/new"
              className="px-4 py-2 bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white dark:text-[var(--surface)] text-sm font-bold rounded-xl hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.97] transition-all duration-150"
            >
              {t('+ Új cég hozzáadása')}
            </Link>
          )}
        </div>
      </header>

      {/* Desktop table */}
      <div className="hidden md:block bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-[var(--text-secondary)] uppercase bg-[var(--surface-raised)]">
              <th className="px-6 py-4">{t('Cégnév')}</th>
              <th className="px-6 py-4">{t('Platformok')}</th>
              <th className="px-6 py-4">{t('Státusz')}</th>
              <th className="px-6 py-4">{t('Felhasználók')}</th>
              <th className="px-6 py-4">{t('Műveletek')}</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => {
              const providers: string[] = Array.from(new Set(company.connections.map((c) => c.provider)));
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
                        {t('Szerkesztés')}
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
        {companies.map((company) => {
          const providers: string[] = Array.from(new Set(company.connections.map((c) => c.provider)));
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
                    <span className="text-xs text-[var(--text-secondary)]">{t('Nincs platform')}</span>
                  )}
                </div>
                <span className="text-xs text-[var(--text-secondary)]">{company._count.users} {t('felhasználó')}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
