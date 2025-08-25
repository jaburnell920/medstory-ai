'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

interface Study {
  id: string;
  number: string;
  citation: string;
  doi?: string;
  pmid?: string;
  impactScore: string;
  description: string;
  fullText: string;
}

const questions = [
  'What is your topic? (Please be specific)',
  'For studies published after what year? (year)',
  'Do you want classic landmark studies, recent landmark studies, or both?',
  'Do you want to show all landmark studies or a specific number?',
  'Do you want a short summary of each study? (y/n)',
  'Do you want a short explanation of why it is considered a landmark study? (y/n)',
  'Do you want it to sort studies from most to least impactful? (y/n)',
];

export default function LandmarkPublicationsPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([
    {
      role: 'assistant',
      content:
        'OK, before we get started, please provide the information below.\n\n1. ' + questions[0],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudies, setSelectedStudies] = useState<Set<string>>(new Set());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const [initialResultsLoaded, setInitialResultsLoaded] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Only scroll to results when they are first generated, not on checkbox changes
  useEffect(() => {
    if (resultRef.current && result && studies.length > 0 && !initialResultsLoaded) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
      setInitialResultsLoaded(true);
    }
  }, [result, studies, initialResultsLoaded]);

  // Load selected studies from session storage on component mount
  useEffect(() => {
    const savedSelected = sessionStorage.getItem('selectedLandmarkStudies');
    if (savedSelected) {
      setSelectedStudies(new Set(JSON.parse(savedSelected)));
    }
  }, []);

  // Parse studies from result text
  const parseStudies = (text: string): Study[] => {
    // Split the text into study blocks (separated by double newlines)
    const studyBlocks = text.split(/\n\s*\n/).filter((block) => block.trim());

    return studyBlocks.map((block, index) => {
      // Split the block into lines
      const lines = block.trim().split('\n');

      // First, handle the case where a line contains both page number completion and impact score
      // Look for lines that match pattern: "number. Impact Score (0-100): score"
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const impactMatch = line.match(/^(\d+)\.\s*Impact Score \(0-100\):\s*(\d+)/);

        if (impactMatch && i > 0) {
          const pageNumber = impactMatch[1];
          const score = impactMatch[2];

          // Check if the previous line ends with a hyphen (indicating split page range)
          const prevLine = lines[i - 1].trim();
          if (prevLine.endsWith('-')) {
            // Complete the page range in the previous line
            lines[i - 1] = prevLine + pageNumber + '.';
            // Replace current line with just the impact score
            lines[i] = `Impact Score (0-100): ${score}`;
          }
        }
      }

      // Find the impact score line
      const impactLineIndex = lines.findIndex((line) =>
        line.trim().startsWith('Impact Score (0-100):')
      );

      // Find DOI and PMID lines
      const doiLineIndex = lines.findIndex((line) =>
        line.trim().startsWith('DOI:')
      );
      const pmidLineIndex = lines.findIndex((line) =>
        line.trim().startsWith('PMID:')
      );

      // Reconstruct the citation by joining lines before DOI/PMID/impact score
      let citationLines: string[] = [];
      let descriptionLines: string[] = [];

      if (impactLineIndex >= 0) {
        // Find the first metadata line (DOI, PMID, or Impact Score)
        const firstMetadataIndex = Math.min(
          ...[doiLineIndex, pmidLineIndex, impactLineIndex].filter(i => i >= 0)
        );
        
        // Citation is everything before the first metadata line
        citationLines = lines.slice(0, firstMetadataIndex);
        // Description is everything after the impact score line
        descriptionLines = lines.slice(impactLineIndex + 1);
      } else {
        // If no impact score found, first line is citation, rest is description
        citationLines = [lines[0] || ''];
        descriptionLines = lines.slice(1);
      }

      // Join citation lines with spaces
      const fullCitation = citationLines.join(' ').replace(/\s+/g, ' ').trim();

      // Extract the study number
      const numberMatch = fullCitation.match(/^(\d+)\./);
      const number = numberMatch ? numberMatch[1] : String(index + 1);

      // Extract the citation text (everything after the number)
      const citation = fullCitation.replace(/^\d+\.\s*/, '');

      // Extract the impact score
      const impactLine = lines[impactLineIndex] || '';
      const impactScore = impactLine.replace('Impact Score (0-100):', '').trim();

      // Extract DOI and PMID
      const doiLine = doiLineIndex >= 0 ? lines[doiLineIndex] : '';
      const doi = doiLine.replace('DOI:', '').trim();
      const pmidLine = pmidLineIndex >= 0 ? lines[pmidLineIndex] : '';
      const pmid = pmidLine.replace('PMID:', '').trim();

      // Join description lines
      const description = descriptionLines.join(' ').trim();

      return {
        id: `study-${number}-${Date.now()}-${index}`,
        number,
        citation,
        doi: doi && doi !== 'Not available' ? doi : undefined,
        pmid: pmid && pmid !== 'Not available' ? pmid : undefined,
        impactScore,
        description,
        fullText: block,
      };
    });
  };

  // Handle checkbox changes
  const handleStudySelection = (studyId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedStudies);
    if (isSelected) {
      newSelected.add(studyId);
    } else {
      newSelected.delete(studyId);
    }
    setSelectedStudies(newSelected);
  };

  // Generate the appropriate link for a study based on available identifiers
  const generateStudyLink = (study: Study): { url: string; isReliable: boolean } => {
    // Priority 1: DOI link (most reliable)
    if (study.doi) {
      return {
        url: `https://doi.org/${study.doi}`,
        isReliable: true
      };
    }
    
    // Priority 2: PubMed link (very reliable)
    if (study.pmid) {
      return {
        url: `https://pubmed.ncbi.nlm.nih.gov/${study.pmid}/`,
        isReliable: true
      };
    }
    
    // Priority 3: Google search fallback (less reliable)
    const searchTerms = extractSearchTerms(study.citation);
    return {
      url: `/api/google-search-redirect?q=${encodeURIComponent(searchTerms)}`,
      isReliable: false
    };
  };

  // Extract search terms from citation for Google search linking (without quotes)
  const extractSearchTerms = (citation: string): string => {
    // Remove the study number prefix
    const cleanCitation = citation.replace(/^\d+\.\s*/, '');

    // Extract author surname (first word before comma or space)
    const authorMatch = cleanCitation.match(/^([A-Za-z-]+)/);
    const author = authorMatch ? authorMatch[1] : '';

    // Extract year from citation
    const yearMatch = cleanCitation.match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : '';

    // Extract journal name (look for common journal abbreviations and full names)
    const journalMatch = cleanCitation.match(
      /(N Engl J Med|New England Journal of Medicine|JAMA|Journal of the American Medical Association|Lancet|The Lancet|Circulation|Ann Thorac Surg|Annals of Thoracic Surgery|BMJ|British Medical Journal|J Thorac Cardiovasc Surg|Journal of Thoracic and Cardiovascular Surgery|S Afr Med J|South African Medical Journal|Obesity|Nature|Science|Cell|NEJM)/i
    );
    const journal = journalMatch ? journalMatch[1] : '';

    // Extract title - more flexible approach for Google search
    let title = '';
    
    // Try to find title between author and journal
    if (journal) {
      const titlePattern = new RegExp(`^[^.]+\\.\\s*(.+?)\\s*\\.?\\s*${journal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      const titleMatch = cleanCitation.match(titlePattern);
      title = titleMatch ? titleMatch[1] : '';
    }
    
    // Fallback: extract text between first period and year
    if (!title && year) {
      const titleMatch = cleanCitation.match(/^[^.]+\.\s*(.+?)\s*\.?\s*\d{4}/);
      title = titleMatch ? titleMatch[1] : '';
    }
    
    // Another fallback: extract text between first period and journal/year
    if (!title) {
      const titleMatch = cleanCitation.match(/^[^.]+\.\s*(.+?)\s*\./);
      title = titleMatch ? titleMatch[1] : '';
    }

    // Clean up title - remove "et al" and extra punctuation
    title = title
      .replace(/,?\s*et al\.?/gi, '')
      .replace(/[;:]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // For Google search, combine terms without quotes
    const searchQuery = [title, author, year, journal]
      .filter((term) => term.length > 0)
      .join(' ')
      .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
      .replace(/\s+/g, ' ')
      .trim();

    return searchQuery || cleanCitation; // Fallback to original citation if extraction fails
  };

  // Handle saving selected studies to session storage
  const handleSaveSelected = () => {
    // Save to session storage
    sessionStorage.setItem('selectedLandmarkStudies', JSON.stringify(Array.from(selectedStudies)));

    // Also save the actual study data
    const selectedStudyData = studies.filter((study) => selectedStudies.has(study.id));
    sessionStorage.setItem('selectedLandmarkStudiesData', JSON.stringify(selectedStudyData));

    // Show success message
    toast.success(`${selectedStudies.size} studies saved successfully!`);
  };

  // Handle clicking on title to access hidden page
  const handleTitleClick = () => {
    window.location.href = '/scientific-investigation/landmark-publications/saved';
  };

  const handleReset = () => {
    setStep(0);
    setAnswers([]);
    setInput('');
    setMessages([
      {
        role: 'assistant',
        content:
          'OK, before we get started, please provide the information below.\n\n1. ' + questions[0],
      },
    ]);
    setLoading(false);
    setResult('');
    setStudies([]);
    setShowFinalMessage(false);
    setInitialResultsLoaded(false);
  };

  const formatLandmarkResult = (content: string) => {
    // Format the numbered response according to requirements
    // Format: N. Authors. Title. Journal. Year;Volume:Pages.
    // Impact Score (0-100): Score
    // Description.

    let formatted = content;

    // Remove quotes and vertical bars
    formatted = formatted.replace(/"/g, '');
    formatted = formatted.replace(/\|/g, '');

    // Clean up any table formatting remnants
    formatted = formatted.replace(
      /Study Number|Citation|Title|Impact of Study|Summary|Significance/g,
      ''
    );
    formatted = formatted.replace(/[-]{2,}/g, '');

    // Ensure each numbered item starts on a new line
    formatted = formatted.replace(/(\d+)\.\s*/g, '\n$1. ');

    // Clean up extra whitespace and empty lines
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
    formatted = formatted.trim();

    return formatted;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check if user provided comma-separated answers (for all questions at once)
    const inputParts = input.split(',').map((part) => part.trim());
    const isCommaSeparatedInput = inputParts.length === 7 && step === 0;

    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput('');

    if (isCommaSeparatedInput) {
      // Handle comma-separated input for all questions
      setAnswers(inputParts);
      setMessages([
        ...newMessages,
        {
          role: 'assistant' as const,
          content: 'Thanks, Please wait while I find key publications based on your answers',
        },
      ]);
      setShowFinalMessage(true);
      setLoading(true);
      setStep(questions.length); // Set to final step

      const query = inputParts.join(',');

      try {
        const res = await fetch('/api/openai-landmark-studies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        const formattedResult = formatLandmarkResult(data.result);
        setResult(formattedResult);
        setStudies(parseStudies(formattedResult));
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } catch {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to load results.' }]);
      } finally {
        setLoading(false);
      }
    } else if (step < questions.length - 1) {
      // Handle single question at a time
      setAnswers([...answers, input]);
      setMessages([
        ...newMessages,
        { role: 'assistant' as const, content: `${step + 2}. ${questions[step + 1]}` },
      ]);
      setStep(step + 1);
    } else {
      // Handle final question in step-by-step mode
      setAnswers([...answers, input]);
      setMessages([
        ...newMessages,
        {
          role: 'assistant' as const,
          content: 'Thanks, Please wait while I find key publications based on your answers',
        },
      ]);
      setShowFinalMessage(true);
      setLoading(true);

      const updatedAnswers = [...answers, input];
      setAnswers(updatedAnswers);

      const query = updatedAnswers.join(',');
      if (updatedAnswers.length < 7) {
        toast.error('Please answer all 7 questions before submitting.');
        return;
      }

      try {
        const res = await fetch('/api/openai-landmark-studies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        const formattedResult = formatLandmarkResult(data.result);
        setResult(formattedResult);
        setStudies(parseStudies(formattedResult));
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to load results.' }]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <PageLayout
      sectionIcon={
        <Image
          src="/scientific_investigation_chat.png"
          alt="Core Story Chat"
          width={90}
          height={90}
          className="w-28 h-32"
        />
      }
      sectionName="Scientific Investigation"
      taskName={
        <span
          onClick={handleTitleClick}
          className="cursor-pointer hover:text-blue-600 transition-colors"
          title="Click to view saved studies"
        >
          Find key publications
        </span>
      }
    >
      <div className="flex gap-1 h-full">
        {/* Chat Interface - Left Side */}
        <div className="w-1/2 h-full">
          <ChatInterface
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            loading={loading}
            showInput={true}
            placeholder="Type your response..."
            onReset={handleReset}
          />
        </div>

        {/* Result Section - Right Side - Fixed */}
        <div className="flex-1 h-full">
          {studies.length > 0 ? (
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-blue-900">Key Publications</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{selectedStudies.size} selected</span>
                  {selectedStudies.size > 0 && (
                    <button
                      onClick={handleSaveSelected}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Save Selected
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto flex-1">
                {studies.map((study) => (
                  <div
                    key={study.id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={study.id}
                        checked={selectedStudies.has(study.id)}
                        onChange={(e) => handleStudySelection(study.id, e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        {(() => {
                          const linkInfo = generateStudyLink(study);
                          const LinkComponent = linkInfo.isReliable ? 'a' : 'div';
                          
                          return (
                            <LinkComponent
                              {...(linkInfo.isReliable ? {
                                href: linkInfo.url,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                className: "block cursor-pointer hover:text-blue-700"
                              } : {
                                className: "block"
                              })}
                            >
                              <div className={`font-medium mb-2 ${linkInfo.isReliable ? 'text-blue-800 hover:underline cursor-pointer' : 'text-gray-600'}`}>
                                {study.number}. {study.citation}
                                {!linkInfo.isReliable && (
                                  <span className="ml-2 text-xs text-red-500 font-normal">
                                    (Link unavailable - no DOI/PMID)
                                  </span>
                                )}
                              </div>
                              
                              {/* Show DOI and PMID if available */}
                              {(study.doi || study.pmid) && (
                                <div className="text-xs text-gray-500 mb-2 space-y-1">
                                  {study.doi && (
                                    <div>DOI: {study.doi}</div>
                                  )}
                                  {study.pmid && (
                                    <div>PMID: {study.pmid}</div>
                                  )}
                                </div>
                              )}
                              
                              {study.impactScore && (
                                <div className="text-sm font-semibold text-blue-600 mb-2">
                                  Impact Score (0-100): {study.impactScore}
                                </div>
                              )}
                              <div className="text-gray-700 text-sm leading-relaxed">
                                {study.description}
                              </div>
                            </LinkComponent>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div></div>
            // <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex items-center justify-center">
            //   <p className="text-gray-500 text-center">
            //     Landmark Publications will appear here once generated
            //   </p>
            // </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
