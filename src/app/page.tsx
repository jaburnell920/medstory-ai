'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="flex flex-col min-h-screen items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">Welcome to MedStoryAI</h1>
      {!session ? (
        <>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          >
          Sign in with GitHub
        </button>
        <button
        className="bg-red-600 text-white px-4 py-2 rounded"
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      >
        Sign in with Google
      </button>
      </>
        
      ) : (
        <>
          <p>Hello, {session.user?.name}</p>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </>
      )}
    </main>
  );
}
