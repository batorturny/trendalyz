'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function redeemCoupon(code: string): Promise<{ success: boolean; tier?: string; companyLimit?: number; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Nincs jogosultságod' };
  }

  if (!code) {
    return { success: false, error: 'Kuponkód megadása kötelező' };
  }

  if (code !== '22445599') {
    return { success: false, error: 'Érvénytelen kuponkód' };
  }

  try {
    const subscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        tier: 'ENTERPRISE',
        status: 'ACTIVE',
        companyLimit: 100,
      },
      create: {
        userId: session.user.id,
        tier: 'ENTERPRISE',
        status: 'ACTIVE',
        companyLimit: 100,
      },
    });

    revalidatePath('/admin/billing');
    revalidatePath('/admin/companies');

    return { success: true, tier: subscription.tier, companyLimit: subscription.companyLimit };
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return { success: false, error: 'Hiba a kupon beváltásnál' };
  }
}
