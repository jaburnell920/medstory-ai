'use client';

import { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

interface Study {
  id: string;
  number: string;
  citation: string;
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
        'OK, before we get started, please provide the information below. (Please answer each question one at a time):\n\n1. ' +
        questions[0],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudies, setSelectedStudies] = useState<Set<string>>(new Set());
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  // Load selected studies from session storage on component mount
  useEffect(() => {
    const savedSelected = sessionStorage.getItem('selectedLandmarkStudies');
    if (savedSelected) {
      setSelectedStudies(new Set(JSON.parse(savedSelected)));
    }
  }, []);

  // Parse studies from result text
  const parseStudies = (text: string): Study[] => {
    const studyBlocks = text.split(/\n\s*\n/).filter(block => block.trim());
    return studyBlocks.map((block, index) => {
      const lines = block.trim().split('\n');
      const citationLine = lines[0] || '';
      const impactLine = lines.find(line => line.includes('Impact Score')) || '';
      const descriptionLines = lines.filter(line => 
        !line.match(/^\d+\./) && !line.includes('Impact Score')
      );
      
      const numberMatch = citationLine.match(/^(\d+)\./);
      const number = numberMatch ? numberMatch[1] : String(index + 1);
      const citation = citationLine.replace(/^\d+\.\s*/, '');
      const impactScore = impactLine.replace('Impact Score (0-100):', '').trim();
      const description = descriptionLines.join(' ').trim();
      
      return {
        id: `study-${number}-${Date.now()}-${index}`,
        number,
        citation,
        impactScore,
        description,
        fullText: block
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
    
    // Save to session storage
    sessionStorage.setItem('selectedLandmarkStudies', JSON.stringify(Array.from(newSelected)));
    
    // Also save the actual study data
    const selectedStudyData = studies.filter(study => newSelected.has(study.id));
    sessionStorage.setItem('selectedLandmarkStudiesData', JSON.stringify(selectedStudyData));
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
          'OK, before we get started, please provide the information below. (Please answer each question one at a time):\n\n1. ' +
          questions[0],
      },
    ]);
    setLoading(false);
    setResult('');
    setStudies([]);
    setShowFinalMessage(false);
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

    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput('');

    if (step < questions.length - 1) {
      setAnswers([...answers, input]);
      setMessages([
        ...newMessages,
        { role: 'assistant' as const, content: `${step + 2}. ${questions[step + 1]}` },
      ]);
      setStep(step + 1);
    } else {
      setAnswers([...answers, input]);
      setMessages([
        ...newMessages,
        {
          role: 'assistant' as const,
          content: 'Thanks, Please wait while I find landmark publications based on your answers',
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
        <img src="/scientific_investigation_chat.png" alt="Core Story Chat" className="w-18 h-18" />
      }
      sectionName="Scientific Investigation"
      taskName={
        <span 
          onClick={handleTitleClick} 
          className="cursor-pointer hover:text-blue-600 transition-colors"
          title="Click to view saved studies"
        >
          Find landmark publications
        </span>
      }
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Chat Interface - Left Side */}
        <div className="w-full lg:w-3/5">
          <ChatInterface
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            loading={loading}
            showInput={!showFinalMessage}
            placeholder="Type your response..."
            onReset={handleReset}
          />
        </div>

        {/* Result Section - Right Side */}
        {studies.length > 0 && (
          <div className="flex-1 space-y-6" ref={resultRef}>
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-900">Landmark Publications</h2>
                <span className="text-sm text-gray-600">
                  {selectedStudies.size} selected
                </span>
              </div>
              <div className="space-y-6">
                {studies.map((study) => (
                  <div key={study.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={study.id}
                        checked={selectedStudies.has(study.id)}
                        onChange={(e) => handleStudySelection(study.id, e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor={study.id} className="cursor-pointer">
                          <div className="font-medium text-gray-900 mb-2">
                            {study.number}. {study.citation}
                          </div>
                          {study.impactScore && (
                            <div className="text-sm font-semibold text-blue-600 mb-2">
                              Impact Score (0-100): {study.impactScore}
                            </div>
                          )}
                          <div className="text-gray-700 text-sm leading-relaxed">
                            {study.description}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedStudies.size > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Tip: Click on &quot;Find landmark publications&quot; in the header to view your saved studies
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
