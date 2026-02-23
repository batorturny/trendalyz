'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function getAdminWindsorApiKey(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { windsorApiKeyEnc: true },
  });
  if (user?.windsorApiKeyEnc) {
    return decrypt(user.windsorApiKeyEnc);
  }
  // Fallback to central Windsor API key
  if (process.env.WINDSOR_API_KEY) {
    return process.env.WINDSOR_API_KEY;
  }
  throw new Error('Nincs Windsor API kulcs konfigurálva. Kérjük, add meg a Beállítások oldalon.');
}

async function getAdminPersonalWindsorApiKey(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { windsorApiKeyEnc: true },
  });
  if (user?.windsorApiKeyEnc) {
    return decrypt(user.windsorApiKeyEnc);
  }
  throw new Error('Szinkronizáláshoz saját Windsor API kulcs szükséges. Add meg a Beállítások oldalon.');
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

async function requireCompanyOwnership(companyId: string) {
  const session = await requireAdmin();
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { adminId: true } });
  if (!company || company.adminId !== session.user.id) {
    throw new Error('Cég nem található');
  }
  return session;
}

export async function createCompany(formData: FormData) {
  const session = await requireAdmin();

  // Billing limit check
  if (process.env.ENABLE_BILLING === 'true') {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { companyLimit: true, status: true },
    });

    const companyCount = await prisma.company.count({
      where: { adminId: session.user.id },
    });

    const limit = subscription?.companyLimit || 1;
    const status = subscription?.status;

    if (status && !['TRIALING', 'ACTIVE'].includes(status)) {
      throw new Error('Aktív előfizetés szükséges új cég hozzáadásához');
    }

    if (companyCount >= limit) {
      throw new Error(`Elérted a csomagod limitjét (${companyCount}/${limit}). Válts magasabb csomagra a Számlázás oldalon.`);
    }
  }

  const name = formData.get('name') as string;
  const tiktokAccountId = formData.get('tiktokAccountId') as string;
  const clientEmail = formData.get('clientEmail') as string;

  if (!name) throw new Error('Cégnév megadása kötelező');

  const company = await prisma.company.create({
    data: {
      name,
      tiktokAccountId: tiktokAccountId || null,
      adminId: session.user.id,
      status: 'ACTIVE',
    },
  });

  // If client email provided, create user and send invite
  if (clientEmail) {
    const existingUser = await prisma.user.findUnique({ where: { email: clientEmail } });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: clientEmail,
          role: 'CLIENT',
          companyId: company.id,
        },
      });
    } else {
      // Link existing user to this company
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { companyId: company.id },
      });
    }

    // Generate invite token and send set-password email
    const inviteToken = crypto.randomUUID();
    const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: { identifier: clientEmail, token: inviteToken, expires: inviteExpires },
    });

    const setPasswordUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/set-password?token=${inviteToken}`;

    if (resend) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@trendalyz.hu',
        to: clientEmail,
        subject: `Meghívó - ${name} Trendalyz`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0891b2;">Trendalyz</h2>
            <p>Meghívást kaptál a <strong>${name}</strong> cég riportjainak megtekintéséhez.</p>
            <p>Kattints az alábbi gombra a jelszavad beállításához:</p>
            <a href="${setPasswordUrl}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Jelszó beállítása
            </a>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
              Ez a link 24 órán belül lejár. Ha nem te kaptad ezt az emailt, figyelmen kívül hagyhatod.
            </p>
          </div>
        `,
      });
    } else {
      console.log(`\n📧 [DEV] Meghívó email → ${clientEmail} (${name})`);
      console.log(`🔗 ${setPasswordUrl}\n`);
    }
  }

  revalidatePath('/admin/companies');
  revalidateTag('admin-stats', 'default');
  redirect('/admin/companies');
}

export async function updateCompany(companyId: string, formData: FormData) {
  await requireCompanyOwnership(companyId);

  const name = formData.get('name') as string;
  const tiktokAccountId = formData.get('tiktokAccountId') as string;
  const status = formData.get('status') as string;

  await prisma.company.update({
    where: { id: companyId },
    data: {
      name: name || undefined,
      tiktokAccountId: tiktokAccountId || null,
      status: (status as 'ACTIVE' | 'INACTIVE' | 'PENDING') || undefined,
    },
  });

  revalidatePath('/admin/companies');
  revalidatePath(`/admin/companies/${companyId}`);
}

export async function toggleCompanyStatus(companyId: string, status: 'ACTIVE' | 'INACTIVE') {
  await requireCompanyOwnership(companyId);

  await prisma.company.update({
    where: { id: companyId },
    data: { status },
  });

  revalidatePath('/admin/companies');
  revalidatePath(`/admin/companies/${companyId}`);
}

