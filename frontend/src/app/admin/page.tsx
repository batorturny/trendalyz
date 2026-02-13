import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [companyCount, userCount, activeIntegrations] = await Promise.all([
    prisma.company.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.integration.count({ where: { status: 'CONNECTED' } }),
  ]);

  const stats = [
    { label: 'Aktív cégek', value: companyCount, icon: '🏢', href: '/admin/companies' },
    { label: 'Ügyfél felhasználók', value: userCount, icon: '👤', href: '/admin/companies' },
    { label: 'Aktív integrációk', value: activeIntegrations, icon: '🔗', href: '/admin/companies' },
  ];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">Áttekintés</p>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white/5 border border-white/15 rounded-2xl p-6 hover:bg-white/10 transition-all"
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-4xl font-black text-white">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-white/5 border border-white/15 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Gyors műveletek</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/companies/new"
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-bold rounded-xl hover:from-cyan-400 hover:to-purple-400 transition-all"
          >
            + Új cég hozzáadása
          </Link>
          <Link
            href="/admin/reports"
            className="px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/20 transition-all"
          >
            Riport generálása
          </Link>
          <Link
            href="/admin/charts"
            className="px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/20 transition-all"
          >
            Chart generálása
          </Link>
        </div>
      </div>
    </div>
  );
}
