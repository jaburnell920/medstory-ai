import { NextResponse } from 'next/server';

export function middleware() {
  // ✅ Allow all routes - authentication disabled for iframe performance
  return withHeaders(NextResponse.next());
}

function withHeaders(response: NextResponse) {
  // Iframe-friendly headers for WordPress embedding
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.set('Content-Security-Policy', "frame-ancestors *;");
  
  // CORS headers for cross-origin requests
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  
  // Performance headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}
