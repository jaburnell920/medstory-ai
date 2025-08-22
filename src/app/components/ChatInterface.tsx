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
  interviewStarted?: boolean;
}

// Loading dots animation is now handled directly in the ChatInterface component

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
  interviewStarted = false,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [dots, setDots] = useState('.');

  // Loading dots animation
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setDots((prevDots) => {
          if (prevDots === '.') return '..';
          if (prevDots === '..') return '...';
          return '.';
        });
      }, 500); // Change dots every 500ms

      return () => clearInterval(interval);
    }
  }, [loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear input when loading state changes to true
  useEffect(() => {
    if (loading) {
      setInput('');
    }
  }, [loading, setInput]);

  // Dynamic placeholder based on loading state
  const getPlaceholder = () => {
    if (loading) {
      return `Thinking${dots}`;
    }
    return placeholder;
  };

  const formatContent = (content: string, messageIndex: number) => {
    // Find the first expert message (after the transition message)
    const isFirstExpertMessage = interviewStarted && messageIndex > 0 && 
      messages[messageIndex - 1]?.content?.includes("Thank you. I will now start the simulated interview") &&
      content.startsWith('EXPERT:');

    if (removeExpertPrefix && !isFirstExpertMessage) {
      content = content.replace(/^Expert:\s*/gm, '');
    }

    // Remove any "Assistant:" prefixes from MEDSTORYAI responses
    content = content.replace(/^Assistant:\s*/gm, '');

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
      <div className="w-full flex flex-col min-h-0 mr-12">
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
                    {formatContent(m.content, i)}
                    {loading && i === messages.length - 1 && m.role === 'assistant' && (
                      <span>{dots}</span>
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
                    onChange={(e) => {
                      // If AI is thinking and user starts typing, clear the input first
                      if (loading && input === '') {
                        // This ensures the first character typed replaces the empty input
                        setInput(e.target.value);
                      } else {
                        setInput(e.target.value);
                      }
                    }}
                    onFocus={() => {
                      // Clear input when user focuses on the input field while AI is thinking
                      if (loading) {
                        setInput('');
                      }
                    }}
                    placeholder={getPlaceholder()}
                    disabled={interviewEnded}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading || interviewEnded || !input.trim()}
                >
                  Send
                </button>
              </form>

              {onReset && (
                <div className="flex justify-start pt-24 space-x-4">
                  <button
                    type="button"
                    onClick={onReset}
                    className="flex items-center px-4 py-2 bg-[#d3875f] text-white rounded-lg hover:bg-[#773f21] transition-colors duration-200 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={interviewEnded}
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
