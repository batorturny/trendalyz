import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Email from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { authConfig } from './auth.config';

// Build providers list dynamically — only include providers with valid config
// This prevents a misconfigured provider from breaking the entire auth system
const providers: any[] = [
  // Admin: email + password login (always available)
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
];

// Google OAuth — only if both client ID and secret are set (non-empty)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
} else {
  console.warn('[AUTH] Google OAuth disabled — GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
}

// Email magic link — only if Resend API key is set (non-empty)
if (process.env.RESEND_API_KEY) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  providers.push(
    Email({
      id: 'email',
      name: 'Magic Link',
      server: {
        host: 'smtp.resend.com',
        port: 465,
        auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
      },
      from: process.env.EMAIL_FROM || 'noreply@capmarketing.hu',
      async sendVerificationRequest({ identifier: email, url }) {
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
    })
  );
} else {
  console.warn('[AUTH] Email provider disabled — RESEND_API_KEY not set');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // For email provider: only allow existing users (admin must add them first)
      if (account?.provider === 'email') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existingUser) return false;
      }
      // Google OAuth: only allow existing users (admin must add them first)
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existingUser) {
          return false; // Reject - admin must invite the user first
        } else {
          // Link Google account to existing user if not already linked
          const existingAccount = await prisma.account.findFirst({
            where: {
              userId: existingUser.id,
              provider: account.provider,
            },
          });
          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
          }
        }
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
