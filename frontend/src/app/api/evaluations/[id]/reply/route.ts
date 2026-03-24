import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { sendEmail, evaluationReplyEmailHtml } from '@/lib/email';

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK_ORGANIC: 'TikTok',
  FACEBOOK_ORGANIC: 'Facebook',
  INSTAGRAM_ORGANIC: 'Instagram',
  YOUTUBE: 'YouTube',
  TIKTOK_ADS: 'TikTok Ads',
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: { company: { select: { name: true, adminId: true } } },
  });
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

  const currentMessages = (evaluation.messages as any[] || []);
  currentMessages.push({ role: 'client', text: reply.trim(), at: new Date().toISOString() });

  const updated = await prisma.evaluation.update({
    where: { id },
    data: {
      clientReply: reply.trim(),
      clientReplyAt: new Date(),
      clientUserId: session.user.id,
      messages: currentMessages,
    },
  });

  // Send email notification to admin
  if (evaluation.company.adminId) {
    const admin = await prisma.user.findUnique({
      where: { id: evaluation.company.adminId },
      select: { email: true },
    });
    if (admin?.email) {
      const html = evaluationReplyEmailHtml({
        companyName: evaluation.company.name,
        platformLabel: PLATFORM_LABELS[evaluation.platform] || evaluation.platform,
        month: evaluation.month,
        clientReply: reply.trim(),
        clientReaction: updated.clientReaction,
      });
      sendEmail({
        to: admin.email,
        subject: `💬 ${evaluation.company.name} válaszolt az értékelésre`,
        html,
      }).catch(err => console.error('[Evaluation email]', err));
    }
  }

  return NextResponse.json(updated);
}
