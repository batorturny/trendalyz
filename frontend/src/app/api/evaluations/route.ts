import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  const platform = searchParams.get('platform');
  const month = searchParams.get('month');

  if (!companyId || !platform || !month) {
    return NextResponse.json({ error: 'companyId, platform and month are required' }, { status: 400 });
  }

  // Access check: admin owns the company OR client belongs to it
  const canAccess =
    session.user.role === 'ADMIN' || session.user.companyId === companyId;
  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: { companyId_platform_month: { companyId, platform, month } },
  });

  return NextResponse.json(evaluation);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { companyId, platform, month, adminMessage } = await req.json();

  if (!companyId || !platform || !month || typeof adminMessage !== 'string') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify admin owns the company
  const company = await prisma.company.findFirst({
    where: { id: companyId, adminId: session.user.id },
  });
  if (!company) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const evaluation = await prisma.evaluation.upsert({
    where: { companyId_platform_month: { companyId, platform, month } },
    update: {
      adminMessage,
      adminMessageAt: new Date(),
      adminUserId: session.user.id,
    },
    create: {
      companyId,
      platform,
      month,
      adminMessage,
      adminMessageAt: new Date(),
      adminUserId: session.user.id,
    },
  });

  return NextResponse.json(evaluation);
}
