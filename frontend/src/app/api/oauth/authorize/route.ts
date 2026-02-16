import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:4000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider');
  const companyId = searchParams.get('companyId');

  if (!provider || !companyId) {
    return NextResponse.redirect(
      new URL(`/admin/companies?oauth=error&message=${encodeURIComponent('Hiányzó paraméterek')}`, req.url)
    );
  }

  // Build the callback redirect URI for the platform
  const appUrl = new URL(req.url);
  const callbackUri = `${appUrl.origin}/api/oauth/callback/${provider.toLowerCase().replace('_organic', '')}`;

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
      const msg = data.error || 'Nem sikerült az OAuth URL létrehozása';
      return NextResponse.redirect(
        new URL(`/admin/companies/${companyId}?oauth=error&message=${encodeURIComponent(msg)}`, req.url)
      );
    }

    return NextResponse.redirect(data.authorizationUrl);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'OAuth hiba';
    return NextResponse.redirect(
      new URL(`/admin/companies/${companyId}?oauth=error&message=${encodeURIComponent(msg)}`, req.url)
    );
  }
}
