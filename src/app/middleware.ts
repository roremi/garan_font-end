// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // Nếu đang ở trang auth và đã có token -> redirect về home
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Nếu không phải trang auth và không có token -> redirect về login
  if (!isAuthPage && !isApiRoute && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
