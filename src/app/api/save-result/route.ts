// // src/app/api/save-result/route.ts
// import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { connectToDB } from '@/lib/mongodb';
// import { User } from '@/models/User';
// import { authOptions } from '@/lib/authOptions';

// export async function POST(req: Request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user?.email) {
//       console.error('❌ No user session or email.');
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { result } = await req.json();
//     if (!result) {
//       console.error('❌ No result provided in request body.');
//       return NextResponse.json({ error: 'Missing result' }, { status: 400 });
//     }

//     await connectToDB();
//     await User.findOneAndUpdate(
//       { email: session.user.email },
//       { $push: { results: result } },
//       { new: true, upsert: true }
//     );

//     return NextResponse.json({ success: true });
//   } catch (err: unknown) {
//     console.error('🔥 Save failed:', err);
//     const errorMessage = err instanceof Error ? err.message : 'Unknown error';
//     return NextResponse.json({ error: 'Server error', detail: errorMessage }, { status: 500 });
//   }
// }
