'use server';

import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function deleteMyAccount(): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Nincs bejelentkezve' };
  }

  const userId = session.user.id;

  try {
    // Delete related records first
    await prisma.verificationToken.deleteMany({
      where: { identifier: session.user.email! },
    });

    await prisma.account.deleteMany({
      where: { userId },
    });

    await prisma.session.deleteMany({
      where: { userId },
    });

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error('[DELETE-ACCOUNT]', error);
    return { success: false, error: 'Nem sikerült törölni a fiókot' };
  }
}
