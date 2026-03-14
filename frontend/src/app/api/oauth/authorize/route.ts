import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:4000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

function appUrl(path: string): string {
  const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${origin}${path}`;
}

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.redirect(appUrl('/login'));
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider');
  const companyId = searchParams.get('companyId');

  if (!provider || !companyId) {
    return NextResponse.redirect(
      appUrl(`/admin/companies?oauth=error&message=${encodeURIComponent('Missing parameters')}`)
    );
  }

  // Build the callback redirect URI for the platform
  const callbackUri = appUrl(`/api/oauth/callback/${provider.toLowerCase().replace('_organic', '')}`);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (INTERNAL_API_KEY) {
      headers['Authorization'] = `Bearer ${INTERNAL_API_KEY}`;
    }
    headers['X-User-Id'] = session.user.id;
    headers['X-User-Role'] = session.user.role;

    const expressUrl = `${EXPRESS_API_URL}/api/oauth/authorize?provider=${encodeURIComponent(provider)}&companyId=${encodeURIComponent(companyId)}&redirectUri=${encodeURIComponent(callbackUri)}`;

    const response = await fetch(expressUrl, { headers });
    const data = await response.json();

    if (!response.ok || !data.authorizationUrl) {
      const msg = data.error || 'Failed to create OAuth URL';
      return NextResponse.redirect(
        appUrl(`/admin/companies/${companyId}?oauth=error&message=${encodeURIComponent(msg)}`)
      );
    }

    return NextResponse.redirect(data.authorizationUrl);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'OAuth error';
    return NextResponse.redirect(
      appUrl(`/admin/companies/${companyId}?oauth=error&message=${encodeURIComponent(msg)}`)
    );
  }
}
