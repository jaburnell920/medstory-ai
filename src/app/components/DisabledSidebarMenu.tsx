'use client';

import { memo } from 'react';
import ArrowConnector from '../ArrowConnector';

function DisabledSidebarMenu() {
  const sections = [
    {
      number: '1',
      name: 'Scientific Investigation',
      links: [
        { label: 'Find key publications' },
        { label: 'Add key publications' },
        { label: 'Identify top thought leaders' },
        { label: 'Uncover unmet needs' },
      ],
    },
    {
      number: '2',
      name: 'Stakeholder Interviews',
      links: [
        { label: 'Simulate expert interview' },
        { label: 'Create list of interview questions' },
        { label: 'Analyze expert interview transcript' },
      ],
    },
    {
      number: '3',
      name: 'Core Story Concept',
      links: [
        { label: 'Create Core Story Concept options' },
        { label: 'Optimize Core Story Concept' },
        { label: 'Evaluate Core Story Concept' },
      ],
    },
    {
      number: '4',
      name: 'Story Flow',
      links: [
        { label: 'Create story flow outline' },
        { label: 'Create story flow map' },
        { label: 'Evaluate tension-resolution points' },
      ],
    },
    {
      number: '5',
      name: 'MEDSTORY Slide Deck',
      links: [
        { label: 'Create MEDSTORY deck blueprint' },
        { href: '', label: 'Create MEDSTORY deck presentation' },
        { label: 'Optimize MEDSTORY deck' },
        { label: 'Evaluate MEDSTORY deck' },
      ],
    },
  ];

  return (
    <nav className="flex flex-col space-y-4 text-xs pt-2 h-full">
      {/* START HERE header */}
      <div className="mb-4 w-16 pt-6">
        <h2 className="text-[#38b8ff] font-bold text-sm tracking-wide cursor-default">
          START
          <br />
          <span className="pr-12">HERE</span>
        </h2>
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
            <ul className="ml-1 space-y-0.5 text-gray-400 text-xs">
              {section.links.map((link) => (
                <li key={link.label} className="leading-tight">
                  <span className="flex items-start cursor-default">
                    <span className="mr-1">•</span> {link.label}
                  </span>
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

export default memo(DisabledSidebarMenu);
