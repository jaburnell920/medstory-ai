'use client';

import { useState } from 'react';
import SidebarMenu from '@/app/SidebarMenu';
import toast from 'react-hot-toast';

const questions = [
  'What is your topic? (Please be specific)',
  'For studies published after what year? (year)',
  'Do you want classic landmark studies, recent landmark studies, or both?',
  'Do you want to show all landmark studies or a specific number?',
  'Do you want a short summary of each study? (y/n)',
  'Do you want a short explanation of why it’s considered a landmark study? (y/n)',
  'Do you want it to sort studies from most to least impactful? (y/n)',
];

export default function LandmarkPublicationsPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'OK, before we get started, please provide the information below. (Please answer each question one at a time):\n\n1. ' +
        questions[0],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    if (step < questions.length - 1) {
      setAnswers([...answers, input]);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `${step + 2}. ${questions[step + 1]}` },
      ]);
      setStep(step + 1);
    } else {
      setAnswers([...answers, input]);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Thanks. Generating results...' },
      ]);
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
        setResult(data.result);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to load results.' }]);
      } finally {
        setLoading(false);
      }
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
        <nav className="flex flex-col space-y-6 text-sm">
          <SidebarMenu />
          {/* Include the full nav here from your Dashboard for consistency */}
          {/* For brevity, it's omitted in this example */}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-12">
        <h1 className="text-3xl font-extrabold text-[#063471] mb-10">Find Landmark Publications</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Chat Interface */}
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

          {/* Result Table */}
          {result && (
            <div className="flex-1 space-y-6">
              <div
                className="bg-white border border-gray-300 p-6 rounded-lg shadow-md"
                dangerouslySetInnerHTML={{ __html: result }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
