import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { DeleteCompanyButton } from './DeleteCompanyButton';

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Cégek</h1>
          <p className="text-slate-400 mt-1">{companies.length} cég</p>
        </div>
        <Link
          href="/admin/companies/new"
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-bold rounded-xl hover:from-cyan-400 hover:to-purple-400 transition-all"
        >
          + Új cég
        </Link>
      </header>

      <div className="bg-white/5 border border-white/15 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-slate-400 uppercase bg-white/5">
              <th className="px-6 py-4">Cégnév</th>
              <th className="px-6 py-4">TikTok ID</th>
              <th className="px-6 py-4">Státusz</th>
              <th className="px-6 py-4">Felhasználók</th>
              <th className="px-6 py-4">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company: any) => (
              <tr key={company.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-6 py-4 font-semibold text-white">
                  <Link href={`/admin/companies/${company.id}`} className="hover:text-cyan-400">
                    {company.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                  {company.tiktokAccountId ? company.tiktokAccountId.slice(0, 20) + '...' : '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    company.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                    company.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {company.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{company._count.users}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20"
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
