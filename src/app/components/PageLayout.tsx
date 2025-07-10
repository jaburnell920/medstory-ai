'use client';

import { useEffect, useRef } from 'react';
import SidebarMenu from '../SidebarMenu';

interface PageLayoutProps {
  sectionIcon: React.ReactNode;
  sectionName: string;
  taskName: string | React.ReactNode;
  children: React.ReactNode;
}

export default function PageLayout({
  sectionIcon,
  sectionName,
  taskName,
  children,
}: PageLayoutProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  });

  return (
    <div className="flex h-screen text-black overflow-hidden">
      {/* Sidebar */}
      <aside className="w-84 bg-[#002F6C] text-white flex flex-col p-6 flex-shrink-0">
        <div className="mb-6">
          <img src="/logo.svg" alt="MEDSTORYAI Logo" className="w-full h-auto max-w-full" />
        </div>

        <SidebarMenu />
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
        {/* Fixed Header with Section and Task */}
        <div className="flex items-center justify-between p-12 pb-6 flex-shrink-0 bg-gray-50">
          <div className="flex items-center">
            <span className="text-4xl mr-4">{sectionIcon}</span>
            <div>
              <h1 className="text-3xl font-extrabold text-[#063471]">{sectionName}</h1>
              <h2 className="text-xl text-gray-600 mt-1">{taskName}</h2>
            </div>
          </div>

          {/* Back Button */}
          <a
            href="https://sciencebranding.com"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-[#002F6C] text-white rounded-lg hover:bg-[#063471] transition-colors duration-200 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Exit MEDSTORY<strong>AI</strong>
          </a>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-12 pb-12">
          {children}
          <div ref={messagesEndRef} />
        </div>
      </main>
    </div>
  );
}
