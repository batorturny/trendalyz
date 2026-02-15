import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  const isPublic =
    pathname === '/login' ||
    pathname === '/set-password' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/oauth/callback');

  const useSecureCookie = req.url.startsWith('https://');
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    secureCookie: useSecureCookie,
    cookieName: useSecureCookie
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  });
  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;

  if (isPublic) {
    // Redirect logged-in users away from login
    if (isLoggedIn && pathname === '/login') {
      const dest = role === 'ADMIN' ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Client dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (role !== 'CLIENT' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
