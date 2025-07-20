'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { memo } from 'react';

function SidebarMenu() {
  const pathname = usePathname();

  const baseLinkClass = 'text-gray-200 hover:text-orange-300 transition-all duration-200';
  const selectedLinkClass = 'text-orange-400 underline font-semibold';
  const bullet = '•';

  return (
    <nav className="flex flex-col space-y-4 text-xs pt-2 h-full">
        {/* START HERE header */}
        <div className="mb-4">
          <h2 className="text-[#38b8ff] font-bold text-sm tracking-wide">START HERE</h2>
        </div>

        <Section
          title={
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#002F6C] font-bold text-sm">
              1
            </div>
          }
          sectionName="Scientific Investigation"
          links={[
            {
              href: '/scientific-investigation/landmark-publications',
              label: 'Find landmark publications',
            },
            {
              href: '',
              label: 'Identify top thought leaders',
            },
            {
              href: '',
              label: 'Uncover unmet needs',
            },
          ]}
        />

        {/* Arrow pointing down */}
        <div className="flex justify-center">
          <svg className="w-6 h-6 text-[#38b8ff]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 16l-6-6h12l-6 6z"/>
          </svg>
        </div>

        <Section
          title={
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#002F6C] font-bold text-sm">
              2
            </div>
          }
          sectionName="Stakeholder Interviews"
          links={[
            {
              href: '/scientific-investigation/top-publications',
              label: 'Simulate expert interview',
            },
            {
              href: '',
              label: 'Create question list of expert interview',
            },
            {
              href: '',
              label: 'Analyze expert interview transcript',
            },
          ]}
        />

        {/* Arrow pointing down */}
        <div className="flex justify-center">
          <svg className="w-6 h-6 text-[#38b8ff]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 16l-6-6h12l-6 6z"/>
          </svg>
        </div>

        <Section
          title={
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#002F6C] font-bold text-sm">
              3
            </div>
          }
          sectionName="Core Story Concept"
          links={[
            { href: '/core-story-concept', label: 'Create Core Story Concept options' },
            { href: '', label: 'Optimize Core Story Concept' },
            { href: '', label: 'Evaluate Core Story Concept' },
          ]}
        />

        {/* Arrow pointing down */}
        <div className="flex justify-center">
          <svg className="w-6 h-6 text-[#38b8ff]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 16l-6-6h12l-6 6z"/>
          </svg>
        </div>

        <Section
          title={
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#002F6C] font-bold text-sm">
              4
            </div>
          }
          sectionName="Story Flow"
          links={[
            {
              href: '/story-flow-map/tension-resolution',
              label: 'Create story flow outline',
            },
            {
              href: '',
              label: 'Create story flow map',
            },
            {
              href: '',
              label: 'Evaluate story flow',
            },
          ]}
        />

        {/* Arrow pointing down */}
        <div className="flex justify-center">
          <svg className="w-6 h-6 text-[#38b8ff]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 16l-6-6h12l-6 6z"/>
          </svg>
        </div>

        <Section
          title={
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#002F6C] font-bold text-sm">
              5
            </div>
          }
          sectionName="MEDSTORY® Slide Deck"
          links={[
            { href: '/slide-presentation/deck-generation', label: 'Create MEDSTORY deck' },
            { href: '', label: 'Optimize MEDSTORY deck' },
            { href: '', label: 'Evaluate MEDSTORY deck' },
          ]}
        />
        
        {/* Exit button at the bottom */}
        <div className="mt-auto pt-4">
          <a
            href="https://sciencebranding.com"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 bg-white text-[#002F6C] rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium border border-gray-300"
          >
            Exit
          </a>
        </div>
      </nav>
  );

  function Section({
    title,
    sectionName,
    links,
  }: {
    title: React.ReactNode;
    sectionName: string;
    links: { href: string; label: string; extraClass?: string }[];
  }) {
    return (
      <div>
        <div className="flex items-center mb-2">
          <div className="mr-3">{title}</div>
          <p className="font-bold text-white text-sm">{sectionName}</p>
        </div>
        <ul className="ml-11 space-y-1 text-gray-200">
          {links.map((link) => (
            <li key={link.label} className="leading-tight">
              {link.href ? (
                <Link
                  className={clsx(
                    baseLinkClass,
                    pathname === link.href && selectedLinkClass,
                    link.extraClass,
                    'flex items-start'
                  )}
                  href={link.href}
                >
                  <span className="mr-1">{bullet}</span> {link.label}
                </Link>
              ) : (
                <span className="text-gray-400 flex items-start cursor-default">
                  <span className="mr-1">{bullet}</span> {link.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default memo(SidebarMenu);
