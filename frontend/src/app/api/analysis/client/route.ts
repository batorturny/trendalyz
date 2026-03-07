import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Client: read their own company's analysis for a given month
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companyId = session.user.companyId;
  if (!companyId) return NextResponse.json({ content: null });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  if (!month) return NextResponse.json({ content: null });

  const summary = await prisma.reportSummary.findUnique({
    where: { companyId_month: { companyId, month } },
  });

  return NextResponse.json({ content: summary?.content ?? null });
}
