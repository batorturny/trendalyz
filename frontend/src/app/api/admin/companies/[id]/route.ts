import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

async function verifyCompanyOwnership(companyId: string, userId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { users: { select: { id: true, email: true, name: true, role: true } } },
  });
  if (!company || company.adminId !== userId) return null;
  return company;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const company = await verifyCompanyOwnership(id, session.user.id);
  if (!company) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(company);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await verifyCompanyOwnership(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const company = await prisma.company.update({
    where: { id },
    data: {
      name: body.name,
      tiktokAccountId: body.tiktokAccountId,
      status: body.status,
    },
  });

  return NextResponse.json(company);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await verifyCompanyOwnership(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.user.updateMany({
    where: { companyId: id },
    data: { companyId: null },
  });

  await prisma.company.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
