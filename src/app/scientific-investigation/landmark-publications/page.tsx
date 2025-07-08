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
    // This function formats landmark publications with the following requirements:
    // 1. Number the references in bold
    // 2. Bold the authors
    // 3. Do not prematurely break lines on page numbers (use full width)
    // 4. Put "Impact Score(0-100):" on a new line and make it bold (score not bold)
    // 5. Start article description on a new line

    // First, let's fix any line breaks in the page numbers
    let formatted = content;
    
    // Fix line breaks in page numbers by joining lines that end with a hyphen
    formatted = formatted.replace(/(\d+)-\s*\n\s*(\d+)/g, '$1-$2');
    
    // Fix any numbers that might have been split across lines
    formatted = formatted.replace(/(\d+)\.\s*\n\s*(\d+)/g, '$1.$2');
    
    // Now clean up the content
    formatted = formatted
      .replace(/"/g, '')                // Remove quotes
      .replace(/\|/g, '')               // Remove vertical bars
      .replace(/Study Number|Citation|Title|Impact of Study|Summary|Significance/g, '') // Remove table headers
      .replace(/[-]{2,}/g, '')          // Remove table separators
      .replace(/(\d+)\.\s*/g, '\n$1. '); // Ensure each numbered item starts on a new line

    // Process each entry
    const entries = formatted.split(/\n(?=\d+\.\s+)/).filter(entry => entry.trim());
    
    const processedEntries = entries.map(entry => {
      // First, find and extract the reference number
      const refMatch = entry.match(/^(\d+)\./);
      if (!refMatch) return entry;
      
      // Extract the citation line (first line up to Impact Score)
      const impactScoreIndex = entry.indexOf('Impact Score');
      if (impactScoreIndex === -1) return entry;
      
      const citationLine = entry.substring(0, impactScoreIndex).trim();
      
      // Extract the author part (everything after the number and before the first period)
      const authorMatch = citationLine.match(/^\d+\.\s+([^\.]+)(?=\.)/);
      if (!authorMatch) return entry;
      
      // Get the rest of the citation (everything after the author's name)
      const authorText = authorMatch[1];
      const authorEndIndex = citationLine.indexOf(authorText) + authorText.length;
      const restOfCitation = citationLine.substring(authorEndIndex);
      
      // Extract the Impact Score part
      const impactScoreEndIndex = entry.indexOf('\n', impactScoreIndex);
      const impactScoreLine = impactScoreEndIndex !== -1 
        ? entry.substring(impactScoreIndex, impactScoreEndIndex) 
        : entry.substring(impactScoreIndex);
      
      // Extract the score value
      const scoreMatch = impactScoreLine.match(/Impact Score \(0-100\):\s*(\d+)/);
      if (!scoreMatch) return entry;
      const score = scoreMatch[1];
      
      // Extract the description (everything after the Impact Score line)
      const description = impactScoreEndIndex !== -1 
        ? entry.substring(impactScoreEndIndex).trim() 
        : '';
      
      // Format with proper HTML
      return `<div class="mb-4">
  <p><strong>${refMatch[1]}.</strong> <strong>${authorText}</strong>${restOfCitation}</p>
  <p><strong>Impact Score(0-100):</strong> ${score}</p>
  <p>${description}</p>
</div>`;
    });
    
    return processedEntries.join('\n');
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
        <img src="/scientific_investigation_chat.png" alt="Core Story Chat" className="w-18 h-18" />
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
              <div
                className="text-gray-800"
                dangerouslySetInnerHTML={{ __html: result }}
              />
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
