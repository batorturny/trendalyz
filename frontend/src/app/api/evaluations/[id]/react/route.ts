import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const ALLOWED_EMOJIS = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F525}', '\u{1F914}'];

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

  const { emoji } = await req.json();

  // Allow null/empty to deselect, or one of the allowed emojis
  if (emoji && !ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
  }

  const updated = await prisma.evaluation.update({
    where: { id },
    data: { clientReaction: emoji || null },
  });

  return NextResponse.json(updated);
}
