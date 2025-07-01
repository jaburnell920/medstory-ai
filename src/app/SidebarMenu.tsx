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
    <aside className="w-84 bg-[#002F6C] text-white flex flex-col -ml-2">
      <nav className="flex flex-col space-y-8 text-sm">
        <Section
          title={
            <img
              src="/scientific_investigation_menu.png"
              alt="Scientific Investigation"
              className="w-6 h-6"
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
            <img
              src="/stakeholder_interviews_menu.png"
              alt="Stakeholder Interviews"
              className="w-6 h-6"
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
            <img src="/core_story_concept_menu.png" alt="Core Story Concept" className="w-6 h-6" />
          }
          sectionName="Core Story Concept"
          links={[
            { href: '', label: 'Create Core Story Concept options' },
            { href: '', label: 'Optimize Core Story Concept' },
            { href: '', label: 'Evaluate Core Story Concept' },
          ]}
        />

        <Section
          title={<img src="/story_flow_map_menu.png" alt="Story Flow Map" className="w-6 h-6" />}
          sectionName="Story Flow Map"
          links={[
            {
              href: '/dashboard',
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
            <img
              src="/medstory_slide_deck_menu.png"
              alt="MEDSTORY Slide Deck"
              className="w-6 h-6"
            />
          }
          sectionName="MEDSTORY Slide Deck"
          links={[
            { href: '/slide-presentation/deck-generation', label: 'Create MEDSTORY deck' },
            { href: '', label: 'Optimize MEDSTORY deck' },
            { href: '', label: 'Evaluate MEDSTORY deck' },
          ]}
        />
      </nav>
    </aside>
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
          <div className="text-6xl mr-3">{title}</div>
          <p className="font-bold text-white text-sm">{sectionName}</p>
        </div>
        <ul className="ml-9 space-y-1 text-gray-200">
          {links.map((link) => (
            <li key={link.label}>
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
