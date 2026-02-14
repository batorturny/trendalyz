'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function createCompany(formData: FormData) {
  await requireAdmin();

  const name = formData.get('name') as string;
  const tiktokAccountId = formData.get('tiktokAccountId') as string;
  const clientEmail = formData.get('clientEmail') as string;

  if (!name) throw new Error('Cégnév megadása kötelező');

  const company = await prisma.company.create({
    data: {
      name,
      tiktokAccountId: tiktokAccountId || null,
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

    // Send invite email
    if (resend) {
      const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`;
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@capmarketing.hu',
        to: clientEmail,
        subject: `Meghívó - ${name} TikTok Riport`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0891b2;">TikTok Report Generator</h2>
            <p>Meghívást kaptál a <strong>${name}</strong> cég TikTok riportjainak megtekintéséhez.</p>
            <p>A bejelentkezéshez használd az email címedet:</p>
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Bejelentkezés
            </a>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
              Az "Ügyfél" módot válaszd és add meg az email címedet. Egy bejelentkezési linket fogsz kapni.
            </p>
          </div>
        `,
      });
    } else {
      console.log(`[DEV] Invite email would be sent to ${clientEmail} for ${name}`);
    }
  }

  revalidatePath('/admin/companies');
  redirect('/admin/companies');
}

export async function updateCompany(companyId: string, formData: FormData) {
  await requireAdmin();

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

export async function deleteCompany(companyId: string) {
  await requireAdmin();

  // Unlink users first
  await prisma.user.updateMany({
    where: { companyId },
    data: { companyId: null },
  });

  await prisma.company.delete({ where: { id: companyId } });

  revalidatePath('/admin/companies');
  redirect('/admin/companies');
}

export async function addUserToCompany(companyId: string, formData: FormData) {
  await requireAdmin();

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

  // Send invite email
  if (resend) {
    const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`;
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@capmarketing.hu',
      to: email,
      subject: `Meghívó - ${company.name} TikTok Riport`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0891b2;">TikTok Report Generator</h2>
          <p>Meghívást kaptál a <strong>${company.name}</strong> cég TikTok riportjainak megtekintéséhez.</p>
          <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Bejelentkezés
          </a>
        </div>
      `,
    });
  }

  revalidatePath(`/admin/companies/${companyId}`);
}

export async function removeUserFromCompany(userId: string, companyId: string) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { companyId: null },
  });

  revalidatePath(`/admin/companies/${companyId}`);
}

// ============================================
// WINDSOR SYNC
// ============================================

export async function syncWindsorAccounts(): Promise<{
  discovered: number;
  created: number;
  skipped: number;
  details: string[];
}> {
  await requireAdmin();

  const windsorApiKey = process.env.WINDSOR_API_KEY;
  if (!windsorApiKey) {
    throw new Error('Windsor API kulcs nincs konfigurálva');
  }

  // Fetch discovered accounts directly from Windsor API
  const now = new Date();
  const dateTo = now.toISOString().split('T')[0];
  const dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const fields = 'account_id,account_name,date';
  const url = `https://connectors.windsor.ai/tiktok_organic?api_key=${windsorApiKey}&date_from=${dateFrom}&date_to=${dateTo}&fields=${fields}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    throw new Error('Nem sikerült lekérdezni a Windsor fiókokat');
  }

  const rawData = await res.json();
  const rows = Array.isArray(rawData) ? (rawData[0]?.data || []) : (rawData?.data || []);

  // Extract unique accounts
  const accountMap = new Map<string, string>();
  for (const row of rows) {
    if (row.account_id && !accountMap.has(row.account_id)) {
      accountMap.set(row.account_id, row.account_name || row.account_id);
    }
  }
  const accounts = Array.from(accountMap.entries()).map(([accountId, accountName]) => ({ accountId, accountName }));

  const details: string[] = [];
  let created = 0;
  let skipped = 0;

  for (const account of accounts) {
    // Check if company already exists with this tiktokAccountId
    const existing = await prisma.company.findFirst({
      where: { tiktokAccountId: account.accountId },
      include: { connections: true },
    });

    if (existing) {
      // Ensure IntegrationConnection exists
      const hasConnection = existing.connections.some(
        (c) => c.provider === 'TIKTOK_ORGANIC' && c.externalAccountId === account.accountId
      );
      if (!hasConnection) {
        await prisma.integrationConnection.create({
          data: {
            companyId: existing.id,
            provider: 'TIKTOK_ORGANIC',
            externalAccountId: account.accountId,
            externalAccountName: account.accountName,
            status: 'CONNECTED',
          },
        });
        details.push(`${account.accountName}: kapcsolat hozzaadva`);
      } else {
        details.push(`${account.accountName}: mar letezik`);
      }
      skipped++;
      continue;
    }

    // Create new company + connection
    const company = await prisma.company.create({
      data: {
        name: account.accountName,
        tiktokAccountId: account.accountId,
        status: 'ACTIVE',
      },
    });

    await prisma.integrationConnection.create({
      data: {
        companyId: company.id,
        provider: 'TIKTOK_ORGANIC',
        externalAccountId: account.accountId,
        externalAccountName: account.accountName,
        status: 'CONNECTED',
      },
    });

    details.push(`${account.accountName}: letrehozva`);
    created++;
  }

  revalidatePath('/admin/companies');
  return { discovered: accounts.length, created, skipped, details };
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
  await requireAdmin();

  const validProviders = ['TIKTOK_ORGANIC', 'FACEBOOK_ORGANIC', 'INSTAGRAM_ORGANIC', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK'];
  if (!validProviders.includes(provider)) {
    throw new Error('Érvénytelen platform');
  }

  try {
    await prisma.integrationConnection.create({
      data: {
        companyId,
        provider: provider as 'TIKTOK_ORGANIC' | 'FACEBOOK_ORGANIC' | 'INSTAGRAM_ORGANIC',
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
  await requireAdmin();

  await prisma.integrationConnection.delete({
    where: { id: connectionId },
  });

  revalidatePath(`/admin/companies/${companyId}`);
}

export async function testConnection(connectionId: string): Promise<{ success: boolean; message: string }> {
  await requireAdmin();

  const connection = await prisma.integrationConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    return { success: false, message: 'Integráció nem található' };
  }

  const windsorApiKey = process.env.WINDSOR_API_KEY;
  if (!windsorApiKey) {
    return { success: false, message: 'Windsor API kulcs nincs konfigurálva' };
  }

  const WINDSOR_BASE = 'https://connectors.windsor.ai';
  const PROVIDER_ENDPOINTS: Record<string, string> = {
    TIKTOK_ORGANIC: 'tiktok_organic',
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
        status: success ? 'CONNECTED' : 'ERROR',
        errorMessage: success ? null : 'Nincs elérhető adat az elmúlt 30 napban',
        ...(success ? { lastSyncAt: new Date() } : {}),
      },
    });

    revalidatePath(`/admin/companies/${connection.companyId}`);
    return {
      success,
      message: success
        ? `Sikeres kapcsolat - ${rows.length} sor adat az elmúlt 30 napban`
        : 'Nincs elérhető adat az elmúlt 30 napban',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Ismeretlen hiba';
    return { success: false, message: `Windsor API hiba: ${msg}` };
  }
}
