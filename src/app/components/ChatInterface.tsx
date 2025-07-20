'use client';

import { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  showInput?: boolean;
  placeholder?: string;
  removeExpertPrefix?: boolean;
  onReset?: () => void;
  onEndInterview?: () => void;
  interviewEnded?: boolean;
}

// Loading dots animation component
const LoadingDots = () => {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => {
        if (prevDots === '.') return '..';
        if (prevDots === '..') return '...';
        return '.';
      });
    }, 500); // Change dots every 500ms

    return () => clearInterval(interval);
  }, []);

  return <span>{dots}</span>;
};

export default function ChatInterface({
  messages,
  input,
  setInput,
  onSubmit,
  loading,
  showInput = true,
  placeholder = 'Type your response...',
  removeExpertPrefix = false,
  onReset,
  onEndInterview,
  interviewEnded = false,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Dynamic placeholder based on loading state
  const getPlaceholder = () => {
    if (loading) {
      return 'thinking...';
    }
    return placeholder;
  };

  const formatContent = (content: string) => {
    if (removeExpertPrefix) {
      content = content.replace(/^Expert:\s*/gm, '');
    }

    // Format numbered responses - each number on new line, remove vertical bars and quotes
    content = content.replace(/(\d+)\.\s*/g, '\n$1. ');
    content = content.replace(/\|/g, '');
    content = content.replace(/"/g, '');

    // Remove leading and trailing whitespace to eliminate empty lines
    content = content.trim();

    return content;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Chat Area - Left Side */}
      <div className="w-full lg:w-3/5 flex flex-col min-h-0">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className="w-full">
              {m.role === 'assistant' ? (
                <div className="w-full bg-white rounded-md shadow-md overflow-hidden">
                  <div className="bg-[#fab31c] text-white px-4 py-2">
                    <span className="text-white">MEDSTORY</span>
                    <span className="text-white font-bold">AI</span>
                  </div>
                  <div className="px-4 py-3 whitespace-pre-wrap text-gray-800">
                    {formatContent(m.content)}
                    {loading && i === messages.length - 1 && m.role === 'assistant' && (
                      <LoadingDots />
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full bg-white rounded-md shadow-md overflow-hidden">
                  <div className="bg-[#115dae] text-white px-4 py-2">YOU</div>
                  <div className="px-4 py-3 whitespace-pre-wrap text-gray-800">{m.content}</div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 pt-4">
          {showInput && (
            <>
              <form onSubmit={onSubmit} className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    className="w-full border rounded px-4 py-2 text-black shadow-md"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={getPlaceholder()}
                    disabled={loading || interviewEnded}
                  />
                  {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <LoadingDots />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading || interviewEnded}
                >
                  Send
                </button>
              </form>

              {onReset && messages.length > 1 && (
                <div className="flex justify-start pt-24 space-x-4">
                  <button
                    type="button"
                    onClick={onReset}
                    className="flex items-center px-4 py-2 bg-[#d3875f] text-white rounded-lg hover:bg-[#773f21] transition-colors duration-200 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={loading || interviewEnded}
                  >
                    START OVER
                  </button>
                  
                  {onEndInterview && !interviewEnded && (
                    <button
                      type="button"
                      onClick={onEndInterview}
                      className="flex items-center px-4 py-2 bg-[#115dae] text-white rounded-lg hover:bg-[#0a3b7a] transition-colors duration-200 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      END INTERVIEW
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
