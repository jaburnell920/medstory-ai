'use client';

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
  return (
    <div className="flex min-h-screen text-black">
      {/* Sidebar with white background extending full height */}
      <aside className="w-80 bg-white flex flex-col flex-shrink-0 h-screen fixed">
        {/* Logo section with white background */}
        <div className="bg-white p-6 pl-13 pb-4 flex-col">
          <Image
            src="/MedstoryAI_logo_on_light_background.png"
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
      <main className="flex-1 bg-[#ededed] flex flex-col h-screen ml-72">
        {/* Fixed Header with Section and Task */}
        <div className="flex items-center justify-between p-12 pb-6 flex-shrink-0 bg-[#ededed]">
          <div className="flex items-center">
            <span className="text-5xl mr-1">{sectionIcon}</span>
            <div>
              <h1 className="text-3xl font-extrabold text-[#063471]">{sectionName}</h1>
              <h2 className="text-xl text-gray-600 mt-1">{taskName}</h2>
            </div>
          </div>
        </div>

        {/* Fixed Content Area - No scrolling */}
        <div className="flex-1 px-12 pb-12 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
