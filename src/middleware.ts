import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/favicon.ico', '/api/auth-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('medstory-auth')?.value;

  if (cookie === process.env.SITE_PASSWORD) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/';
  return NextResponse.redirect(url);
}
