'use client';

import { useState } from 'react';
import Image from 'next/image';
import DisabledSidebarMenu from './components/DisabledSidebarMenu';

export default function Home() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        window.location.href = '/enter';
      } else {
        setError('Incorrect password');
      }
    } else {
      setError('Incorrect password');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setShowPasswordChange(false);
        setCurrentPassword('');
        setNewPassword('');
        setPasswordChangeError('');
        alert('Password changed successfully');
      } else {
        setPasswordChangeError(data.error || 'Failed to change password');
      }
    } else {
      setPasswordChangeError('Failed to change password');
    }
  };

  return (
    <>
      <aside className="w-80 bg-white flex flex-col flex-shrink-0 h-screen fixed font-sans">
        <div className="bg-white pl-13 p-6 pb-4 flex-col">
          <Image
            src="/MedstoryAI_logo_on_light_background.png"
            alt="MEDSTORYAI Logo"
            width={200}
            height={64}
            className="h-16 w-auto border-0 outline-0"
          />
        </div>
        <div className="bg-[#002F6C] text-white flex-1 px-6 pb-6 overflow-y-auto">
          <DisabledSidebarMenu />
        </div>
      </aside>

      <div className="flex min-h-screen text-black font-[Lora]">
        <main className="flex-1 bg-[#ededed] p-12 ml-80">
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold text-[#04316f] mb-10">Welcome!</h1>
            <p className="text-xl leading-normal">
              <span className="font-bold text-[#04316f]">MEDSTORY</span>
              <span className="text-[#fc9b5f] font-bold">AI</span> is your AI-powered partner for
              turning complex data into a clear, high-impact scientific story.
            </p>
            <p className="text-base leading-normal text-[#111827] mt-6">
              <span className="font-semibold text-[#04316f]">MEDSTORY</span>
              <span className="text-[#fc9b5f] font-semibold">AI</span> delivers a smart, speedy and
              simple way to create a strategically sound, medically accurate and attractive slide
              presentation.
            </p>

            <div className="mt-8">
              <h2 className="text-2xl font-bold text-[#04316f] mb-4">
                To start, please enter the password:
              </h2>

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <input
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-300 p-3 w-full max-w-sm rounded-md text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="bg-[#ffa500] hover:bg-[#ff8c00] transition-colors text-white font-semibold px-6 py-3 rounded-md"
                >
                  SUBMIT
                </button>
              </form>
            </div>

            {/* Password Change Section */}
            {showPasswordChange && (
              <div className="mt-8 p-4 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-[#04316f] mb-4">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#04316f] mb-1">
                      Current Password:
                    </label>
                    <input
                      type="password"
                      placeholder="••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="border border-gray-300 p-2 w-full max-w-sm rounded-md text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#04316f] mb-1">
                      New Password:
                    </label>
                    <input
                      type="password"
                      placeholder="••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border border-gray-300 p-2 w-full max-w-sm rounded-md text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {passwordChangeError && (
                    <p className="text-red-600 text-sm">{passwordChangeError}</p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="bg-[#ffa500] hover:bg-[#ff8c00] transition-colors text-white font-semibold px-4 py-2 rounded-md"
                    >
                      SUBMIT
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(false)}
                      className="bg-gray-500 hover:bg-gray-600 transition-colors text-white font-semibold px-4 py-2 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Invisible button at the bottom */}
          {/* <div className="fixed bottom-0 left-0 w-full h-16"> */}
          {/* Change Password button fixed to bottom left */}
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            title="Change Password"
            className="fixed bottom-4 left-[21rem] w-32 h-8 bg-transparent border-0 outline-0 cursor-pointer"
          ></button>
        </main>
      </div>
    </>
  );
}
