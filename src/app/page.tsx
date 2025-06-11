'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password === 'yourpassword123') {
      router.push('/dashboard');
    } else {
      const res = await fetch('/api/auth-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError('Incorrect password');
      }
    }
  };

  return (
    <main className="flex flex-col min-h-screen items-center justify-center gap-6 bg-gray-100">
      <h1 className="text-3xl font-bold">Welcome to MedStoryAI</h1>

      <form
        onSubmit={handlePasswordLogin}
        className="space-y-4 bg-white p-6 rounded shadow-md w-full max-w-sm"
      >
        <input
          type="password"
          placeholder="Site password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full rounded"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Enter
        </button>
      </form>
    </main>
  );
}
