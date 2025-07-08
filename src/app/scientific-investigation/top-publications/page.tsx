'use client';

import { useState } from 'react';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

export default function TopPublicationsPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([
    {
      role: 'assistant',
      content:
        'Who would you like to simulate an interview with:\n\nA specific person...Please provide the full name and their affiliation\nA scientific expert...Please provide the scientific area of expertise',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [expertInfo, setExpertInfo] = useState('');

  const handleReset = () => {
    setInput('');
    setMessages([
      {
        role: 'assistant',
        content:
          'Who would you like to simulate an interview with:\n\nA specific person...Please provide the full name and their affiliation\nA scientific expert...Please provide the scientific area of expertise',
      },
    ]);
    setLoading(false);
    setInterviewStarted(false);
    setExpertInfo('');
  };

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
      sectionIcon={
        <img src="/stakeholder_interviews_chat.png" alt="Core Story Chat" className="w-18 h-18" />
      }
      sectionName="Stakeholder Interviews"
      taskName="Simulated thought leader interview"
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
            placeholder={
              interviewStarted
                ? 'Ask your question...'
                : "Specify the expert you'd like to interview..."
            }
            removeExpertPrefix={true}
            onReset={handleReset}
          />
        </div>
      </div>
    </PageLayout>
  );
}
