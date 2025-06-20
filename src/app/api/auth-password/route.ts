import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Authentication disabled - redirect directly to dashboard
  return NextResponse.redirect(
    new URL('/scientific-investigation/landmark-publications', req.url),
    303
  );
}
