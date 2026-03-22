import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const where: Record<string, unknown> = { status: 'ACTIVE' };
    if (session.user.role === 'ADMIN') {
      where.adminId = session.user.id;
    } else if (session.user.companyId) {
      where.id = session.user.companyId;
    }

    const companies = await prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        tiktokAccountId: true,
        dashboardConfig: true,
        dashboardNotes: true,
        connections: {
          where: { status: 'CONNECTED' },
          select: { provider: true, externalAccountId: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = companies.map(c => {
      const platforms = c.connections.map(conn => conn.provider);
      // Legacy companies with tiktokAccountId but no IntegrationConnection
      if (c.tiktokAccountId && !platforms.includes('TIKTOK_ORGANIC')) {
        platforms.push('TIKTOK_ORGANIC');
      }
      return {
        ...c,
        tiktokAccountId: undefined,
        connectedPlatforms: platforms,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
