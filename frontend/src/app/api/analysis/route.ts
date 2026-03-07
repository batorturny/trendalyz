import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Admin: read analysis for a company+month
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  const month = searchParams.get('month');

  if (!companyId || !month) return NextResponse.json({ content: null });

  const company = await prisma.company.findFirst({ where: { id: companyId, adminId: session.user.id } });
  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const summary = await prisma.reportSummary.findUnique({
    where: { companyId_month: { companyId, month } },
  });

  return NextResponse.json({ content: summary?.content ?? null });
}

// Admin: save analysis for a company+month
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { companyId, month, content } = await req.json();
  if (!companyId || !month || typeof content !== 'string') {
    return NextResponse.json({ error: 'Hiányzó mezők' }, { status: 400 });
  }

  const company = await prisma.company.findFirst({ where: { id: companyId, adminId: session.user.id } });
  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const summary = await prisma.reportSummary.upsert({
    where: { companyId_month: { companyId, month } },
    update: { content },
    create: { companyId, month, content },
  });

  return NextResponse.json({ success: true, summary });
}
