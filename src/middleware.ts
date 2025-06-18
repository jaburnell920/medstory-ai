import { NextRequest, NextResponse } from 'next/server';
const PUBLIC_PATHS = [
  '/',
  '/dashboard',
  '/favicon.ico',
  '/api/auth-password',
  '/scientific-investigation/landmark-publications',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public routes and static assets
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next')) {
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

// ✅ Add required headers to support embedding in an iframe
function withHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.set('Access-Control-Allow-Origin', '*'); // Or your WordPress domain
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  return response;
}
