'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import PageLayout from '@/app/components/PageLayout';

interface CoreStoryConcept {
  id: string;
  content: string;
  disease: string;
  drug: string;
  audience: string;
  length: string;
  conceptNumber: number;
}

export default function SavedCoreStoryConceptPage() {
  const [savedConcept, setSavedConcept] = useState<CoreStoryConcept | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved concept from localStorage
    const loadSavedConcept = () => {
      try {
        const savedData = localStorage.getItem('selectedCoreStoryConceptData');
        if (savedData) {
          const concept = JSON.parse(savedData);
          setSavedConcept(concept);
        }
      } catch (error) {
        console.error('Error loading saved concept:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedConcept();
  }, []);

  const handleRemoveConcept = () => {
    setSavedConcept(null);

    // Update localStorage
    localStorage.removeItem('selectedCoreStoryConceptData');
    localStorage.removeItem('selectedCoreStoryConcept');
  };

  if (loading) {
    return (
      <PageLayout
        sectionIcon={
          <Image
            src="/core_story_chat.png"
            alt="Core Story Chat"
            width={72}
            height={72}
            className="w-18 h-18"
          />
        }
        sectionName="Core Story Concept"
        taskName="Saved Core Story Concept"
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      sectionIcon={
        <Image
          src="/core_story_chat.png"
          alt="Core Story Chat"
          width={72}
          height={72}
          className="w-18 h-18"
        />
      }
      sectionName="Core Story Concept"
      taskName="Saved Core Story Concept"
    >
      <div className="space-y-6">
        {savedConcept ? (
          <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-blue-900">Selected Core Story Concept</h2>
              <button
                onClick={handleRemoveConcept}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {savedConcept.content
                  .replace(
                    /\*\*TENSION\*\*/g,
                    '<span class="font-bold text-blue-800 block mt-4 mb-2">TENSION</span>'
                  )
                  .replace(
                    /\*\*RESOLUTION\*\*/g,
                    '<span class="font-bold text-blue-800 block mt-4 mb-2">RESOLUTION</span>'
                  )
                  .replace(
                    /Core Story Concept Candidate #\d+/g,
                    () =>
                      `<span class="font-bold text-blue-800 text-lg">Core Story Concept Candidate #${savedConcept.conceptNumber}</span>`
                  )
                  .replace(/##/g, '') // Remove all occurrences of ##
                  .split('\n')
                  .map((line, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
                  ))}
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <span className="font-semibold">Disease:</span> {savedConcept.disease}
                  </div>
                  <div>
                    <span className="font-semibold">Drug:</span> {savedConcept.drug}
                  </div>
                  <div>
                    <span className="font-semibold">Audience:</span> {savedConcept.audience}
                  </div>
                  <div>
                    <span className="font-semibold">Length:</span> {savedConcept.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No Core Story Concept Selected</div>
              <div className="text-gray-400 text-sm">
                Go to the Core Story Concept creation page to select a concept.
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}