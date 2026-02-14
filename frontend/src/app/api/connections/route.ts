import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const companyId = session.user.companyId;
  if (!companyId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 400 });
  }

  const connections = await prisma.integrationConnection.findMany({
    where: { companyId },
    select: {
      id: true,
      provider: true,
      status: true,
      externalAccountId: true,
      externalAccountName: true,
      lastSyncAt: true,
      errorMessage: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ provider: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json(connections);
}
