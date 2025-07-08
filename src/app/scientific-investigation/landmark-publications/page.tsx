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

    // Clean up the content first
    let formatted = content
      .replace(/"/g, '')                // Remove quotes
      .replace(/\|/g, '')               // Remove vertical bars
      .replace(/Study Number|Citation|Title|Impact of Study|Summary|Significance/g, '') // Remove table headers
      .replace(/[-]{2,}/g, '')          // Remove table separators
      .replace(/(\d+)\.\s*/g, '\n$1. '); // Ensure each numbered item starts on a new line

    // Split the content into individual entries
    const entries = formatted.split(/\n(?=\d+\.\s+)/).filter(entry => entry.trim());
    
    // Process each entry with the required formatting
    const processedEntries = entries.map(entry => {
      // Split the entry into lines for processing
      const lines = entry.split('\n').filter(line => line.trim());
      if (lines.length < 2) return entry;
      
      // Process the citation line (first line)
      const citationLine = lines[0];
      
      // Extract reference number
      const refNumberMatch = citationLine.match(/^(\d+)\./);
      if (!refNumberMatch) return entry;
      const refNumber = refNumberMatch[1];
      
      // Extract author part (everything up to the first period after the reference number)
      const authorMatch = citationLine.match(/^\d+\.\s+([^\.]+)(?=\.)/);
      if (!authorMatch) return entry;
      const authorText = authorMatch[1];
      
      // Get the rest of the citation (everything after the author)
      const authorEndPos = citationLine.indexOf(authorText) + authorText.length;
      const citationText = citationLine.substring(authorEndPos);
      
      // Find the Impact Score line
      const impactScoreLine = lines.find(line => line.includes('Impact Score'));
      if (!impactScoreLine) return entry;
      
      // Extract the score
      const scoreMatch = impactScoreLine.match(/Impact Score \(0-100\):\s*(\d+)/);
      if (!scoreMatch) return entry;
      const score = scoreMatch[1];
      
      // Get the description (all remaining lines after the Impact Score line)
      const impactScoreIndex = lines.indexOf(impactScoreLine);
      const descriptionLines = lines.slice(impactScoreIndex + 1);
      const description = descriptionLines.join(' ').trim();
      
      // Format the entry with proper HTML
      return `<p><strong>${refNumber}.</strong> <strong>${authorText}</strong>${citationText}</p>
<p><strong>Impact Score(0-100):</strong> ${score}</p>
<p>${description}</p>`;
    });
    
    // Join all processed entries
    return processedEntries.join('\n\n');
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
                className="text-gray-800 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: result }}
              />
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
