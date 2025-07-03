'use client';

import SidebarMenu from '../SidebarMenu';

export default function EnterPage() {
  return (
    <div className="flex min-h-screen text-black">
      {/* Sidebar */}
      <aside className="w-72 bg-[#002F6C] text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-4">
          <span style={{ color: '#35b4fc' }}>MEDSTORY</span>
          <span style={{ color: '#ff914d' }}>AI</span>
        </h2>
        <SidebarMenu />
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-12">
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl font-extrabold text-[#063471] mb-8">
            Welcome to <span style={{ color: '#35b4fc' }}>MEDSTORY</span>
            <span style={{ color: '#ff914d' }}>AI</span>!
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Your AI-powered platform for creating compelling medical stories and presentations. 
            Choose from the menu on the left to get started with your medical storytelling journey.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {/* Feature Cards */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <img src="/scientific_investigation_menu.png" alt="Scientific Investigation" className="w-8 h-8 mr-3" />
                <h3 className="text-lg font-semibold text-[#002F6C]">Scientific Investigation</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Find landmark publications, identify thought leaders, and uncover unmet needs in your field.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <img src="/stakeholder_interviews_menu.png" alt="Stakeholder Interviews" className="w-8 h-8 mr-3" />
                <h3 className="text-lg font-semibold text-[#002F6C]">Stakeholder Interviews</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Simulate expert interviews, create question lists, and analyze interview transcripts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <img src="/core_story_concept_menu.png" alt="Core Story Concept" className="w-8 h-8 mr-3" />
                <h3 className="text-lg font-semibold text-[#002F6C]">Core Story Concept</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Create, optimize, and evaluate compelling core story concepts for your medical narratives.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <img src="/story_flow_map_menu.png" alt="Story Flow Map" className="w-8 h-8 mr-3" />
                <h3 className="text-lg font-semibold text-[#002F6C]">Story Flow Map</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Create tension-resolution points and develop comprehensive story flow maps.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-4">
                <img src="/medstory_slide_deck_menu.png" alt="MEDSTORY Slide Deck" className="w-8 h-8 mr-3" />
                <h3 className="text-lg font-semibold text-[#002F6C]">MEDSTORY Slide Deck</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Create, optimize, and evaluate professional MEDSTORY slide presentations.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-lg text-[#002F6C] font-medium">
              👈 Select an option from the menu to begin your medical storytelling journey
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
