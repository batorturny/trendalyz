import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { EvaluationsOverview } from './EvaluationsOverview';

export default async function EvaluationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login');

  const companies = await prisma.company.findMany({
    where: { adminId: session.user.id, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      connections: { select: { provider: true } },
    },
    orderBy: { name: 'asc' },
  });

  const evaluations = await prisma.evaluation.findMany({
    where: { companyId: { in: companies.map(c => c.id) } },
    orderBy: [{ month: 'desc' }, { platform: 'asc' }],
  });

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Értékelések</h1>
      <p className="text-[var(--text-secondary)] mb-6">Havi értékelések küldése és ügyfél válaszok megtekintése</p>
      <EvaluationsOverview
        companies={companies.map(c => ({
          id: c.id,
          name: c.name,
          platforms: [...new Set(c.connections.map(conn => conn.provider))],
        }))}
        evaluations={evaluations.map(e => ({
          id: e.id,
          companyId: e.companyId,
          platform: e.platform,
          month: e.month,
          adminMessage: e.adminMessage,
          adminMessageAt: e.adminMessageAt?.toISOString() || null,
          clientReaction: e.clientReaction,
          clientReply: e.clientReply,
          clientReplyAt: e.clientReplyAt?.toISOString() || null,
          clientReadAt: e.clientReadAt?.toISOString() || null,
          messages: (e.messages as any) || [],
        }))}
      />
    </div>
  );
}
