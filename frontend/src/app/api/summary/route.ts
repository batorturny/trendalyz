import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const session = await auth();
        // Only Admin can save summaries? The component says "Havi összefoglaló / Admin megjegyzés"
        // and checks `isAdmin`. So yes, restricted to ADMIN.
        if (!session?.user || session.user.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { companyId, month, content } = body;

        if (!companyId || !month) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        const summary = await prisma.reportSummary.upsert({
            where: {
                companyId_month: {
                    companyId,
                    month,
                },
            },
            update: {
                content,
            },
            create: {
                companyId,
                month,
                content,
            },
        });

        return NextResponse.json(summary);
    } catch (error) {
        console.error('Error saving summary:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
