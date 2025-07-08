'use client';

import { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

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
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

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
    setShowFinalMessage(false);
  };

  const formatLandmarkResult = (content: string) => {
    // Format the numbered response according to requirements
    // Format: N. **Authors.** Title. Journal. Year;Volume:Pages.
    // **Impact Score (0-100):** Score
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

    // Split into individual studies
    const studies = formatted.split(/(?=\d+\.\s)/);
    
    const formattedStudies = studies.map(study => {
      if (!study.trim()) return '';
      
      // Extract components using regex
      const studyMatch = study.match(/^(\d+)\.\s*(.+?)(?=Impact Score|$)/s);
      const impactMatch = study.match(/Impact Score \(0-100\):\s*(\d+)/);
      const descriptionMatch = study.match(/Impact Score \(0-100\):\s*\d+\s*(.+?)$/s);
      
      if (!studyMatch) return study;
      
      const number = studyMatch[1];
      const citation = studyMatch[2].trim();
      const impactScore = impactMatch ? impactMatch[1] : '';
      const description = descriptionMatch ? descriptionMatch[1].trim() : '';
      
      // Format the citation to bold the authors (everything before the first period after "et al.")
      let formattedCitation = citation;
      const authorMatch = citation.match(/^(.+?(?:et al\.)?)\s*(.+)$/);
      if (authorMatch) {
        const authors = authorMatch[1];
        const rest = authorMatch[2];
        formattedCitation = `**${authors}** ${rest}`;
      }
      
      // Build the formatted study
      let formattedStudy = `**${number}.** ${formattedCitation}`;
      
      if (impactScore) {
        formattedStudy += `\n**Impact Score (0-100):** ${impactScore}`;
      }
      
      if (description) {
        formattedStudy += `\n${description}`;
      }
      
      return formattedStudy;
    }).filter(study => study.trim());

    return formattedStudies.join('\n\n');
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
        setResult(formatLandmarkResult(data.result));
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
        <img src="/scientific_investigation_chat.png" alt="Core Story Chat" className="w-12 h-12" />
      }
      sectionName="Scientific Investigation"
      taskName="Find landmark publications"
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
        {result && (
          <div className="flex-1 space-y-6" ref={resultRef}>
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Landmark Publications</h2>
              <div className="text-gray-800 leading-relaxed max-w-none">
                {result.split('\n\n').map((study, index) => (
                  <div key={index} className="mb-6 last:mb-0">
                    {study.split('\n').map((line, lineIndex) => {
                      // Handle bold formatting
                      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      return (
                        <div
                          key={lineIndex}
                          className={`${lineIndex > 0 ? 'mt-2' : ''}`}
                          dangerouslySetInnerHTML={{ __html: formattedLine }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
