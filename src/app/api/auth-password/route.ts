import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correctPassword = process.env.SITE_PASSWORD;

  if (password === correctPassword) {
    const res = NextResponse.json({ success: true });
    res.cookies.set('medstory-auth', password, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return res;
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
