import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password === process.env.SITE_PASSWORD) {
    const response = NextResponse.redirect(new URL('/dashboard', req.url), 303);
    response.cookies.set('medstory-auth', password, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: true,
      sameSite: 'none',
    });
    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
