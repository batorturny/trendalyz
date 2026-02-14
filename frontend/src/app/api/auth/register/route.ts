import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email és jelszó megadása kötelező' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A jelszónak legalább 6 karakter hosszúnak kell lennie' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Ez az email cím már regisztrálva van' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user + company in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create a company for the new admin
      const company = await tx.company.create({
        data: {
          name: name ? `${name} cége` : `${email.split('@')[0]} cége`,
          status: 'ACTIVE',
        },
      });

      // Create the admin user linked to the company
      const newUser = await tx.user.create({
        data: {
          email,
          name: name || null,
          passwordHash,
          role: 'ADMIN',
          companyId: company.id,
          emailVerified: new Date(),
        },
      });

      return newUser;
    });

    return NextResponse.json({ ok: true, email: user.email });
  } catch (error) {
    console.error('[REGISTER]', error);
    return NextResponse.json({ error: 'Szerverhiba' }, { status: 500 });
  }
}
