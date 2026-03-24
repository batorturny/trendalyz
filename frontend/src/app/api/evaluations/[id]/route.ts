import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Generic PATCH for admin updates (e.g., updating adminMessage)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const evaluation = await prisma.evaluation.findUnique({ where: { id } });
  if (!evaluation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Verify admin owns the company
  const company = await prisma.company.findFirst({
    where: { id: evaluation.companyId, adminId: session.user.id },
  });
  if (!company) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  // Whitelist only admin-editable fields
  const allowedFields: Record<string, unknown> = {};
  if (typeof body.adminMessage === 'string') {
    allowedFields.adminMessage = body.adminMessage;
    allowedFields.adminMessageAt = new Date();
    allowedFields.adminUserId = session.user.id;
  }

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const updated = await prisma.evaluation.update({
    where: { id },
    data: allowedFields,
  });

  return NextResponse.json(updated);
}
