'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';

import Link from 'next/link';
import clsx from 'clsx';

export default function Dashboard() {
  const pathname = usePathname();

  const saveResult = async () => {
    try {
      const res = await fetch('/api/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: messages.map((m) => m.content).join('\n') }),
      });

      if (res.ok) {
        toast.success('Result saved successfully!');
      } else {
        throw new Error('Failed to save result');
      }
    } catch (err) {
      toast.error('Failed to save result. Please try again.');
      console.error(err);
    }
  };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Please provide the following information in order to proceed:\n• Drug or intervention\n• Disease or condition\n• Audience\n• Intensity of emotion/creativity (low, medium, or high)`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'gathering-info' | 'asking-count' | 'showing-result'>(
    'gathering-info'
  );
  const [userContext, setUserContext] = useState('');
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    try {
      if (step === 'gathering-info') {
        setUserContext(input);
        setMessages([
          ...updatedMessages,
          {
            role: 'assistant',
            content: `Great. Thank you for providing that info.\nHow many Core Story Concept Candidates would you like me to generate?`,
          },
        ]);
        setStep('asking-count');
      } else if (step === 'asking-count') {
        setMessages([
          ...updatedMessages,
          {
            role: 'assistant',
            content: `Ok, here we go...`,
          },
        ]);

        // Call OpenAI with combined context
        const res = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You're an expert medical strategist helping generate core story concept candidates.`,
              },
              {
                role: 'user',
                content: `Here is the context:\n${userContext}\nGenerate ${input} core story concept candidates.`,
              },
            ],
          }),
        });

        const data = await res.json();
        setResult(data.result);
        setStep('showing-result');
      }
    } catch (err) {
      toast.error('Something went wrong.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const linkClass =
    'text-gray-200 hover:text-orange-300 hover:underline transition-all duration-200';
  const selectedLinkClass = 'text-orange-400 underline font-semibold';

  return (
    <div className="flex min-h-screen text-black">
      {/* Sidebar */}
      <aside className="w-72 bg-[#002F6C] text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-4">
          <span style={{ color: '#35b4fc' }}>MEDSTORY</span>
          <span style={{ color: '#ff914d' }}>AI</span>
        </h2>
        <nav className="flex flex-col space-y-6 text-sm">
          <div>
            <p className="font-bold text-white mb-1">🔬 Scientific Investigation</p>
            <ul className="ml-4 space-y-1 text-gray-200">
              <li>
                <Link className={linkClass} href="/scientific-investigation/landmark-publications">
                  Find landmark publications
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/scientific-investigation/top-publications">
                  Top N most important publications
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/scientific-investigation/thought-leaders">
                  Top N most important thought leaders
                </Link>
              </li>
              <li>
                <Link
                  className={clsx(linkClass, 'text-blue-300')}
                  href="/scientific-investigation/more"
                >
                  More...
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-white mb-1">🎤 Stakeholder Interviews</p>
            <ul className="ml-4 space-y-1 text-gray-200">
              <li>
                <Link className={linkClass} href="/stakeholder-interviews/questions">
                  Suggested questions for thought leader interviews
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/stakeholder-interviews/analyze-transcript">
                  Analyze thought leader interview transcript
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/stakeholder-interviews/simulated-interview">
                  Simulated thought leader interview
                </Link>
              </li>
              <li>
                <Link
                  className={clsx(linkClass, 'text-blue-300')}
                  href="/scientific-investigation/more"
                >
                  More...
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-white mb-1">🎯 Core Story Concept</p>
            <ul className="ml-4 space-y-1 text-gray-200">
              <li>
                <Link
                  href="/dashboard"
                  className={clsx(linkClass, pathname === '/dashboard' && selectedLinkClass)}
                >
                  Core Story Concept creation
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/core-story-concept/optimization">
                  Core Story Concept optimization
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/core-story-concept/evaluation">
                  Core Story Concept evaluation
                </Link>
              </li>
              <li>
                <Link
                  className={clsx(linkClass, 'text-blue-300')}
                  href="/scientific-investigation/more"
                >
                  More...
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-white mb-1">🗺️ Story Flow Map</p>
            <ul className="ml-4 space-y-1 text-gray-200">
              <li>
                <Link className={linkClass} href="/story-flow-map/tension-resolution-generation">
                  Tension-Resolution Point generation
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/story-flow-map/tension-resolution-optimization">
                  Tension-Resolution Point optimization
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/story-flow-map/generation-optimization">
                  Story Flow Map generation & optimization
                </Link>
              </li>
              <li>
                <Link
                  className={clsx(linkClass, 'text-blue-300')}
                  href="/scientific-investigation/more"
                >
                  More...
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-white mb-1">📽️ MEDSTORY Slide Presentation</p>
            <ul className="ml-4 space-y-1 text-gray-200">
              <li>
                <Link className={linkClass} href="/slide-presentation/deck-generation">
                  MEDSTORY deck generation
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/slide-presentation/deck-optimization">
                  MEDSTORY deck optimization
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/slide-presentation/deck-evaluation">
                  MEDSTORY deck evaluation
                </Link>
              </li>
              <li>
                <Link
                  className={clsx(linkClass, 'text-blue-300')}
                  href="/scientific-investigation/more"
                >
                  More...
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-12">
        <h1 className="text-3xl font-extrabold text-[#063471] mb-10">
          Welcome to Core Story Concept creation!
        </h1>
        <p className="text-sm text-gray-600 mb-10">
          <strong>MEDSTORYmake</strong> helps you explore the big idea you want to communicate to
          your target audience.
        </p>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Chat Section */}
          <div className="bg-white border border-gray-300 shadow-md rounded-lg p-6 w-full lg:w-1/2 space-y-4">
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className="w-full max-w-full">
                  {m.role === 'assistant' ? (
                    <div className="bg-white rounded-lg border border-gray-300 shadow-md w-full">
                      <div className="bg-[#002F6C] text-white font-bold rounded-t-lg px-4 py-2">
                        <span className="text-[#35b4fc]">MEDSTORY</span>
                        <span className="text-[#ff914d]">AI</span>
                      </div>
                      <div className="px-4 py-3 text-gray-800 whitespace-pre-wrap">{m.content}</div>
                    </div>
                  ) : (
                    <div className="bg-gray-200 text-black rounded-lg px-4 py-3 self-end w-fit max-w-[90%] ml-auto">
                      <div className="text-sm font-semibold text-gray-700 mb-1">You</div>
                      <div className="whitespace-pre-wrap">{m.content}</div>
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

          {/* Right Column: Result */}
          <div className="flex-1 space-y-6">
            {step === 'showing-result' && (
              <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md space-y-6">
                <h2 className="text-xl font-bold text-blue-900">Core Story Concept Candidates</h2>
                {result.split('\n\n').map((block, i) => (
                  <div key={i} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{block}</p>
                  </div>
                ))}
                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 border border-blue-600 text-blue-600 font-semibold rounded hover:bg-blue-50 transition"
                    onClick={saveResult}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save Option */}
          {/* <div className="flex-1 space-y-6">
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md space-y-6">
              <h2 className="text-xl font-bold text-blue-900">Chat Summary</h2>
              <p className="text-gray-600 text-sm">
                This summary will represent the current conversation. Click below to save.
              </p>
              <button
                className="px-4 py-2 border border-blue-600 text-blue-600 font-semibold rounded hover:bg-blue-50 transition"
                onClick={saveResult}
              >
                Save
              </button>
            </div>
          </div> */}
        </div>
      </main>
    </div>
  );
}