export async function updateEmailSchedule(companyId: string, emailDay: number, emailHour: number) {
  await requireCompanyOwnership(companyId);

  if (emailDay < 1 || emailDay > 28) throw new Error('A nap 1 és 28 között kell legyen');
  if (emailHour < 0 || emailHour > 23) throw new Error('Az óra 0 és 23 között kell legyen');

  await prisma.company.update({
    where: { id: companyId },
    data: { emailDay, emailHour },
  });

  revalidatePath(`/admin/companies/${companyId}`);
}

export async function deleteCompany(companyId: string) {
  await requireCompanyOwnership(companyId);

  // Unlink users first
  await prisma.user.updateMany({
    where: { companyId },
    data: { companyId: null },
  });

  await prisma.company.delete({ where: { id: companyId } });

  revalidatePath('/admin/companies');
  revalidateTag('admin-stats', 'default');
  redirect('/admin/companies');
}

export async function addUserToCompany(companyId: string, formData: FormData) {
  await requireCompanyOwnership(companyId);

  const email = formData.get('email') as string;
  if (!email) throw new Error('Email megadása kötelező');

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Cég nem található');

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { companyId, role: 'CLIENT' },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        role: 'CLIENT',
        companyId,
      },
    });
  }

  // Generate invite token and send set-password email
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  const setPasswordUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/set-password?token=${token}`;

  if (resend) {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@trendalyz.hu',
      to: email,
      subject: `Meghívó - ${company.name} Trendalyz`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0891b2;">Trendalyz</h2>
          <p>Meghívást kaptál a <strong>${company.name}</strong> cég riportjainak megtekintéséhez.</p>
          <p>Kattints az alábbi gombra a jelszavad beállításához:</p>
          <a href="${setPasswordUrl}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Jelszó beállítása
          </a>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
            Ez a link 24 órán belül lejár. Ha nem te kaptad ezt az emailt, figyelmen kívül hagyhatod.
          </p>
        </div>
      `,
    });
  } else {
    console.log(`\n📧 [DEV] Meghívó email → ${email} (${company.name})`);
    console.log(`🔗 ${setPasswordUrl}\n`);
  }

  revalidatePath(`/admin/companies/${companyId}`);
}

export async function resendInvite(userId: string, companyId: string) {
  await requireCompanyOwnership(companyId);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Felhasználó nem található');
  if (user.companyId !== companyId) throw new Error('A felhasználó nem ehhez a céghez tartozik');

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Cég nem található');

  // Delete old tokens for this user
  await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });

  // Generate new invite token
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires },
  });

  const setPasswordUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/set-password?token=${token}`;

  if (resend) {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@trendalyz.hu',
      to: user.email,
      subject: `Meghívó újraküldve - ${company.name} Trendalyz`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0891b2;">Trendalyz</h2>
          <p>Meghívást kaptál a <strong>${company.name}</strong> cég riportjainak megtekintéséhez.</p>
          <p>Kattints az alábbi gombra a jelszavad beállításához:</p>
          <a href="${setPasswordUrl}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Jelszó beállítása
          </a>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
            Ez a link 24 órán belül lejár. Ha nem te kaptad ezt az emailt, figyelmen kívül hagyhatod.
          </p>
        </div>
      `,
    });
  } else {
    console.log(`\n📧 [DEV] Meghívó újraküldve → ${user.email} (${company.name})`);
    console.log(`🔗 ${setPasswordUrl}\n`);
  }

  revalidatePath(`/admin/companies/${companyId}`);
}

export async function removeUserFromCompany(userId: string, companyId: string) {
  await requireCompanyOwnership(companyId);

  await prisma.user.update({
    where: { id: userId },
    data: { companyId: null },
  });

  revalidatePath(`/admin/companies/${companyId}`);
}

// ============================================
// WINDSOR SYNC — ALL PLATFORMS
// ============================================

import type { DiscoveredAccount, ExistingCompany, AccountGroup } from '@/lib/accountGrouping';
import { groupAccounts } from '@/lib/accountGrouping';
import { PROVIDERS, type ConnectionProvider } from '@/types/integration';

const WINDSOR_BASE = 'https://connectors.windsor.ai';

interface PlatformDiscoveryResult {
  provider: ConnectionProvider;
  label: string;
  accounts: DiscoveredAccount[];
  error: string | null;
}

export interface SyncDiscoveryResult {
  platforms: PlatformDiscoveryResult[];
  groups: AccountGroup[];
  existingCompanies: ExistingCompany[];
}

