import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { companyLimit: true },
    });

    const companyCount = await prisma.company.count({
      where: { adminId: session.user.id },
    });

    return NextResponse.json({
      companyCount,
      companyLimit: sub?.companyLimit || 1,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
