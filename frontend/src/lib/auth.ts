import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Email from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    // Admin: email + password login
    Credentials({
      id: 'credentials',
      name: 'Bejelentkezés',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Jelszó', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'ADMIN' | 'CLIENT',
          companyId: user.companyId,
        };
      },
    }),
    // Client: magic link via email
    Email({
      id: 'email',
      name: 'Magic Link',
      server: { host: 'smtp.resend.com', port: 465, auth: { user: 'resend', pass: process.env.RESEND_API_KEY || 'dummy' } },
      from: process.env.EMAIL_FROM || 'noreply@capmarketing.hu',
      async sendVerificationRequest({ identifier: email, url }) {
        if (!resend) {
          console.log(`[DEV] Magic link for ${email}: ${url}`);
          return;
        }

        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@capmarketing.hu',
          to: email,
          subject: 'Bejelentkezés - TikTok Report',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0891b2;">TikTok Report Generator</h2>
              <p>Kattints az alábbi linkre a bejelentkezéshez:</p>
              <a href="${url}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Bejelentkezés
              </a>
              <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
                Ha nem te kérted ezt a linket, nyugodtan figyelmen kívül hagyhatod.
              </p>
            </div>
          `,
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For email provider: only allow existing users (admin must add them first)
      if (account?.provider === 'email') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existingUser) return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'CLIENT';
        token.companyId = (user as any).companyId || null;
      }
      // Refresh role/companyId from DB on each request
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, companyId: true },
        });
        if (dbUser) {
          token.role = dbUser.role as 'ADMIN' | 'CLIENT';
          token.companyId = dbUser.companyId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as 'ADMIN' | 'CLIENT';
        session.user.companyId = token.companyId as string | null;
      }
      return session;
    },
  },
});
