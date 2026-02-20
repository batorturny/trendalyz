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

/**
 * Get a Windsor session cookie via the co-user URL mechanism.
 */
async function getWindsorSession(apiKey: string, source?: string): Promise<string> {
    const allowedSources = source || 'tiktok_organic';
    const genUrl = `${WINDSOR_ONBOARD}/api/team/generate-co-user-url/?api_key=${apiKey}&allowed_sources=${allowedSources}`;
    const genRes = await fetch(genUrl, { redirect: 'follow' });

    if (!genRes.ok) {
        throw new Error(`Windsor co-user URL generation failed: ${genRes.status}`);
    }

    const genData = await genRes.json();
    const coUserUrl = genData.url;
    if (!coUserUrl) throw new Error('Windsor did not return a co-user URL');

    // Hit co-user URL to get session cookie
    const loginRes = await fetch(coUserUrl, { redirect: 'manual' });
    let sessionCookie = extractSessionCookie(loginRes.headers);

    // Follow redirect if needed
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

    return sessionCookie;
}

/**
 * POST /api/windsor/activate-accounts
 * Body: { source: 'tiktok_organic' | 'facebook_organic' | ... }
 *
 * Attempts to auto-activate all accounts for a given datasource in Windsor.
 */
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const source = body.source as string;

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
                { error: 'Nincs Windsor API kulcs konfigurálva.' },
                { status: 400 }
            );
        }

        const apiKey = decrypt(user.windsorApiKeyEnc);

        // Get Windsor session cookie
        const sessionCookie = await getWindsorSession(apiKey, source);
        console.log('[windsor/activate] Session cookie obtained');

        // Step 1: List all datasource accounts
        const dsAccountsUrl = `${WINDSOR_ONBOARD}/api/common/ds-accounts?datasource=${source}`;
        const dsRes = await fetch(dsAccountsUrl, {
            headers: { Cookie: sessionCookie },
        });

        const dsData = await dsRes.json();
        console.log('[windsor/activate] ds-accounts response:', JSON.stringify(dsData).substring(0, 500));

        // Step 2: Try to activate accounts
        // Try multiple possible API patterns
        const results: any[] = [];

        // Pattern 1: Check if there's a toggle/activate endpoint via the same API
        if (Array.isArray(dsData)) {
            for (const account of dsData) {
                const accountId = account.id || account.account_id;
                const accountName = account.name || account.account_name || accountId;
                const isActive = account.status === 'active' || account.active === true || account.enabled === true;

                if (isActive) {
                    results.push({ accountId, accountName, status: 'already_active' });
                    continue;
                }

                // Try activating via POST
                try {
                    const activateRes = await fetch(`${WINDSOR_ONBOARD}/api/common/ds-accounts/${accountId}/activate`, {
                        method: 'POST',
                        headers: {
                            Cookie: sessionCookie,
                            'Content-Type': 'application/json',
                        },
                    });
                    if (activateRes.ok) {
                        results.push({ accountId, accountName, status: 'activated', method: 'activate-endpoint' });
                        continue;
                    }
                } catch { /* try next method */ }

                // Try updating via PATCH
                try {
                    const patchRes = await fetch(`${WINDSOR_ONBOARD}/api/common/ds-accounts/${accountId}`, {
                        method: 'PATCH',
                        headers: {
                            Cookie: sessionCookie,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ active: true, status: 'active', enabled: true }),
                    });
                    if (patchRes.ok) {
                        results.push({ accountId, accountName, status: 'activated', method: 'patch' });
                        continue;
                    }
                } catch { /* try next method */ }

                // Try PUT
                try {
                    const putRes = await fetch(`${WINDSOR_ONBOARD}/api/common/ds-accounts/${accountId}`, {
                        method: 'PUT',
                        headers: {
                            Cookie: sessionCookie,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ ...account, active: true, status: 'active', enabled: true }),
                    });
                    if (putRes.ok) {
                        results.push({ accountId, accountName, status: 'activated', method: 'put' });
                        continue;
                    }
                } catch { /* try next method */ }

                results.push({ accountId, accountName, status: 'failed_to_activate' });
            }
        } else if (dsData && typeof dsData === 'object') {
            // Maybe it's wrapped in a property
            results.push({ rawResponse: dsData, note: 'Unexpected response format' });
        }

        // Step 3: Also try the connectors API select_accounts approach
        // Some Windsor setups use the connectors API to set selected accounts
        let connectorUpdate = null;
        try {
            const datasourcesUrl = `https://connectors.windsor.ai/api/v1/datasources?api_key=${apiKey}`;
            const dsListRes = await fetch(datasourcesUrl);
            const dsList = await dsListRes.json();

            if (Array.isArray(dsList)) {
                const matchingDs = dsList.find((ds: any) =>
                    ds.type === source || ds.datasource_type === source
                );
                if (matchingDs) {
                    connectorUpdate = { datasourceId: matchingDs.id, type: matchingDs.type };
                }
            }
        } catch (e) {
            console.log('[windsor/activate] Datasource lookup error:', e);
        }

        return NextResponse.json({
            success: true,
            source,
            accounts: results,
            connector: connectorUpdate,
            rawDsAccounts: dsData,
        });

    } catch (err) {
        console.error('[windsor/activate] Error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Ismeretlen hiba' },
            { status: 500 }
        );
    }
}
