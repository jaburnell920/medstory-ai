'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function SidebarMenu() {
  const pathname = usePathname();

  const linkClass =
    'text-gray-200 hover:text-orange-300 hover:underline transition-all duration-200';
  const selectedLinkClass = 'text-orange-400 underline font-semibold';

  return (
    <aside className="w-72 bg-[#002F6C] text-white flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-4">
        <span style={{ color: '#35b4fc' }}>MEDSTORY</span>
        <span style={{ color: '#ff914d' }}>AI</span>
      </h2>
      <nav className="flex flex-col space-y-6 text-sm">
        <Section
          title="🔬 Scientific Investigation"
          links={[
            {
              href: '/scientific-investigation/landmark-publications',
              label: 'Find landmark publications',
            },
            {
              href: '',
              label: 'Top N most important publications',
            },
            {
              href: '/scientific-investigation/top-publications',
              label: 'Top N most important thought leaders',
            },
            {
              href: '/scientific-investigation/more',
              label: 'More...',
              extraClass: 'text-blue-300',
            },
          ]}
        />

        <Section
          title="🎤 Stakeholder Interviews"
          links={[
            {
              href: '/stakeholder-interviews/questions',
              label: 'Suggested questions for thought leader interviews',
            },
            {
              href: '/stakeholder-interviews/analyze-transcript',
              label: 'Analyze thought leader interview transcript',
            },
            {
              href: '/stakeholder-interviews/simulated-interview',
              label: 'Simulated thought leader interview',
            },
            {
              href: '/scientific-investigation/more',
              label: 'More...',
              extraClass: 'text-blue-300',
            },
          ]}
        />

        <Section
          title="🎯 Core Story Concept"
          links={[
            { href: '/dashboard', label: 'Core Story Concept creation' },
            { href: '/core-story-concept/optimization', label: 'Core Story Concept optimization' },
            { href: '/core-story-concept/evaluation', label: 'Core Story Concept evaluation' },
            {
              href: '/scientific-investigation/more',
              label: 'More...',
              extraClass: 'text-blue-300',
            },
          ]}
        />

        <Section
          title="🗺️ Story Flow Map"
          links={[
            {
              href: '/story-flow-map/tension-resolution-generation',
              label: 'Tension-Resolution Point generation',
            },
            {
              href: '/story-flow-map/tension-resolution-optimization',
              label: 'Tension-Resolution Point optimization',
            },
            {
              href: '/story-flow-map/generation-optimization',
              label: 'Story Flow Map generation & optimization',
            },
            {
              href: '/scientific-investigation/more',
              label: 'More...',
              extraClass: 'text-blue-300',
            },
          ]}
        />

        <Section
          title="📽️ MEDSTORY Slide Presentation"
          links={[
            { href: '/slide-presentation/deck-generation', label: 'MEDSTORY deck generation' },
            { href: '/slide-presentation/deck-optimization', label: 'MEDSTORY deck optimization' },
            { href: '/slide-presentation/deck-evaluation', label: 'MEDSTORY deck evaluation' },
            {
              href: '/scientific-investigation/more',
              label: 'More...',
              extraClass: 'text-blue-300',
            },
          ]}
        />
      </nav>
    </aside>
  );

  function Section({
    title,
    links,
  }: {
    title: string;
    links: { href: string; label: string; extraClass?: string }[];
  }) {
    return (
      <div>
        <p className="font-bold text-white mb-1">{title}</p>
        <ul className="ml-4 space-y-1 text-gray-200">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                className={clsx(
                  linkClass,
                  pathname === link.href && selectedLinkClass,
                  link.extraClass
                )}
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
