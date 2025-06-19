import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/dashboard',
  '/favicon.ico',
  '/api/auth-password',
  '/scientific-investigation/landmark-publications',
  '/scientific-investigation/top-publications',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Allow static, API, and public routes
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/')
  ) {
    return withHeaders(NextResponse.next());
  }

  const cookie = request.cookies.get('medstory-auth')?.value;

  if (cookie === process.env.SITE_PASSWORD) {
    return withHeaders(NextResponse.next());
  }

  const url = request.nextUrl.clone();
  url.pathname = '/';
  return withHeaders(NextResponse.redirect(url));
}

function withHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.set('Access-Control-Allow-Origin', '*'); // Consider locking this to your domain
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  return response;
}
