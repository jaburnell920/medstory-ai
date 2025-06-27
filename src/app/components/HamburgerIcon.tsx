'use client';

interface HamburgerIconProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function HamburgerIcon({ isOpen, onClick }: HamburgerIconProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      aria-label="Toggle menu"
    >
      <span
        className={`block w-6 h-0.5 bg-[#002F6C] transition-all duration-300 ease-in-out ${
          isOpen ? 'rotate-45 translate-y-1.5' : ''
        }`}
      />
      <span
        className={`block w-6 h-0.5 bg-[#002F6C] transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-0' : ''
        }`}
      />
      <span
        className={`block w-6 h-0.5 bg-[#002F6C] transition-all duration-300 ease-in-out ${
          isOpen ? '-rotate-45 -translate-y-1.5' : ''
        }`}
      />
    </button>
  );
}