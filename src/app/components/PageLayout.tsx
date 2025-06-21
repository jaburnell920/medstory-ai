'use client';

import { useEffect, useRef, useState } from 'react';
import SidebarMenu from '../SidebarMenu';
import HamburgerIcon from './HamburgerIcon';
import MobileMenu from './MobileMenu';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen text-black overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile/tablet */}
      <aside className="hidden lg:flex w-80 bg-[#002F6C] text-white flex-col p-6 flex-shrink-0">
        <div className="mb-6">
          <img src="/logo.svg" alt="MEDSTORYAI Logo" className="w-full h-auto max-w-full" />
        </div>

        <SidebarMenu />
      </aside>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
        {/* Fixed Header with Section and Task */}
        <div className="flex items-center justify-between p-4 lg:p-12 pb-3 lg:pb-6 flex-shrink-0 bg-gray-50">
          <div className="flex items-center">
            {/* Hamburger Menu - Only visible on mobile/tablet */}
            <div className="lg:hidden mr-3">
              <HamburgerIcon isOpen={isMobileMenuOpen} onClick={toggleMobileMenu} />
            </div>
            
            <span className="text-2xl lg:text-4xl mr-2 lg:mr-4">{sectionIcon}</span>
            <div>
              <h1 className="text-xl lg:text-3xl font-extrabold text-[#063471]">{sectionName}</h1>
              <h2 className="text-sm lg:text-xl text-gray-600 mt-1">{taskName}</h2>
            </div>
          </div>

          {/* Back Button */}
          <a
            href="https://sciencebranding.com"
            rel="noopener noreferrer"
            className="flex items-center px-2 lg:px-4 py-1 lg:py-2 bg-[#002F6C] text-white rounded-lg hover:bg-[#063471] transition-colors duration-200 font-medium text-xs lg:text-base"
          >
            <svg className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="hidden sm:inline">Back to Science Branding</span>
            <span className="sm:hidden">Back</span>
          </a>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-12 pb-4 lg:pb-12">
          {children}
          <div ref={messagesEndRef} />
        </div>
      </main>
    </div>
  );
}
