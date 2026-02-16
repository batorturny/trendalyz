'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

// ========== WINDSOR API KEY ==========

export async function hasWindsorApiKey(): Promise<boolean> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { windsorApiKeyEnc: true },
  });
  return !!user?.windsorApiKeyEnc;
}

export async function saveWindsorApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  const session = await requireAdmin();

  if (!apiKey || apiKey.trim().length === 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { windsorApiKeyEnc: null },
    });
    return { success: true, message: 'Windsor API kulcs törölve' };
  }

  const encrypted = encrypt(apiKey.trim());

  await prisma.user.update({
    where: { id: session.user.id },
    data: { windsorApiKeyEnc: encrypted },
  });

  return { success: true, message: 'Windsor API kulcs mentve' };
}

export async function testWindsorApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  await requireAdmin();

  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, message: 'Adj meg egy API kulcsot a teszteléshez' };
  }

  try {
    // Test by querying tiktok_organic with a 1-day range
    const now = new Date();
    const dateTo = now.toISOString().split('T')[0];
    const dateFrom = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const url = `https://connectors.windsor.ai/tiktok_organic?api_key=${apiKey.trim()}&date_from=${dateFrom}&date_to=${dateTo}&fields=date`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });

    if (res.ok) {
      return { success: true, message: 'Sikeres kapcsolat a Windsor API-val' };
    }

    if (res.status === 401 || res.status === 403) {
      return { success: false, message: 'Érvénytelen API kulcs' };
    }

    return { success: false, message: `Windsor API hiba: ${res.status}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Ismeretlen hiba';
    return { success: false, message: `Kapcsolódási hiba: ${msg}` };
  }
}
