'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import PageLayout from '@/app/components/PageLayout';

interface Study {
  id: string;
  number: string;
  citation: string;
  impactScore: string;
  description: string;
  fullText: string;
}

export default function SavedLandmarkPublicationsPage() {
  const [savedStudies, setSavedStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved studies from session storage
    const loadSavedStudies = () => {
      try {
        const savedData = sessionStorage.getItem('selectedLandmarkStudiesData');
        if (savedData) {
          const studies = JSON.parse(savedData);
          setSavedStudies(studies);
        }
      } catch (error) {
        console.error('Error loading saved studies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedStudies();
  }, []);

  const handleRemoveStudy = (studyId: string) => {
    const updatedStudies = savedStudies.filter((study) => study.id !== studyId);
    setSavedStudies(updatedStudies);

    // Update session storage
    sessionStorage.setItem('selectedLandmarkStudiesData', JSON.stringify(updatedStudies));

    // Update the selected IDs list
    const selectedIds = updatedStudies.map((study) => study.id);
    sessionStorage.setItem('selectedLandmarkStudies', JSON.stringify(selectedIds));
  };

  const handleClearAll = () => {
    setSavedStudies([]);
    sessionStorage.removeItem('selectedLandmarkStudiesData');
    sessionStorage.removeItem('selectedLandmarkStudies');
  };

  const handleExportStudies = () => {
    if (savedStudies.length === 0) return;

    const exportText = savedStudies
      .map(
        (study) =>
          `${study.number}. ${study.citation}\nImpact Score (0-100): ${study.impactScore}\n${study.description}\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landmark-publications-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PageLayout
        sectionIcon={
          <Image
            src="/scientific_investigation_chat.png"
            alt="Core Story Chat"
            width={90}
            height={90}
            className="w-24 h-24"
          />
        }
        sectionName="Scientific Investigation"
        taskName="Saved Landmark Publications"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-lg text-gray-600">Loading saved studies...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      sectionIcon={
        <Image
          src="/scientific_investigation_chat.png"
          alt="Core Story Chat"
          width={90}
          height={90}
          className="w-24 h-24"
        />
      }
      sectionName="Scientific Investigation"
      taskName="Saved Landmark Publications"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Saved Landmark Publications</h1>
              <p className="text-gray-600 mt-1">
                {savedStudies.length} {savedStudies.length === 1 ? 'study' : 'studies'} saved
              </p>
            </div>
            {savedStudies.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleExportStudies}
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

          {savedStudies.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved studies</h3>
              <p className="text-gray-600 mb-4">
                You haven&apos;t saved any landmark publications yet. Go back to the landmark
                publications page and select studies to save them here.
              </p>
              <a
                href="/scientific-investigation/landmark-publications"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Find Key Publications
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {savedStudies.map((study) => (
                <div
                  key={study.id}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <a
                        href={`/api/resolve-landmark-link?q=${encodeURIComponent(study.citation)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block cursor-pointer hover:text-blue-700"
                      >
                        <div className="font-medium text-blue-800 mb-2 hover:underline">
                          {study.number}. {study.citation}
                        </div>
                        {study.impactScore && (
                          <div className="text-sm font-semibold text-blue-600 mb-2">
                            Impact Score (0-100): {study.impactScore}
                          </div>
                        )}
                      </a>
                    </div>
                    <button
                      onClick={() => handleRemoveStudy(study.id)}
                      className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                      title="Remove study"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="text-gray-700 text-sm leading-relaxed">{study.description}</div>
                </div>
              ))}
            </div>
          )}

          {savedStudies.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Using Your Saved Studies</h3>
              <p className="text-sm text-blue-800">
                These saved studies are stored in your browser session and can be used for other
                prompts and analysis. You can export them as a text file or continue adding more
                studies from the landmark publications page.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
