import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';

export const runtime = 'nodejs';

const WINDSOR_ONBOARD = 'https://onboard.windsor.ai';

function extractSessionCookie(headers: Headers): string {
    const setCookie = headers.getSetCookie?.() || [];
    return setCookie.map((c) => c.split(';')[0]).join('; ');
}

export async function GET(req: Request) {
    // Auth check
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');

    if (!source) {
        return NextResponse.json({ error: 'Missing source parameter' }, { status: 400 });
    }

    try {
        // Get admin's Windsor API key
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { windsorApiKeyEnc: true },
        });

        if (!user?.windsorApiKeyEnc) {
            return NextResponse.json(
                { error: 'Nincs Windsor API kulcs konfigurálva. Kérjük, add meg a Beállítások oldalon.' },
                { status: 400 }
            );
        }

        const apiKey = decrypt(user.windsorApiKeyEnc);

        // Step 1: Generate co-user URL from Windsor
        const genUrl = `${WINDSOR_ONBOARD}/api/team/generate-co-user-url/?api_key=${apiKey}&allowed_sources=${source}`;
        const genRes = await fetch(genUrl, { redirect: 'follow' });

        if (!genRes.ok) {
            const text = await genRes.text();
            console.error('[windsor/auth-link] Generate URL failed:', genRes.status, text);
            return NextResponse.json({ error: `Windsor API hiba: ${genRes.status}` }, { status: 502 });
        }

        const genData = await genRes.json();
        const coUserUrl = genData.url;

        if (!coUserUrl) {
            return NextResponse.json({ error: 'Windsor did not return a co-user URL' }, { status: 502 });
        }

        console.log('[windsor/auth-link] Step 1 OK — co-user URL:', coUserUrl);

        // Step 2: Hit the co-user login URL to get session cookie (DON'T follow redirect)
        const loginRes = await fetch(coUserUrl, { redirect: 'manual' });
        let sessionCookie = extractSessionCookie(loginRes.headers);

        // If it redirects, follow one hop to get the final session cookie
        const loginLocation = loginRes.headers.get('location');
        if (loginRes.status >= 300 && loginRes.status < 400 && loginLocation) {
            const redirectUrl = loginLocation.startsWith('http') ? loginLocation : `${WINDSOR_ONBOARD}${loginLocation}`;
            const rRes = await fetch(redirectUrl, {
                redirect: 'manual',
                headers: { Cookie: sessionCookie },
            });
            const moreCookies = extractSessionCookie(rRes.headers);
            if (moreCookies) sessionCookie = moreCookies;
        }

        console.log('[windsor/auth-link] Step 2 OK — session cookie obtained');

        // Step 3: Hit the authorize endpoint — DON'T follow redirect, capture Location header
        const authUrl = `${WINDSOR_ONBOARD}/${source}/authorize`;
        const authRes = await fetch(authUrl, {
            redirect: 'manual',
            headers: { Cookie: sessionCookie },
        });

        const oauthUrl = authRes.headers.get('location');

        if (authRes.status === 302 && oauthUrl) {
            console.log('[windsor/auth-link] Step 3 OK — OAuth URL:', oauthUrl.substring(0, 80) + '...');
            return NextResponse.json({ url: oauthUrl, source });
        }

        // Debug: log what we got back
        const authBody = await authRes.text();
        console.error('[windsor/auth-link] Authorize failed:', authRes.status, authBody.substring(0, 200));

        return NextResponse.json(
            { error: `Windsor authorize nem adott redirect-et (status: ${authRes.status})` },
            { status: 502 }
        );
    } catch (err) {
        console.error('[windsor/auth-link] Error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Ismeretlen hiba' },
            { status: 500 }
        );
    }
}
