'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

export default function Dashboard() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [context, setContext] = useState({
    drug: '',
    disease: '',
    audience: '',
    intensity: '',
    count: '',
  });

  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([
    {
      role: 'assistant',
      content: 'What drug or intervention are you exploring today?',
    },
  ]);
  
  // Scroll to results section when result changes
  useEffect(() => {
    if (result) {
      // Use a longer delay to ensure content is fully rendered
      const timer = setTimeout(() => {
        const resultsContainer = document.querySelector('#results-section .overflow-y-auto');
        if (resultsContainer) {
          resultsContainer.scrollTop = resultsContainer.scrollHeight;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleReset = () => {
    setStep(0);
    setInput('');
    setLoading(false);
    setResult('');
    setContext({
      drug: '',
      disease: '',
      audience: '',
      intensity: '',
      count: '',
    });
    setMessages([
      {
        role: 'assistant',
        content: 'What drug or intervention are you exploring today?',
      },
    ]);
  };

  const questions = [
    'What drug or intervention are you exploring today?',
    'What disease or condition is being treated?',
    'Who is your target audience?',
    'What is the desired intensity of emotion/creativity (low, medium, or high)?',
    'How many Core Story Concept Candidates would you like me to generate?',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    const trimmed = input.trim();

    if (step === 0) setContext((prev) => ({ ...prev, drug: trimmed }));
    if (step === 1) setContext((prev) => ({ ...prev, disease: trimmed }));
    if (step === 2) setContext((prev) => ({ ...prev, audience: trimmed }));
    if (step === 3) setContext((prev) => ({ ...prev, intensity: trimmed }));

    if (step === 4) {
      setContext((prev) => ({ ...prev, count: trimmed }));
      setMessages([...newMessages, { role: 'assistant', content: 'Ok, here we go' }]);
      setLoading(true);

      try {
        const res = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful assistant helping generate Core Story Concept Candidates.',
              },
              {
                role: 'user',
                content: `Drug: ${context.drug}\nDisease: ${context.disease}\nAudience: ${context.audience}\nIntensity: ${context.intensity}\nGenerate ${trimmed} Core Story Concept Candidates.`,
              },
            ],
          }),
        });

        const data = await res.json();
        setResult(data.result);
      } catch (err) {
        toast.error('Something went wrong.');
        console.error(err);
      } finally {
        setLoading(false);
      }

      return;
    }

    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep < questions.length) {
      setMessages((msgs) => [
        ...msgs,
        {
          role: 'assistant',
          content: questions[nextStep],
        },
      ]);
    }
  };

  return (
    <PageLayout
      sectionIcon={
        <Image
          src="/story_flow_map_chat.png"
          alt="Core Story Chat"
          width={72}
          height={72}
          className="w-18 h-18"
        />
      }
      sectionName="Story Flow Map"
      taskName="Create story flow outline"
    >
      <div className="flex gap-2 h-full">
        {/* Chat Interface - Left Side */}
        <div className="w-1/2 h-full">
          <ChatInterface
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            loading={loading}
            showInput={step <= questions.length - 1}
            placeholder="Type your response..."
            onReset={handleReset}
          />
        </div>

        {/* Result Section - Right Side - Wider */}
        <div className="w-1/2 h-full" id="results-section">
          {result ? (
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex flex-col">
              <h2 className="text-xl font-bold text-blue-900 mb-4 flex-shrink-0">
                Core Story Concept Candidates
              </h2>
              <div className="space-y-6 overflow-y-auto flex-1">
                {result.split('\n\n').map((block, i) => (
                  <div key={i} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{block}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div></div>
            // <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex items-center justify-center">
            //   <p className="text-gray-500 text-center">
            //     Core Story Concept Candidates will appear here once generated
            //   </p>
            // </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
