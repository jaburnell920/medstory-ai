import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const correctPassword = process.env.SITE_PASSWORD;

  // Handle missing env variable
  if (!correctPassword) {
    return NextResponse.json(
      { error: 'Server misconfigured: SITE_PASSWORD not set' },
      { status: 500 }
    );
  }

  // Password match
  if (password === correctPassword) {
    const res = NextResponse.json({ success: true });

    res.cookies.set('medstory-auth', correctPassword, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res;
  }

  // Incorrect password
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
