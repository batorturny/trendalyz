import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { appendEvaluationMessage } from '@/lib/evaluation-db';
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

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  // Access check: admin must own the company, client must belong to it
  if (session.user.role === 'ADMIN') {
    const ownsCompany = await prisma.company.findFirst({ where: { id: companyId, adminId: session.user.id } });
    if (!ownsCompany) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } else if (session.user.companyId !== companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // If all 3 params → return single evaluation
  if (platform && month) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { companyId_platform_month: { companyId, platform, month } },
    });
    return NextResponse.json(evaluation);
  }

  // Otherwise return all evaluations for this company (with optional filters)
  const where: any = { companyId };
  if (platform) where.platform = platform;
  if (month) where.month = month;

  const evaluations = await prisma.evaluation.findMany({
    where,
    orderBy: [{ month: 'desc' }, { platform: 'asc' }],
  });
  return NextResponse.json(evaluations);
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

  const senderName = session.user.name || session.user.email || 'Admin';
  const newMsg = { role: 'admin' as const, text: adminMessage, at: new Date().toISOString(), name: senderName };

  // Upsert the evaluation record (creates if needed, updates admin fields)
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
      messages: [],
    },
  });

  // Atomically append the message (no read-modify-write race)
  await appendEvaluationMessage(evaluation.id, newMsg);

  // Re-fetch to return the full record with updated messages
  const updated = await prisma.evaluation.findUnique({ where: { id: evaluation.id } });

  return NextResponse.json(updated);
}
