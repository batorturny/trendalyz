import { NextResponse } from 'next/server';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:4000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// Map URL provider slugs to internal provider keys
const PROVIDER_MAP: Record<string, string> = {
  tiktok: 'TIKTOK_ORGANIC',
  youtube: 'YOUTUBE',
  facebook: 'FACEBOOK_ORGANIC',
  instagram: 'INSTAGRAM_ORGANIC',
};

function appUrl(path: string): string {
  const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${origin}${path}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerSlug } = await params;
  const { searchParams } = new URL(req.url);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const provider = PROVIDER_MAP[providerSlug];

  // Platform returned an error (user denied consent, etc.)
  if (error) {
    const msg = errorDescription || error || 'OAuth denied';
    return NextResponse.redirect(
      appUrl(`/admin/companies?oauth=error&message=${encodeURIComponent(msg)}`)
    );
  }

  if (!code || !state || !provider) {
    return NextResponse.redirect(
      appUrl(`/admin/companies?oauth=error&message=${encodeURIComponent('Missing OAuth parameters')}`)
    );
  }

  // Build the callback URI that was used during authorization
  const redirectUri = appUrl(`/api/oauth/callback/${providerSlug}`);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (INTERNAL_API_KEY) {
      headers['Authorization'] = `Bearer ${INTERNAL_API_KEY}`;
    }

    const response = await fetch(`${EXPRESS_API_URL}/api/oauth/complete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ provider, code, state, redirectUri }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const msg = data.error || 'OAuth completion failed';
      const companyId = data.companyId || '';
      const dest = companyId
        ? `/admin/companies/${companyId}?oauth=error&message=${encodeURIComponent(msg)}`
        : `/admin/companies?oauth=error&message=${encodeURIComponent(msg)}`;
      return NextResponse.redirect(appUrl(dest));
    }

    if (data.windsorOnboardUrl) {
      return NextResponse.redirect(
        appUrl(`/admin/companies/${data.companyId}?oauth=success&provider=${encodeURIComponent(provider)}&windsorSetup=${encodeURIComponent(data.windsorOnboardUrl)}`)
      );
    }

    return NextResponse.redirect(
      appUrl(`/admin/companies/${data.companyId}?oauth=success&provider=${encodeURIComponent(provider)}`)
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'OAuth callback error';
    return NextResponse.redirect(
      appUrl(`/admin/companies?oauth=error&message=${encodeURIComponent(msg)}`)
    );
  }
}
