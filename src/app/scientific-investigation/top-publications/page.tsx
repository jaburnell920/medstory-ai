'use client';

import { useState } from 'react';
import SidebarMenu from '@/app/SidebarMenu';

export default function TopPublicationsPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Great. I will simulate an interview with an expert. Please provide the following information:\n\nWhich would you like to interview (pick one):\n• A specific individual - please provide the full name of the person\n• An expert in a particular field - please provide the field or specialization and if a specific experience or background is desired',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [expertInfo, setExpertInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);

    if (!interviewStarted) {
      // First response - store expert info and start interview
      setExpertInfo(input);
      setInterviewStarted(true);
      setLoading(true);

      try {
        const res = await fetch('/api/expert-interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'start',
            expertInfo: input,
          }),
        });
        const data = await res.json();

        setMessages([...newMessages, { role: 'assistant', content: data.result }]);
      } catch (err) {
        console.error('Error starting interview:', err);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Failed to start interview.' },
        ]);
      } finally {
        setLoading(false);
      }
    } else {
      // Continue interview
      setLoading(true);

      try {
        const res = await fetch('/api/expert-interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'continue',
            expertInfo: expertInfo,
            userMessage: input,
            conversationHistory: messages,
          }),
        });
        const data = await res.json();

        setMessages([...newMessages, { role: 'assistant', content: data.result }]);
      } catch (err) {
        console.error('Error continuing interview:', err);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Failed to continue interview.' },
        ]);
      } finally {
        setLoading(false);
      }
    }

    setInput('');
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
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-12">
        <h1 className="text-3xl font-extrabold text-[#063471] mb-10">
          Top N Most Important Thought Leaders
        </h1>

        {/* Expert Interview Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#063471] mb-4">
            Stakeholder Interviews - Simulate an Expert Interview
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Chat Interface */}
          <div className="bg-white border border-gray-300 shadow-md rounded-lg p-6 w-full lg:w-2/3 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className="w-full">
                {m.role === 'assistant' ? (
                  <div className="bg-white border border-gray-300 rounded-md shadow-sm">
                    <div className="bg-[#002F6C] text-white font-bold px-4 py-2 rounded-t-md">
                      <span className="text-[#35b4fc]">MEDSTORY</span>
                      <span className="text-[#ff914d]">AI</span>
                      {interviewStarted && <span className="ml-2 text-sm">(Expert Interview)</span>}
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

            <form onSubmit={handleSubmit} className="flex space-x-2 pt-2">
              <input
                type="text"
                className="flex-1 border rounded px-4 py-2 text-black"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  interviewStarted
                    ? 'Ask your question...'
                    : "Specify the expert you'd like to interview..."
                }
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

          {/* Instructions Panel */}
          <div className="flex-1 space-y-6">
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold text-[#063471] mb-4">Interview Guidelines</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Expert Types:</strong>
                </p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Specific individual (provide full name)</li>
                  <li>Expert in a field (specify field/specialization)</li>
                </ul>

                <p className="mt-4">
                  <strong>Interview Features:</strong>
                </p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Expert responds based on public materials</li>
                  <li>Conversational, professional tone</li>
                  <li>Expert will not ask follow-up questions</li>
                  <li>You control the interview direction</li>
                  <li>Expert may ask for clarification when needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
