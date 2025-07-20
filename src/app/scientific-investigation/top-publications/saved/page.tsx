'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import PageLayout from '@/app/components/PageLayout';

interface KeyPoint {
  id: string;
  content: string;
}

export default function SavedExpertInterviewPage() {
  const [savedKeyPoints, setSavedKeyPoints] = useState<KeyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved key points from session storage
    const loadSavedKeyPoints = () => {
      try {
        const savedData = sessionStorage.getItem('selectedInterviewKeyPointsData');
        if (savedData) {
          const keyPoints = JSON.parse(savedData);
          setSavedKeyPoints(keyPoints);
        }
      } catch (error) {
        console.error('Error loading saved key points:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedKeyPoints();
  }, []);

  const handleRemoveKeyPoint = (keyPointId: string) => {
    const updatedKeyPoints = savedKeyPoints.filter(point => point.id !== keyPointId);
    setSavedKeyPoints(updatedKeyPoints);
    
    // Update session storage
    sessionStorage.setItem('selectedInterviewKeyPointsData', JSON.stringify(updatedKeyPoints));
    
    // Update the selected IDs list
    const selectedIds = updatedKeyPoints.map(point => point.id);
    sessionStorage.setItem('selectedInterviewKeyPoints', JSON.stringify(selectedIds));
  };

  const handleClearAll = () => {
    setSavedKeyPoints([]);
    sessionStorage.removeItem('selectedInterviewKeyPointsData');
    sessionStorage.removeItem('selectedInterviewKeyPoints');
  };

  const handleExportKeyPoints = () => {
    if (savedKeyPoints.length === 0) return;
    
    const exportText = savedKeyPoints.map((point, index) => 
      `${index + 1}. ${point.content}`
    ).join('\n\n');
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expert-interview-key-points-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PageLayout
        sectionIcon={
          <Image src="/stakeholder_interviews_chat.png" alt="Core Story Chat" width={72} height={72} className="w-18 h-18" />
        }
        sectionName="Stakeholder Interviews"
        taskName="Saved Interview Key Points"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-lg text-gray-600">Loading saved key points...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      sectionIcon={
        <Image src="/stakeholder_interviews_chat.png" alt="Core Story Chat" width={72} height={72} className="w-18 h-18" />
      }
      sectionName="Stakeholder Interviews"
      taskName="Saved Interview Key Points"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Saved Interview Key Points</h1>
              <p className="text-gray-600 mt-1">
                {savedKeyPoints.length} {savedKeyPoints.length === 1 ? 'key point' : 'key points'} saved
              </p>
            </div>
            {savedKeyPoints.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleExportKeyPoints}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Export
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {savedKeyPoints.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved key points</h3>
              <p className="text-gray-600 mb-4">
                You haven&apos;t saved any interview key points yet. Go back to the expert interview page and select key points to save them here.
              </p>
              <a
                href="/scientific-investigation/top-publications"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Expert Interview
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {savedKeyPoints.map((point, index) => (
                <div key={point.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-2">
                        Key Point {index + 1}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveKeyPoint(point.id)}
                      className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                      title="Remove key point"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-gray-700 text-sm leading-relaxed">
                    {point.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {savedKeyPoints.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Using Your Saved Key Points</h3>
              <p className="text-sm text-blue-800">
                These saved key points are stored in your browser session and can be used for other prompts and analysis. 
                You can export them as a text file or continue adding more key points from expert interviews.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}