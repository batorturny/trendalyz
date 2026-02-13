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
