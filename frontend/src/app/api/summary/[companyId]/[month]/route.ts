import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ companyId: string; month: string }> }
) {
    try {
        const session = await auth();
        // Allow if admin OR if user belongs to company
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // In Next.js 15+, params is a Promise
        const { companyId, month } = await params;

        // Optional: Check permissions (if user.companyId === companyId or role === ADMIN)
        const canAccess = session.user.role === 'ADMIN' || session.user.companyId === companyId;
        if (!canAccess) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const summary = await prisma.reportSummary.findUnique({
            where: {
                companyId_month: {
                    companyId,
                    month,
                },
            },
        });

        return NextResponse.json({ content: summary?.content || '' });
    } catch (error) {
        console.error('Error fetching summary:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
