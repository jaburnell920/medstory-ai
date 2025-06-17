'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import clsx from 'clsx';
import SidebarMenu from '../SidebarMenu';

export default function Dashboard() {
  const pathname = usePathname();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({
    drug: '',
    disease: '',
    audience: '',
    intensity: '',
    count: '',
  });
  const [result, setResult] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'What drug or intervention are you exploring today?' },
  ]);

  const questions = [
    'What drug or intervention are you exploring today?',
    'What disease or condition is being treated?',
    'Who is your target audience?',
    'What is the desired intensity of emotion/creativity (low, medium, or high)?',
    'How many Core Story Concept Candidates would you like me to generate?',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    const trimmed = input.trim();

    if (step === 0) setContext((prev) => ({ ...prev, drug: trimmed }));
    else if (step === 1) setContext((prev) => ({ ...prev, disease: trimmed }));
    else if (step === 2) setContext((prev) => ({ ...prev, audience: trimmed }));
    else if (step === 3) setContext((prev) => ({ ...prev, intensity: trimmed }));
    else if (step === 4) {
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

    setStep((prev) => prev + 1);
    if (step < questions.length - 1) {
      setMessages((msgs) => [...msgs, { role: 'assistant', content: questions[step + 1] }]);
    }
    setInput('');
  };

  const linkClass =
    'text-gray-200 hover:text-orange-300 hover:underline transition-all duration-200';
  const selectedLinkClass = 'text-orange-400 underline font-semibold';

  return (
    <div className="flex min-h-screen text-black">
      <aside className="w-72 bg-[#002F6C] text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-4">
          <span style={{ color: '#35b4fc' }}>MEDSTORY</span>
          <span style={{ color: '#ff914d' }}>AI</span>
        </h2>
        <SidebarMenu />
      </aside>

      <main className="flex-1 bg-gray-50 p-12">
        <h1 className="text-3xl font-extrabold text-[#063471] mb-10">
          Welcome to Core Story Concept creation!
        </h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Chat Area */}
          <div className="bg-white border border-gray-300 shadow-md rounded-lg p-6 w-full lg:w-1/2 space-y-4">
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i}>
                  {m.role === 'assistant' ? (
                    <div className="bg-[#002F6C] text-white p-4 rounded-lg">{m.content}</div>
                  ) : (
                    <div className="bg-gray-200 p-4 rounded-lg text-black text-right">
                      {m.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex space-x-2 pt-4">
              <input
                type="text"
                className="flex-1 border rounded px-4 py-2 text-black"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response..."
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? '...' : 'Send'}
              </button>
            </form>
          </div>

          {/* Result Section */}
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
      </main>
    </div>
  );
}
