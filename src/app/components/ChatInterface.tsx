'use client';

import { useRef } from 'react';

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

  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

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
    <div className="flex flex-col lg:flex-row gap-12">
      {/* Chat Area - Left Side */}
      <div className="w-full lg:w-1/2 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className="w-full">
            {m.role === 'assistant' ? (
              <div className="bg-transparent">
                <div className="bg-[#002F6C] text-white font-bold px-4 py-2 rounded-t-md inline-block">
                  <span className="text-[#35b4fc]">MEDSTORY</span>
                  <span className="text-[#ff914d]">AI</span>
                </div>
                <div className="bg-white px-4 py-3 rounded-b-md rounded-tr-md shadow-md whitespace-pre-wrap text-gray-800">
                  {formatContent(m.content)}
                </div>
              </div>
            ) : (
              <div className="bg-gray-200 px-4 py-3 rounded-md text-black w-fit max-w-[90%]">
                <div className="text-sm font-semibold text-gray-700 mb-1">You</div>
                {m.content}
              </div>
            )}
          </div>
        ))}

        {onReset && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onReset}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 shadow-md text-sm"
              disabled={loading}
            >
              Reset Conversation
            </button>
          </div>
        )}

        {showInput && (
          <form onSubmit={onSubmit} className="flex space-x-2 pt-2">
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
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
