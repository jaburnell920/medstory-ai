'use client';

import { useState } from 'react';
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
      setMessages([...newMessages, { role: 'assistant', content: 'Ok, here we go...' }]);
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
        <img src="/story_flow_map_chat.png" alt="Core Story Chat" className="w-18 h-18" />
      }
      sectionName="Story Flow Map"
      taskName="Create tension-resolution points"
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
            showInput={step <= questions.length - 1}
            placeholder="Type your response..."
            onReset={handleReset}
          />
        </div>

        {/* Result Section - Right Side */}
        {result && (
          <div className="flex-1 space-y-6">
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md space-y-6">
              <h2 className="text-xl font-bold text-blue-900">Core Story Concept Candidates</h2>
              {result.split('\n\n').map((block, i) => (
                <div key={i} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{block}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
