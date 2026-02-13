import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const companies = await prisma.company.findMany({
    include: { _count: { select: { users: true, integrations: true } } },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(companies);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { name, tiktokAccountId } = body;

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const company = await prisma.company.create({
    data: { name, tiktokAccountId: tiktokAccountId || null, status: 'ACTIVE' },
  });

  return NextResponse.json(company, { status: 201 });
}
