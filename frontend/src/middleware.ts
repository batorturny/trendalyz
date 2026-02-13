import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Public routes
  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/api/auth');

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
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
