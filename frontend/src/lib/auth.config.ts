import type { NextAuthConfig } from 'next-auth';

// Edge-compatible auth config (no Node.js modules like Prisma, bcrypt, Resend)
// Used by middleware for JWT verification only
export const authConfig = {
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role || 'CLIENT';
        token.companyId = user.companyId || null;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as 'ADMIN' | 'CLIENT';
        session.user.companyId = token.companyId as string | null;
      }
      return session;
    },
  },
  providers: [], // Providers configured in full auth.ts only
} satisfies NextAuthConfig;
