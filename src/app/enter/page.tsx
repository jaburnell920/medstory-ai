'use client';

import Image from 'next/image';
import SidebarMenu from '../SidebarMenu';

export default function EnterPage() {
  return (
    <>
      <aside className="w-80 bg-white flex flex-col flex-shrink-0 h-screen fixed font-sans">
        <div className="bg-white p-6 pb-4 flex-col">
          <Image
            src="/medstory_logo_wo_sss.png"
            alt="MEDSTORYAI Logo"
            width={200}
            height={64}
            className="h-16 w-auto border-0 outline-0"
          />
          <div className="flex justify-end pr-10">
            <Image
              src="/smart-speedy-simple.png"
              alt="Smart Speedy Simple"
              width={150}
              height={24}
              className="mt-2 h-6 w-auto opacity-70 border-0 outline-0"
            />
          </div>
        </div>
        <div className="bg-[#002F6C] text-white flex-1 px-6 pb-6 overflow-y-auto">
          <SidebarMenu />
        </div>
      </aside>

      <div className="flex min-h-screen text-black font-[Lora]">
        <main className="flex-1 bg-[#ededed] p-12 ml-80">
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold text-[#04316f] mb-10">Welcome!</h1>
            <p className="text-xl leading-normal">
              <span className="font-bold text-[#04316f]">MEDSTORY</span>
              <span className="text-[#fc9b5f] font-bold">AI</span> is your AI-powered partner for
              turning complex data into a clear, high-impact scientific story.
            </p>
            <p className="text-base leading-normal text-[#111827] mt-6">
              <span className="font-semibold text-[#04316f]">MEDSTORY</span>
              <span className="text-[#fc9b5f] font-semibold">AI</span> gives you a smart, speedy,
              and simple way to build polished slide decks. By combining state-of-the-art generative
              AI with SBC’s proven storytelling framework—honed over 15 years—we help you craft
              narratives that educate, engage, and persuade.
            </p>

            <div className="mt-8">
              <h2 className="text-2xl font-bold text-[#04316f] mb-4">How It Works</h2>

              <p className="text-base leading-normal text-[#111827] mb-3">
                <span className="text-[#1c437b] italic">Start at the top.</span> Use the Scientific
                Investigation prompt to feed{' '}
                <span className="font-semibold text-[#04316f]">MEDSTORY</span>
                <span className="text-[#fc9b5f] font-semibold">AI</span> your key data and insights.
              </p>

              <p className="text-base leading-normal text-[#111827] mb-3">
                <span className="text-[#1c437b] italic">Follow the flow.</span> Work down each
                section in order; every step refines the narrative, so the final{' '}
                <span className="font-semibold text-[#04316f]">MEDSTORY</span> Slide Deck is
                coherent and compelling.
              </p>

              <p className="text-base leading-normal text-[#111827]">
                <span className="text-[#1c437b] italic">Review and refine.</span> The app delivers a
                deck ready for your finishing touches—saving you hours while elevating quality.
              </p>
            </div>

            <div className="mt-10 pt-6">
              <p className="text-sm mt-4 leading-normal">
                Need a human touch? Email Bernie Coccia (
                <a href="mailto:bcoccia@sciencebranding.com" className="underline text-[#04316f]">
                  bcoccia@sciencebranding.com
                </a>
                ) to schedule a personal walkthrough and ensure your story shines.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
