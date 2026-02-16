import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ companyId: string }> }
) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { companyId } = await params;

    const connections = await prisma.integrationConnection.findMany({
        where: { companyId },
        select: {
            id: true,
            provider: true,
            status: true,
            externalAccountId: true,
            externalAccountName: true,
        },
        orderBy: [{ provider: 'asc' }],
    });

    return NextResponse.json(connections);
}
