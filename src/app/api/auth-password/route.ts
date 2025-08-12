import { NextRequest, NextResponse } from 'next/server';
import { validatePassword } from '../../../lib/password';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    
    if (validatePassword(password)) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
