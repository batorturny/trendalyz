import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ClientHeader } from './ClientHeader';
import { Lock } from 'lucide-react';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  let companyName = '';
  let companyStatus = 'ACTIVE';
  let connectedProviders: string[] = [];

  if (session.user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { name: true, status: true },
    });
    companyName = company?.name || '';
    companyStatus = company?.status || 'ACTIVE';

    const dbConnections = await prisma.integrationConnection.findMany({
      where: { companyId: session.user.companyId },
      select: { provider: true },
    });

    connectedProviders = dbConnections.map((c) => c.provider);
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      <ClientHeader
        companyName={companyName}
        userEmail={session.user.email || ''}
        connectedProviders={connectedProviders}
      />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {companyStatus === 'INACTIVE' ? (
          <div className="text-center py-20 bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl">
            <Lock className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Fiók inaktív</h2>
            <p className="text-[var(--text-secondary)]">A céged fiókja jelenleg inaktív. Kérd meg az adminisztrátort az aktiváláshoz.</p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
