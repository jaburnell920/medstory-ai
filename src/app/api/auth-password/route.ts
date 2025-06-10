// src/app/api/auth-password/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password === process.env.SITE_PASSWORD) {
    const response = NextResponse.json({ success: true });

    response.cookies.set('medstory-auth', password, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: true,
      sameSite: 'lax',
    });

    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
