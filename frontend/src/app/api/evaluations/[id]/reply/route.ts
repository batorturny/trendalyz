import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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

  const canAccess =
    session.user.role === 'ADMIN' || session.user.companyId === evaluation.companyId;
  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { reply } = await req.json();

  if (typeof reply !== 'string' || reply.trim().length === 0) {
    return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 });
  }

  if (reply.trim().length > 2000) {
    return NextResponse.json({ error: 'Reply too long' }, { status: 400 });
  }

  const updated = await prisma.evaluation.update({
    where: { id },
    data: {
      clientReply: reply.trim(),
      clientReplyAt: new Date(),
      clientUserId: session.user.id,
    },
  });

  return NextResponse.json(updated);
}
