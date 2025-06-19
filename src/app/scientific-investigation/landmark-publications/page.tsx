'use client';

import { useState } from 'react';
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
    // Each number on new line, remove vertical bars and quotes
    // Format: authors (period) title (period) journal abbreviation (period) year (semicolon) volume number (colon) page range then new line and significance

    let formatted = content;

    // Remove quotes and vertical bars
    formatted = formatted.replace(/"/g, '');
    formatted = formatted.replace(/\|/g, '');

    // Ensure each numbered item starts on a new line
    formatted = formatted.replace(/(\d+)\.\s*/g, '\n$1. ');

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
          content: 'Thanks, Generated response will be on the right side of the screen',
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
      sectionIcon="🔬"
      sectionName="Scientific Investigation"
      taskName="Find landmark publications"
    >
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Chat Interface - Left Side */}
        <div className="w-full lg:w-1/2">
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
          <div className="flex-1 space-y-6">
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
