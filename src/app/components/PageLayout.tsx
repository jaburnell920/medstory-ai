'use client';

import { useRef } from 'react';
import SidebarMenu from '../SidebarMenu';

interface PageLayoutProps {
  sectionIcon: string;
  sectionName: string;
  taskName: string;
  children: React.ReactNode;
}

export default function PageLayout({
  sectionIcon,
  sectionName,
  taskName,
  children,
}: PageLayoutProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  // useEffect(() => {
  //   scrollToBottom();
  // });

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
      <main className="flex-1 bg-gray-50 p-12">
        {/* Header with Section and Task */}
        <div className="flex items-center mb-10">
          <span className="text-4xl mr-4">{sectionIcon}</span>
          <div>
            <h1 className="text-3xl font-extrabold text-[#063471]">{sectionName}</h1>
            <h2 className="text-xl text-gray-600 mt-1">{taskName}</h2>
          </div>
        </div>

        {children}
        <div ref={messagesEndRef} />
      </main>
    </div>
  );
}
