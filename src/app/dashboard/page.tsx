'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import SidebarMenu from '../SidebarMenu';

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

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'What drug or intervention are you exploring today?',
    },
  ]);

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

    const userMsg = { role: 'user', content: input };
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
    <div className="flex min-h-screen text-black">
      {/* Sidebar */}
      <aside className="w-72 bg-[#002F6C] text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-4">
          <span style={{ color: '#35b4fc' }}>MEDSTORY</span>
          <span style={{ color: '#ff914d' }}>AI</span>
        </h2>
        <SidebarMenu />
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-12">
        <h1 className="text-3xl font-extrabold text-[#063471] mb-10">
          Welcome to Core Story Concept creation!
        </h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Chat Area */}
          <div className="bg-white border border-gray-300 shadow-md rounded-lg p-6 w-full lg:w-1/2 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className="w-full">
                {m.role === 'assistant' ? (
                  <div className="bg-white border border-gray-300 rounded-md shadow-sm">
                    <div className="bg-[#002F6C] text-white font-bold px-4 py-2 rounded-t-md">
                      <span className="text-[#35b4fc]">MEDSTORY</span>
                      <span className="text-[#ff914d]">AI</span>
                    </div>
                    <div className="px-4 py-3 whitespace-pre-wrap text-gray-800">{m.content}</div>
                  </div>
                ) : (
                  <div className="bg-gray-200 px-4 py-3 rounded-md text-black ml-auto w-fit max-w-[90%]">
                    <div className="text-sm font-semibold text-gray-700 mb-1">You</div>
                    {m.content}
                  </div>
                )}
              </div>
            ))}

            {step <= questions.length - 1 && (
              <form onSubmit={handleSubmit} className="flex space-x-2 pt-2">
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
            )}
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
