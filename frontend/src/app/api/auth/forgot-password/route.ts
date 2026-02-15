import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email megadása kötelező' }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      ok: true,
      message: 'Ha létezik ilyen fiók, elküldtük a jelszó-visszaállító linket.',
    });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return successResponse;
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });

    // Send email via Resend
    if (!process.env.RESEND_API_KEY) {
      console.error('[FORGOT-PASSWORD] RESEND_API_KEY not set, cannot send email');
      return successResponse;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const resetUrl = `${process.env.NEXTAUTH_URL}/set-password?token=${token}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@makeden.hu',
      to: user.email,
      subject: 'Jelszó visszaállítás - Trendalyz',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0891b2;">Trendalyz</h2>
          <p>Jelszó-visszaállítási kérelmet kaptunk a fiókodhoz.</p>
          <p>Kattints az alábbi gombra az új jelszó beállításához:</p>
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Új jelszó beállítása
          </a>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
            A link 1 órán belül lejár. Ha nem te kérted, nyugodtan figyelmen kívül hagyhatod ezt az emailt.
          </p>
        </div>
      `,
    });

    return successResponse;
  } catch (error) {
    console.error('[FORGOT-PASSWORD]', error);
    return NextResponse.json({ error: 'Szerverhiba' }, { status: 500 });
  }
}
