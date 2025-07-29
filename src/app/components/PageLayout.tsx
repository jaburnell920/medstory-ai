'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import SidebarMenu from '../SidebarMenu';

interface PageLayoutProps {
  sectionIcon: React.ReactNode;
  sectionName: string;
  initialResultsLoaded?: boolean;
  taskName: string | React.ReactNode;
  children: React.ReactNode;
}

export default function PageLayout({
  sectionIcon,
  sectionName,
  taskName,
  initialResultsLoaded,
  children,
}: PageLayoutProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (!initialResultsLoaded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  });

  return (
    <div className="flex min-h-screen text-black">
      {/* Sidebar with white background extending full height */}
      <aside className="w-80 bg-white flex flex-col flex-shrink-0 h-screen fixed">
        {/* Logo section with white background */}
        <div className="bg-white p-6 pl-13 pb-4 flex-col">
          <Image
            src="/msailogo.png"
            alt="MEDSTORYAI Logo"
            width={200}
            height={64}
            className="h-16 w-auto border-0 outline-0"
          />
        </div>
        {/* Menu section with blue background */}
        <div className="bg-[#002F6C] text-white flex-1 px-6 pb-6 overflow-y-auto">
          <SidebarMenu />
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 bg-[#ededed] flex flex-col overflow-hidden ml-72">
        {/* Fixed Header with Section and Task */}
        <div className="flex items-center justify-between p-12 pb-6 flex-shrink-0 bg-[#ededed]">
          <div className="flex items-center">
            <span className="text-4xl mr-4">{sectionIcon}</span>
            <div>
              <h1 className="text-3xl font-extrabold text-[#063471]">{sectionName}</h1>
              <h2 className="text-xl text-gray-600 mt-1">{taskName}</h2>
            </div>
          </div>
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
