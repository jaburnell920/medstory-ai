'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <main className="flex flex-col min-h-screen items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">Welcome to MedStoryAI</h1>
      {!session ? (
        <>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          >
            Sign in with GitHub
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          >
            Sign in with Google
          </button>
        </>
      ) : null}
    </main>
  );
}
