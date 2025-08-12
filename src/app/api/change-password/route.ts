import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, setCurrentPassword } from '../../../lib/password';

export async function POST(req: NextRequest) {
  try {
    const { currentPassword: providedCurrentPassword, newPassword } = await req.json();
    
    if (!providedCurrentPassword || !newPassword) {
      return NextResponse.json({ 
        success: false, 
        error: 'Current password and new password are required' 
      }, { status: 400 });
    }
    
    if (!validatePassword(providedCurrentPassword)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Current password is incorrect' 
      }, { status: 401 });
    }
    
    if (newPassword.length < 3) {
      return NextResponse.json({ 
        success: false, 
        error: 'New password must be at least 3 characters long' 
      }, { status: 400 });
    }
    
    // Update the password
    setCurrentPassword(newPassword);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request' 
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}