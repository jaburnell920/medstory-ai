import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/api/auth-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('medstory-auth')?.value;
  if (cookie === process.env.SITE_PASSWORD) {
    return NextResponse.next();
  }

  if (request.headers.get('referer')?.includes('/')) {
    // Prevent infinite redirect loop in iframe
    return new NextResponse(null, { status: 204 });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/';
  return NextResponse.redirect(url);
}
