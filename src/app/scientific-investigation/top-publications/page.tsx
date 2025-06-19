'use client';

import { useState } from 'react';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

export default function TopPublicationsPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant' as const,
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

    const newMessages = [...messages, { role: 'user' as const, content: input }];
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
    <PageLayout
      sectionIcon="🎤"
      sectionName="Stakeholder Interviews"
      taskName="Simulated thought leader interview"
    >
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Chat Interface - Left Side */}
        <div className="w-full lg:w-2/3">
          <ChatInterface
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            loading={loading}
            placeholder={
              interviewStarted
                ? 'Ask your question...'
                : "Specify the expert you'd like to interview..."
            }
            removeExpertPrefix={true}
          />
        </div>

        {/* Instructions Panel - Right Side */}
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
    </PageLayout>
  );
}