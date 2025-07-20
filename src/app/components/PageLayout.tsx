'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
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
      {/* Sidebar with white background extending full height */}
      <aside className="w-72 bg-white flex flex-col flex-shrink-0 h-screen fixed">
        {/* Logo section with white background */}
        <div className="bg-white p-4 pb-2 flex-col">
          <Image
            src="/medstory_logo_wo_sss.png"
            alt="MEDSTORYAI Logo"
            width={180}
            height={58}
            className="h-14 w-auto border-0 outline-0"
          />
          <div className="flex justify-end pr-8">
            <Image
              src="/smart-speedy-simple.png"
              alt="Smart Speedy Simple"
              width={130}
              height={20}
              className="mt-1 h-5 w-auto opacity-70 border-0 outline-0"
            />
          </div>
        </div>

        {/* Menu section with blue background */}
        <div className="bg-[#002F6C] text-white flex-1 px-4 pb-4 overflow-y-auto flex flex-col">
          <SidebarMenu />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 flex flex-col overflow-hidden ml-72">
        {/* Fixed Header with Section and Task */}
        <div className="flex items-center justify-between p-12 pb-6 flex-shrink-0 bg-gray-50">
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
