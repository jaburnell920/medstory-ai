'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { memo } from 'react';
import ArrowConnector from './ArrowConnector';

function SidebarMenu() {
  const pathname = usePathname();

  const baseLinkClass = 'text-gray-200 hover:text-orange-300 transition-all duration-200';
  const selectedLinkClass = 'text-orange-400 underline font-semibold';

  const sections = [
    {
      number: '1',
      name: 'Scientific Investigation',
      links: [
        {
          href: '/scientific-investigation/landmark-publications',
          label: 'Find key publications',
        },
        {
          href: '',
          label: 'Add key publications',
        },
        { href: '', label: 'Identify top thought leaders' },
        { href: '', label: 'Uncover unmet needs' },
      ],
    },
    {
      number: '2',
      name: 'Stakeholder Interviews',
      links: [
        { href: '/scientific-investigation/top-publications', label: 'Simulate expert interview' },
        { href: '', label: 'Create list of interview questions' },
        { href: '', label: 'Analyze expert interview transcript' },
      ],
    },
    {
      number: '3',
      name: 'Core Story Concept',
      links: [
        { href: '/core-story-concept', label: 'Create Core Story Concept options' },
        { href: '', label: 'Optimize Core Story Concept' },
        { href: '', label: 'Evaluate Core Story Concept' },
      ],
    },
    {
      number: '4',
      name: 'Story Flow',
      links: [
        { href: '/story-flow-map/tension-resolution', label: 'Create story flow outline' },
        { href: '/story-flow-map/create-map', label: 'Create story flow map' },
        { href: '', label: 'Evaluate tension-resolution points' },
      ],
    },
    {
      number: '5',
      name: 'MEDSTORY Slide Deck',
      links: [
        { href: '/slide-presentation/deck-generation', label: 'Create MEDSTORY deck' },
        { href: '', label: 'Optimize MEDSTORY deck' },
        { href: '', label: 'Evaluate MEDSTORY deck' },
      ],
    },
  ];

  return (
    <nav className="flex flex-col space-y-4 text-xs pt-2 h-full">
      {/* START HERE header */}
      <div className="mb-4 w-16 pt-6">
        <Link href="/enter">
          <h2 className="text-[#38b8ff] font-bold text-sm tracking-wide cursor-pointer">
            START
            <br />
            <span className="pr-12">HERE</span>
          </h2>
        </Link>
      </div>
      {sections.map((section, index) => (
        <div key={section.number} className="flex flex-row">
          {/* Number and optional arrow */}
          <div className="flex flex-col items-center mr-2 pt-1">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[#002F6C] font-bold text-sm">
              {section.number}
            </div>
            {index < sections.length - 1 && <ArrowConnector />} {/* ← Only show if NOT last */}
          </div>

          {/* Section content */}
          <div>
            <p className="font-bold text-white text-base mb-1">{section.name}</p>
            <ul className="ml-1 space-y-0.5 text-gray-200 text-xs">
              {section.links.map((link) => (
                <li key={link.label} className="leading-tight">
                  {link.href ? (
                    <Link
                      className={clsx(
                        baseLinkClass,
                        pathname === link.href && selectedLinkClass,
                        'flex items-start'
                      )}
                      href={link.href}
                    >
                      <span className="mr-1">•</span> {link.label}
                    </Link>
                  ) : (
                    <span className="text-gray-400 flex items-start cursor-default">
                      <span className="mr-1">•</span> {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      {/* Exit button at the bottom */}
      <div className="mt-auto pt-4 pl-50">
        <a
          href="https://sciencebranding.com"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-white text-[#002F6C] rounded-full hover:bg-gray-100 transition-colors duration-200 font-bold border border-gray-300"
        >
          Exit
        </a>
      </div>
    </nav>
  );
}

export default memo(SidebarMenu);
