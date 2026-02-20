import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { NewCompanyForm } from './NewCompanyForm';

export default async function NewCompanyPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login');

  // Check billing limit
  let blocked = false;
  let companyCount = 0;
  let companyLimit = Infinity;

  if (process.env.ENABLE_BILLING === 'true') {
    const [subscription, count] = await Promise.all([
      prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: { companyLimit: true, tier: true, status: true },
      }),
      prisma.company.count({ where: { adminId: session.user.id } }),
    ]);

    companyCount = count;
    companyLimit = subscription?.companyLimit ?? 1;
    const status = subscription?.status;

    if (companyCount >= companyLimit) blocked = true;
    if (status && !['TRIALING', 'ACTIVE'].includes(status)) blocked = true;
  }

  if (blocked) {
    return (
      <div className="p-4 md:p-8">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">Új cég hozzáadása</h1>
        </header>

        <div className="max-w-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">&#9888;</div>
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">
            Elérted a cég limitedet ({companyCount}/{companyLimit})
          </h2>
          <p className="text-sm text-red-600 dark:text-red-400/80 mb-6">
            A jelenlegi csomagod nem enged több cég hozzáadását. Válts magasabb csomagra vagy törölj ki meglévő cégeket.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/admin/billing"
              className="px-6 py-3 bg-gradient-to-r from-emerald-400/80 to-cyan-400/80 text-white dark:text-[var(--surface)] font-bold rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all"
            >
              Előfizetés váltása
            </Link>
            <Link
              href="/admin/companies"
              className="px-6 py-3 bg-[var(--accent-subtle)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--border)] transition-all"
            >
              Vissza
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">Új cég hozzáadása</h1>
        <p className="text-[var(--text-secondary)] mt-1">Cég létrehozása és opcionális ügyfél meghívó</p>
      </header>

      <NewCompanyForm />
    </div>
  );
}
