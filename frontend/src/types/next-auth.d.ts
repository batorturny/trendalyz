import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'CLIENT';
      companyId: string | null;
      subscriptionTier: string;
      subscriptionStatus: string | null;
      companyLimit: number;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'ADMIN' | 'CLIENT';
    companyId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'ADMIN' | 'CLIENT';
    companyId: string | null;
    subscriptionTier?: string;
    subscriptionStatus?: string | null;
    companyLimit?: number;
  }
}
