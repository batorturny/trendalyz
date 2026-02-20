import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:4000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

interface ProxyOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  companyIdFromBody?: string; // field name in body containing companyId to check access
}

export async function proxyToExpress(
  req: Request,
  expressPath: string,
  options: ProxyOptions = { requireAuth: true }
) {
  // Auth check
  const session = await auth();

  if (options.requireAuth && !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (options.requireAdmin && session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Company access check for CLIENT users
  if (options.companyIdFromBody && session?.user?.role === 'CLIENT') {
    try {
      const body = await req.clone().json();
      const requestedCompanyId = body[options.companyIdFromBody];
      if (requestedCompanyId && requestedCompanyId !== session.user.companyId) {
        return NextResponse.json({ error: 'Forbidden - No access to this company' }, { status: 403 });
      }
    } catch {
      // If body parse fails, let it through - Express will validate
    }
  }

  // Build headers for Express
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (INTERNAL_API_KEY) {
    headers['Authorization'] = `Bearer ${INTERNAL_API_KEY}`;
  }

  // Forward user context
  if (session?.user) {
    headers['X-User-Id'] = session.user.id;
    headers['X-User-Role'] = session.user.role;
    if (session.user.companyId) {
      headers['X-Company-Id'] = session.user.companyId;
    }
  }

  // Proxy the request
  const url = `${EXPRESS_API_URL}${expressPath}`;

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      fetchOptions.body = await req.text();
    } catch {
      // No body
    }
  }

  try {
    const response = await fetch(url, fetchOptions);
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: response.status });
    } catch {
      console.error(`Proxy: non-JSON response from ${url} (${response.status}):`, text.slice(0, 200));
      return NextResponse.json(
        { error: 'Backend returned unexpected response' },
        { status: response.status >= 400 ? response.status : 502 }
      );
    }
  } catch (error) {
    console.error(`Proxy error to ${url}:`, error);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}
