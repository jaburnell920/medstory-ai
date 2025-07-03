'use client';

import SidebarMenu from '../SidebarMenu';

export default function EnterPage() {
  return (
    <div className="flex min-h-screen text-black">
      {/* Sidebar */}
      <aside className="w-72 bg-[#002F6C] text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-4">
          <span style={{ color: '#35b4fc' }}>MEDSTORY</span>
          <span style={{ color: '#ff914d' }}>AI</span>
        </h2>
        <SidebarMenu />
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 flex items-center justify-center p-12">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-extrabold text-[#063471] mb-6">
            Welcome to <span style={{ color: '#35b4fc' }}>MEDSTORY</span>
            <span style={{ color: '#ff914d' }}>AI</span>!
          </h1>
          {/* <p className="text-xl text-gray-600 leading-relaxed">
            Your AI-powered platform for creating compelling medical stories and presentations.
          </p> */}
        </div>
      </main>
    </div>
  );
}
