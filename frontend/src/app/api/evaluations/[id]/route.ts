import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Generic PATCH for updates (admin: message, both: reactions/messages)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const evaluation = await prisma.evaluation.findUnique({ where: { id } });
  if (!evaluation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Verify access: admin owns company OR client belongs to company
  const canAccess = session.user.role === 'ADMIN' || session.user.companyId === evaluation.companyId;
  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  // Whitelist editable fields
  const allowedFields: Record<string, unknown> = {};
  if (typeof body.adminMessage === 'string') {
    allowedFields.adminMessage = body.adminMessage;
    allowedFields.adminMessageAt = new Date();
    allowedFields.adminUserId = session.user.id;
  }
  if (Array.isArray(body.messages)) {
    allowedFields.messages = body.messages;
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
