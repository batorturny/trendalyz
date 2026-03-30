import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { setMessageReaction } from '@/lib/evaluation-db';
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

  // Verify access: admin must own the company, client must belong to it
  if (session.user.role === 'ADMIN') {
    const ownsCompany = await prisma.company.findFirst({ where: { id: evaluation.companyId, adminId: session.user.id } });
    if (!ownsCompany) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } else if (session.user.companyId !== evaluation.companyId) {
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
  // Atomic reaction updates: { messageIndex: number, reaction: string | null }
  if (typeof body.messageIndex === 'number' && body.messageIndex >= 0) {
    const existing = (evaluation.messages as any[] || []);
    if (body.messageIndex < existing.length) {
      await setMessageReaction(id, body.messageIndex, body.reaction ?? null);
    }
  }

  // Apply scalar field updates if any
  if (Object.keys(allowedFields).length > 0) {
    await prisma.evaluation.update({
      where: { id },
      data: allowedFields,
    });
  }

  // Re-fetch to return current state
  const updated = await prisma.evaluation.findUniqueOrThrow({ where: { id } });

  return NextResponse.json(updated);
}
