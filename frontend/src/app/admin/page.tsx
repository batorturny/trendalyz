import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Building2, Users, Plug } from 'lucide-react';

export default async function AdminDashboard() {
  const [companyCount, userCount, activeIntegrations] = await Promise.all([
    prisma.company.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.integration.count({ where: { status: 'CONNECTED' } }),
  ]);

  const stats = [
    { label: 'Aktív cégek', value: companyCount, icon: Building2, href: '/admin/companies' },
    { label: 'Ügyfél felhasználók', value: userCount, icon: Users, href: '/admin/companies' },
    { label: 'Aktív integrációk', value: activeIntegrations, icon: Plug, href: '/admin/companies' },
  ];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-[var(--text-primary)]">Admin Dashboard</h1>
        <p className="text-[var(--text-secondary)] mt-1">Áttekintés</p>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6 hover:shadow-lg transition-all"
          >
            <stat.icon className="w-8 h-8 text-[var(--text-secondary)] mb-3" strokeWidth={1.5} />
            <div className="text-4xl font-black text-[var(--text-primary)]">{stat.value}</div>
            <div className="text-xs font-bold text-[var(--text-secondary)] uppercase mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Gyors műveletek</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/companies/new"
            className="px-4 py-2 bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white text-sm font-bold rounded-xl hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.97] transition-all duration-150"
          >
            + Új cég hozzáadása
          </Link>
          <Link
            href="/admin/reports"
            className="px-4 py-2 bg-[var(--accent-subtle)] text-[var(--text-primary)] text-sm font-bold rounded-xl hover:bg-[var(--border)] transition-all"
          >
            Riport generálása
          </Link>
          <Link
            href="/admin/charts"
            className="px-4 py-2 bg-[var(--accent-subtle)] text-[var(--text-primary)] text-sm font-bold rounded-xl hover:bg-[var(--border)] transition-all"
          >
            Chart generálása
          </Link>
        </div>
      </div>
    </div>
  );
}
