'use client';

import { useEffect } from 'react';
import SidebarMenu from '../SidebarMenu';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  // Close menu when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-[#002F6C] text-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-6">
            <img src="/logo.svg" alt="MEDSTORYAI Logo" className="w-full h-auto max-w-full" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-orange-300 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Menu Content */}
          <div className="flex-1 overflow-y-auto">
            <SidebarMenu onLinkClick={onClose} />
          </div>
        </div>
      </div>
    </>
  );
}