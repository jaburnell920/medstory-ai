'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import PageLayout from '@/app/components/PageLayout';

interface SavedTensionResolution {
  id: string;
  timestamp: string;
  context: {
    coreStoryConcept: string;
    audience: string;
    interventionName: string;
    diseaseCondition: string;
  };
  selectedAttackPoint: {
    index: number;
    content: string;
  } | null;
  selectedTensionPoints: {
    index: number;
    content: string;
  }[];
  conclusion: string;
  references: string;
}

export default function SavedTensionResolutionPage() {
  const [savedData, setSavedData] = useState<SavedTensionResolution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved data from localStorage
    const loadSavedData = () => {
      try {
        const savedDataString = localStorage.getItem('savedTensionResolutionData');
        if (savedDataString) {
          const data = JSON.parse(savedDataString);
          setSavedData(data);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedData();
  }, []);

  const handleRemoveItem = (itemId: string) => {
    const updatedData = savedData.filter((item) => item.id !== itemId);
    setSavedData(updatedData);

    // Update localStorage
    localStorage.setItem('savedTensionResolutionData', JSON.stringify(updatedData));
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <PageLayout
        sectionIcon={
          <Image
            src="/core_story_concept_new.png"
            alt="Story Flow Map"
            width={72}
            height={72}
            className="w-18 h-18"
          />
        }
        sectionName="Story Flow Map"
        taskName="Saved Tension-Resolution Outlines"
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
          src="/core_story_concept_new.png"
          alt="Story Flow Map"
          width={72}
          height={72}
          className="w-18 h-18"
        />
      }
      sectionName="Story Flow Map"
      taskName="Saved Tension-Resolution Outlines"
    >
      <div className="space-y-6">
        {savedData.length > 0 ? (
          savedData.map((item) => (
            <div key={item.id} className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-blue-900">
                    Saved Tension-Resolution Outline
                  </h2>
                  <p className="text-sm text-gray-500">Saved on {formatDate(item.timestamp)}</p>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              {/* Context Information */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Context</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold">Audience:</span> {item.context.audience}
                  </div>
                  <div>
                    <span className="font-semibold">Intervention:</span> {item.context.interventionName}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold">Disease/Condition:</span> {item.context.diseaseCondition}
                  </div>
                  {item.context.coreStoryConcept && (
                    <div className="md:col-span-2">
                      <span className="font-semibold">Core Story Concept:</span>
                      <div className="mt-1 text-xs bg-white p-2 rounded border">
                        {item.context.coreStoryConcept.substring(0, 200)}
                        {item.context.coreStoryConcept.length > 200 && '...'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Attack Point */}
              {item.selectedAttackPoint && (
                <div className="mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      Selected Attack Point #{item.selectedAttackPoint.index + 1}
                    </h3>
                    <pre className="text-gray-800 whitespace-pre-wrap font-sans text-sm">
                      {item.selectedAttackPoint.content.replace(/^\*{0,2}Attack Point #\d+\*{0,2}:?\s*\n?/i, '')}
                    </pre>
                  </div>
                </div>
              )}

              {/* Selected Tension-Resolution Points */}
              {item.selectedTensionPoints.length > 0 && (
                <div className="mb-4 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Selected Tension-Resolution Points ({item.selectedTensionPoints.length})
                  </h3>
                  {item.selectedTensionPoints.map((point, idx) => (
                    <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-md font-semibold text-blue-800 mb-2">
                        Tension-Resolution #{point.index + 1}
                      </h4>
                      <pre className="text-gray-800 whitespace-pre-wrap font-sans text-sm">
                        {point.content.replace(/^\*?\*?Tension-Resolution #\d+.*?\n?/i, '')}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Conclusion */}
              {item.conclusion && (
                <div className="mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Conclusion</h3>
                    <pre className="text-gray-800 whitespace-pre-wrap font-sans text-sm">
                      {item.conclusion}
                    </pre>
                  </div>
                </div>
              )}

              {/* References */}
              {item.references && (
                <div className="mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">References</h3>
                    <pre className="text-gray-800 whitespace-pre-wrap font-sans text-sm">
                      {item.references}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No Saved Tension-Resolution Outlines</div>
              <div className="text-gray-400 text-sm">
                Go to the Tension-Resolution creation page to save outlines.
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}