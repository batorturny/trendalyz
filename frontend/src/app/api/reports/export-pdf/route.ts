import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:4000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (INTERNAL_API_KEY) {
    headers['Authorization'] = `Bearer ${INTERNAL_API_KEY}`;
  }
  headers['X-User-Id'] = session.user.id;
  headers['X-User-Role'] = session.user.role;
  if (session.user.companyId) {
    headers['X-Company-Id'] = session.user.companyId;
  }

  try {
    const body = await req.text();
    const response = await fetch(`${EXPRESS_API_URL}/api/reports/export-pdf`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    }

    const pdfBuffer = await response.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': response.headers.get('Content-Disposition') || 'attachment; filename="report.pdf"',
      },
    });
  } catch (error) {
    console.error('[PDF-Export Proxy] Error:', error);
    return NextResponse.json({ error: 'Backend service unavailable' }, { status: 502 });
  }
}