export async function syncAllPlatforms(): Promise<SyncDiscoveryResult> {
  const session = await requireAdmin();
  // Sync ONLY works with personal API key — never use central fallback
  const windsorApiKey = await getAdminPersonalWindsorApiKey(session.user.id);

  const now = new Date();
  const dateTo = now.toISOString().split('T')[0];
  const dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch all platforms in parallel
  const platformResults = await Promise.all(
    PROVIDERS.map(async (p): Promise<PlatformDiscoveryResult> => {
      try {
        const url = `${WINDSOR_BASE}/${p.windsorEndpoint}?api_key=${windsorApiKey}&date_from=${dateFrom}&date_to=${dateTo}&fields=account_id,account_name,date`;
        const res = await fetch(url, { signal: AbortSignal.timeout(30000) });

        if (!res.ok) {
          return { provider: p.key, label: p.label, accounts: [], error: `HTTP ${res.status}` };
        }

        const rawData = await res.json();
        const rows = Array.isArray(rawData) ? (rawData[0]?.data || []) : (rawData?.data || []);

        const accountMap = new Map<string, string>();
        for (const row of rows) {
          if (row.account_id && !accountMap.has(row.account_id)) {
            accountMap.set(row.account_id, row.account_name || row.account_id);
          }
        }

        const accounts: DiscoveredAccount[] = Array.from(accountMap.entries()).map(
          ([accountId, accountName]) => ({ accountId, accountName, provider: p.key })
        );

        return { provider: p.key, label: p.label, accounts, error: null };
      } catch (err) {
        return {
          provider: p.key,
          label: p.label,
          accounts: [],
          error: err instanceof Error ? err.message : 'Ismeretlen hiba',
        };
      }
    })
  );

  // Gather all discovered accounts
  const allAccounts: DiscoveredAccount[] = platformResults.flatMap(r => r.accounts);

  // Fetch existing companies with connections
  const companies = await prisma.company.findMany({
    where: { adminId: session.user.id },
    include: {
      connections: {
        select: {
          provider: true,
          externalAccountId: true,
          externalAccountName: true,
        },
      },
    },
  });

  const existingCompanies: ExistingCompany[] = companies.map(c => ({
    id: c.id,
    name: c.name,
    connections: c.connections.map(conn => ({
      provider: conn.provider as ConnectionProvider,
      externalAccountId: conn.externalAccountId,
      externalAccountName: conn.externalAccountName,
    })),
  }));

  // Group accounts
  const groups = groupAccounts(allAccounts, existingCompanies);

  return { platforms: platformResults, groups, existingCompanies };
}

// ============================================
// EXECUTE SYNC PLAN
// ============================================

export interface SyncPlanGroup {
  companyName: string;
  existingCompanyId: string | null;
  skip: boolean;
  accounts: { provider: ConnectionProvider; accountId: string; accountName: string }[];
}

export async function executeSyncPlan(groups: SyncPlanGroup[]): Promise<{
  created: number;
  updated: number;
  skipped: number;
  details: string[];
}> {
  const session = await requireAdmin();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const details: string[] = [];

  // Check billing limit for new companies
  let companyLimit = Infinity;
  if (process.env.ENABLE_BILLING === 'true') {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { companyLimit: true },
    });
    companyLimit = subscription?.companyLimit ?? 1;
  }
  let currentCount = await prisma.company.count({ where: { adminId: session.user.id } });

  for (const group of groups) {
    if (group.skip) {
      skipped++;
      details.push(`${group.companyName}: kihagyva`);
      continue;
    }

    let companyId: string;

    if (group.existingCompanyId) {
      // Verify the company belongs to this admin
      const existing = await prisma.company.findFirst({
        where: { id: group.existingCompanyId, adminId: session.user.id },
      });
      if (!existing) {
        details.push(`${group.companyName}: cég nem található, kihagyva`);
        skipped++;
        continue;
      }
      companyId = existing.id;

      // Update company name if changed
      if (existing.name !== group.companyName) {
        await prisma.company.update({
          where: { id: companyId },
          data: { name: group.companyName },
        });
      }

      updated++;
      details.push(`${group.companyName}: frissítve`);
    } else {
      // Check billing limit before creating
      if (currentCount >= companyLimit) {
        skipped++;
        details.push(`${group.companyName}: kihagyva (elérted a cég limitet: ${currentCount}/${companyLimit})`);
        continue;
      }

      // Create new company
      const company = await prisma.company.create({
        data: {
          name: group.companyName,
          adminId: session.user.id,
          status: 'ACTIVE',
        },
      });
      companyId = company.id;
      currentCount++;
      created++;
      details.push(`${group.companyName}: létrehozva`);
    }

    // Upsert IntegrationConnections for each account
    for (const account of group.accounts) {
      const existing = await prisma.integrationConnection.findFirst({
        where: {
          companyId,
          provider: account.provider,
          externalAccountId: account.accountId,
        },
      });

      if (!existing) {
        await prisma.integrationConnection.create({
          data: {
            companyId,
            provider: account.provider,
            externalAccountId: account.accountId,
            externalAccountName: account.accountName,
            status: 'CONNECTED',
          },
        });
      } else {
        await prisma.integrationConnection.update({
          where: { id: existing.id },
          data: {
            externalAccountName: account.accountName,
            status: 'CONNECTED',
          },
        });
      }
    }
  }

  revalidatePath('/admin/companies');
  revalidateTag('admin-stats', 'default');
  return { created, updated, skipped, details };
}

