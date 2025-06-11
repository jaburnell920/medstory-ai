'use client';

import { useState } from 'react';

export default function Home() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.redirected) {
      window.location.href = res.url;
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <main className="flex flex-col min-h-screen items-center justify-center bg-gray-50 px-4">
      <h1 className="text-2xl md:text-4xl font-semibold text-gray-800 mb-4 text-center">
        Welcome to <span className="text-blue-700">MedStoryAI</span>
      </h1>

      <form
        onSubmit={handlePasswordLogin}
        className="space-y-4 bg-white p-6 rounded-lg shadow-lg w-full max-w-sm"
      >
        <input
          type="password"
          placeholder="Site password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 p-3 w-full rounded-md text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold px-4 py-2 rounded-md w-full"
        >
          Enter
        </button>
      </form>
    </main>
  );
}
