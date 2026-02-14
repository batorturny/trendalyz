import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token és jelszó megadása kötelező' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A jelszónak legalább 6 karakter hosszúnak kell lennie' }, { status: 400 });
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Érvénytelen vagy lejárt link. Kérd az adminisztrátort egy új meghívóért.' }, { status: 400 });
    }

    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: verificationToken.identifier, token } },
      });
      return NextResponse.json({ error: 'A link lejárt. Kérd az adminisztrátort egy új meghívóért.' }, { status: 400 });
    }

    // Find the user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json({ error: 'Felhasználó nem található' }, { status: 400 });
    }

    // Hash password and update user
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: new Date(),
      },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: verificationToken.identifier, token } },
    });

    return NextResponse.json({ ok: true, email: user.email });
  } catch (error) {
    console.error('[SET-PASSWORD]', error);
    return NextResponse.json({ error: 'Szerverhiba' }, { status: 500 });
  }
}