// ============================================
// CONNECTION ACTIONS
// ============================================

export async function addConnection(
  companyId: string,
  provider: string,
  externalAccountId: string,
  externalAccountName: string | null
) {
  await requireCompanyOwnership(companyId);

  const validProviders = ['TIKTOK_ORGANIC', 'TIKTOK_ADS', 'FACEBOOK_ORGANIC', 'INSTAGRAM_ORGANIC', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK'];
  if (!validProviders.includes(provider)) {
    throw new Error('Érvénytelen platform');
  }

  try {
    await prisma.integrationConnection.create({
      data: {
        companyId,
        provider: provider as any,
        externalAccountId,
        externalAccountName,
        status: 'CONNECTED',
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      throw new Error('Ez az integráció már létezik ehhez a céghez');
    }
    throw error;
  }

  revalidatePath(`/admin/companies/${companyId}`);
}

export async function deleteConnection(connectionId: string, companyId: string) {
  await requireCompanyOwnership(companyId);

  await prisma.integrationConnection.delete({
    where: { id: connectionId },
  });

  revalidatePath(`/admin/companies/${companyId}`);
}

export async function testConnection(connectionId: string): Promise<{ success: boolean; message: string }> {
  const session = await requireAdmin();

  const connection = await prisma.integrationConnection.findUnique({
    where: { id: connectionId },
    include: { company: { select: { adminId: true } } },
  });

  if (!connection || connection.company.adminId !== session.user.id) {
    return { success: false, message: 'Integráció nem található' };
  }

  let windsorApiKey: string;
  try {
    windsorApiKey = await getAdminWindsorApiKey(session.user.id);
  } catch {
    return { success: false, message: 'Windsor API kulcs nincs konfigurálva' };
  }

  const WINDSOR_BASE = 'https://connectors.windsor.ai';
  const PROVIDER_ENDPOINTS: Record<string, string> = {
    TIKTOK_ORGANIC: 'tiktok_organic',
    TIKTOK_ADS: 'tiktok',
    FACEBOOK_ORGANIC: 'facebook_organic',
    INSTAGRAM_ORGANIC: 'instagram',
    INSTAGRAM: 'instagram',
    FACEBOOK: 'facebook',
    YOUTUBE: 'youtube',
  };

  const endpoint = PROVIDER_ENDPOINTS[connection.provider];
  if (!endpoint) {
    return { success: false, message: `Ismeretlen platform: ${connection.provider}` };
  }

  try {
    const now = new Date();
    const dateTo = now.toISOString().split('T')[0];
    const dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const url = `${WINDSOR_BASE}/${endpoint}?api_key=${windsorApiKey}&date_from=${dateFrom}&date_to=${dateTo}&fields=date&select_accounts=${connection.externalAccountId}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });

    if (!res.ok) {
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: { status: 'ERROR', errorMessage: `Windsor API hiba: ${res.status}` },
      });
      return { success: false, message: `Windsor API hiba: ${res.status}` };
    }

    const rawData = await res.json();
    const rows = Array.isArray(rawData) ? (rawData[0]?.data || []) : (rawData?.data || []);
    const success = Array.isArray(rows) && rows.length > 0;

    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        status: 'CONNECTED',
        errorMessage: null,
        lastSyncAt: new Date(),
      },
    });

    revalidatePath(`/admin/companies/${connection.companyId}`);
    return {
      success: true,
      message: success
        ? `Sikeres kapcsolat - ${rows.length} sor adat az elmúlt 30 napban`
        : 'Sikeres kapcsolat - nincs adat az elmúlt 30 napban',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Ismeretlen hiba';
    return { success: false, message: `Windsor API hiba: ${msg}` };
  }
}

// ============================================
// DASHBOARD CONFIG
// ============================================

export async function updateDashboardConfig(
  companyId: string,
  config: Record<string, { kpis: string[]; charts: string[] }>,
  notes?: Record<string, string>
) {
  const session = await requireAdmin();

  // Verify company belongs to this admin
  const company = await prisma.company.findFirst({
    where: { id: companyId, adminId: session.user.id },
  });
  if (!company) throw new Error('Cég nem található');

  await prisma.company.update({
    where: { id: companyId },
    data: {
      dashboardConfig: config,
      ...(notes !== undefined && { dashboardNotes: notes }),
    },
  });

  revalidatePath(`/admin/companies/${companyId}`);
}
