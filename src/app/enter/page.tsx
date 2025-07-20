'use client';

import SidebarMenu from '../SidebarMenu';

export default function EnterPage() {
  return (
    <div className="flex min-h-screen text-black">
      {/* Sidebar with white background extending full height */}
      <aside className="w-80 bg-white flex flex-col flex-shrink-0 h-screen fixed">
        {/* Logo section with white background */}
        <div className="bg-white p-6 pb-4">
          <img src="/logo.svg" alt="MEDSTORYAI Logo" className="w-full h-auto max-w-full border-0 outline-0" style={{border: 'none', outline: 'none'}} />
        </div>

        {/* Menu section with blue background */}
        <div className="bg-[#002F6C] text-white flex-1 px-6 pb-6 overflow-y-auto">
          <SidebarMenu />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-12 ml-80">
        <div className="max-w-4xl">
          {/* Header with logo */}
          <div className="flex justify-between items-start mb-8">
            <h1 className="text-4xl font-normal text-gray-600">
              Welcome!
            </h1>
            <div className="flex items-center">
              <img src="/logo.svg" alt="MEDSTORYAI Logo" className="h-16 w-auto border-0 outline-0" style={{border: 'none', outline: 'none'}} />
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-8">
            <div>
              <p className="text-xl text-black font-semibold leading-relaxed">
                <strong>MEDSTORYAI</strong> is your AI-powered partner for turning complex data into clear, high-impact scientific stories.
              </p>
            </div>

            <div>
              <p className="text-lg text-black leading-relaxed">
                <strong>MEDSTORYAI</strong> gives you a smart, speedy, and simple way to build polished slide decks. By combining state-of-the-art generative AI with SBC's proven storytelling framework—honed over 15 years—we help you craft narratives that educate, engage, and persuade.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-black">How It Works</h2>
              
              <div className="space-y-4">
                <p className="text-lg text-black">
                  <strong>Start at the top.</strong> Use the <strong>Scientific Investigation</strong> prompt to feed MEDSTORYAI your key data and insights.
                </p>
                
                <p className="text-lg text-black">
                  <strong>Follow the flow.</strong> Work down each section in order; every step refines the narrative, so the final <strong>MEDSTORY Slide Deck</strong> is coherent and compelling.
                </p>
                
                <p className="text-lg text-black">
                  <strong>Review and refine.</strong> The app delivers a deck ready for your finishing touches—saving you hours while elevating quality.
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-300">
              <p className="text-base text-black">
                Need a human touch? Email Bernie Coccia (bcoccia@sciencebranding.com) to schedule a personal walkthrough and ensure your story shines.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
