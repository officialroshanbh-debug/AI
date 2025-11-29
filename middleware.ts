import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host');
  const productionUrl = 'aiservice-tau.vercel.app';

  // Force redirect to production URL if on a Vercel deployment URL
  // This prevents OAuth domain mismatch issues
  if (
    process.env.NODE_ENV === 'production' &&
    hostname &&
    hostname.includes('.vercel.app') &&
    hostname !== productionUrl
  ) {
    const newUrl = new URL(req.url);
    newUrl.hostname = productionUrl;
    newUrl.protocol = 'https';
    return NextResponse.redirect(newUrl);
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/auth', '/', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // For public routes, allow access
  if (isPublicRoute) {
    // If logged in and on auth pages, redirect to chat
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    });

    if (token && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/chat', req.url));
    }

    return NextResponse.next();
  }

  // For protected routes, check for token
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  });

  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

