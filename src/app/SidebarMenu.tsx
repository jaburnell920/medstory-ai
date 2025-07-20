'use client';

import Link from 'next/link';
import Image from 'next/image';
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
        <Section
          title={
            <Image
              src="/scientific_investigation_menu.png"
              alt="Scientific Investigation"
              width={20}
              height={20}
              className="w-5 h-5"
            />
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

        <Section
          title={
            <Image
              src="/stakeholder_interviews_menu.png"
              alt="Stakeholder Interviews"
              width={20}
              height={20}
              className="w-5 h-5"
            />
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

        <Section
          title={
            <Image src="/core_story_concept_menu.png" alt="Core Story Concept" width={20} height={20} className="w-5 h-5" />
          }
          sectionName="Core Story Concept"
          links={[
            { href: '/core-story-concept', label: 'Create Core Story Concept options' },
            { href: '', label: 'Optimize Core Story Concept' },
            { href: '', label: 'Evaluate Core Story Concept' },
          ]}
        />

        <Section
          title={<Image src="/story_flow_map_menu.png" alt="Story Flow Map" width={20} height={20} className="w-5 h-5" />}
          sectionName="Story Flow Map"
          links={[
            {
              href: '/story-flow-map/tension-resolution',
              label: 'Create tension-resolution points',
            },
            {
              href: '',
              label: 'Evaluate tension-resolution points',
            },
            {
              href: '',
              label: 'Create story flow map',
            },
          ]}
        />

        <Section
          title={
            <Image
              src="/medstory_slide_deck_menu.png"
              alt="MEDSTORY Slide Deck"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          }
          sectionName="MEDSTORY Slide Deck"
          links={[
            { href: '/slide-presentation/deck-generation', label: 'Create MEDSTORY deck' },
            { href: '', label: 'Optimize MEDSTORY deck' },
            { href: '', label: 'Evaluate MEDSTORY deck' },
          ]}
        />
        
        {/* Exit MEDSTORYAI button at the bottom */}
        <div className="mt-auto pt-4">
          <a
            href="https://sciencebranding.com"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 bg-[#286580] text-white rounded-lg hover:bg-[#1e4e63] transition-colors duration-200 font-medium border border-white"
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
        <div className="flex items-center mb-1">
          <div className="text-4xl mr-2">{title}</div>
          <p className="font-bold text-white text-xs">{sectionName}</p>
        </div>
        <ul className="ml-7 space-y-0.5 text-gray-200">
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
