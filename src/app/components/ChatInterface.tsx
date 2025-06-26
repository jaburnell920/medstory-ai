'use client';

import { useEffect, useRef } from 'react';

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
}

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
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatContent = (content: string) => {
    if (removeExpertPrefix) {
      content = content.replace(/^Expert:\s*/gm, '');
    }

    // Format numbered responses - each number on new line, remove vertical bars and quotes
    content = content.replace(/(\d+)\.\s*/g, '\n$1. ');
    content = content.replace(/\|/g, '');
    content = content.replace(/"/g, '');

    return content;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12 h-full">
      {/* Chat Area - Left Side */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-0">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className="w-full">
              {m.role === 'assistant' ? (
                <div className="w-full bg-white rounded-md shadow-md overflow-hidden">
                  <div className="bg-[#002F6C] text-white px-4 py-2">
                    <span className="text-white">MEDSTORY</span>
                    <span className="text-white font-bold">AI</span>
                  </div>
                  <div className="px-4 py-3 whitespace-pre-wrap text-gray-800">
                    {formatContent(m.content)}
                  </div>
                </div>
              ) : (
                <div className="w-full bg-white rounded-md shadow-md overflow-hidden">
                  <div className="bg-gray-400 text-white px-4 py-2">YOU</div>
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
                <input
                  type="text"
                  className="flex-1 border rounded px-4 py-2 text-black shadow-md"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-md"
                  disabled={loading}
                >
                  {loading ? '...' : 'Send'}
                </button>
              </form>

              {onReset && messages.length > 1 && (
                <div className="flex justify-start pt-2">
                  <button
                    type="button"
                    onClick={onReset}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                    disabled={loading}
                  >
                    START OVER
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
