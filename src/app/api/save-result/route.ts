// src/app/api/save-result/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { result } = await req.json();
  if (!result) return NextResponse.json({ error: 'Missing result' }, { status: 400 });

  await connectToDB();
  await User.findOneAndUpdate(
    { email: session.user.email },
    { $push: { results: result } },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
