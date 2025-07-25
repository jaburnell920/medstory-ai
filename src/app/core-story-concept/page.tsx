'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

export default function CoreStoryConcept() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [context, setContext] = useState({
    disease: '',
    drug: '',
    audience: '',
    length: '',
  });

  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([
    {
      role: 'assistant',
      content: 'What is the disease state?',
    },
  ]);

  const handleReset = () => {
    setStep(0);
    setInput('');
    setLoading(false);
    setResult('');
    setContext({
      disease: '',
      drug: '',
      audience: '',
      length: '',
    });
    setMessages([
      {
        role: 'assistant',
        content: 'What is the disease state?',
      },
    ]);
  };

  const questions = [
    'What is the disease state?',
    'What is the therapeutic intervention?',
    'Who is the audience?',
    'Would you like a concise or full-length Core Story Concept?',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    const trimmed = input.trim();

    // Check if we're in the post-generation phase
    if (result && messages.length > 0 && messages[messages.length - 1].content === 'Would you like to modify this Core Story Concept or create a new one?') {
      setLoading(true);
      
      if (trimmed.toLowerCase().includes('modify')) {
        // Ask for modifications
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: 'What modifications would you like to make?' 
        }]);
        setLoading(false);
        return;
      } 
      else if (trimmed.toLowerCase().includes('new')) {
        // Generate a new concept
        try {
          const res = await fetch('/api/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a multidisciplinary medical storyteller hired to create a Core Story Concept.',
                },
                {
                  role: 'user',
                  content: `Create a new Core Story Concept for ${context.drug} in ${context.disease} for the target audience ${context.audience} with a length of ${context.length}.`,
                },
              ],
              disease: context.disease,
              drug: context.drug,
              audience: context.audience,
              length: context.length,
            }),
          });

          const data = await res.json();
          setResult(data.result);
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: 'I\'ve created a new Core Story Concept. Would you like to modify this Core Story Concept or create a new one?' 
          }]);
        } catch (err) {
          toast.error('Something went wrong.');
          console.error(err);
        } finally {
          setLoading(false);
        }
        return;
      }
      else if (trimmed.toLowerCase().includes('no')) {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: 'Got it. Would you like to see a table with all the Core Story Concept Candidates?' 
        }]);
        setLoading(false);
        return;
      }
      return;
    }
    
    // Check if we're in the table request phase
    if (result && messages.length > 0 && messages[messages.length - 1].content === 'Got it. Would you like to see a table with all the Core Story Concept Candidates?') {
      if (trimmed.toLowerCase().includes('yes')) {
        // Here we would normally create a table, but for now we'll just acknowledge
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: 'Here is a table with all the Core Story Concept Candidates.' 
        }]);
      }
      setLoading(false);
      return;
    }
    
    // Check if we're in the modification phase
    if (result && messages.length > 0 && messages[messages.length - 1].content === 'What modifications would you like to make?') {
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
                  'You are a multidisciplinary medical storyteller hired to create a Core Story Concept.',
              },
              {
                role: 'user',
                content: `Modify this Core Story Concept for ${context.drug} in ${context.disease} based on the following feedback: ${trimmed}. Keep the length at ${context.length}.`,
              },
              {
                role: 'assistant',
                content: result,
              },
            ],
            disease: context.disease,
            drug: context.drug,
            audience: context.audience,
            length: context.length,
          }),
        });

        const data = await res.json();
        setResult(data.result);
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: 'I\'ve modified the Core Story Concept. Would you like to modify this Core Story Concept or create a new one?' 
        }]);
      } catch (err) {
        toast.error('Something went wrong.');
        console.error(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Initial questionnaire flow
    if (step === 0) setContext((prev) => ({ ...prev, disease: trimmed }));
    if (step === 1) setContext((prev) => ({ ...prev, drug: trimmed }));
    if (step === 2) setContext((prev) => ({ ...prev, audience: trimmed }));
    if (step === 3) {
      // Process the length preference
      const lengthValue = trimmed.toLowerCase().includes('concise') ? '<25 words' : '40-60 words';
      setContext((prev) => ({ ...prev, length: lengthValue }));
    }

    if (step === 3) {
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
                  'You are a multidisciplinary medical storyteller hired to create a Core Story Concept.',
              },
              {
                role: 'user',
                content: `Create a Core Story Concept for ${context.drug} in ${context.disease} for the target audience ${context.audience} with a length of ${context.length}.`,
              },
            ],
            disease: context.disease,
            drug: context.drug,
            audience: context.audience,
            length: context.length,
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
    <PageLayout
      sectionIcon={
        <Image src="/core_story_chat.png" alt="Core Story Chat" width={72} height={72} className="w-18 h-18" />
      }
      sectionName="Core Story Concept"
      taskName="Create Core Story Concept options"
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
            showInput={true}
            placeholder="Type your response..."
            onReset={handleReset}
          />
        </div>

        {/* Result Section - Right Side */}
        {result && (
          <div className="flex-1 space-y-6">
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md space-y-6">
              <h2 className="text-xl font-bold text-blue-900">Core Story Concept</h2>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-gray-800 whitespace-pre-wrap">{result}</p>
              </div>
              <div className="mt-4">
                <button 
                  onClick={() => {
                    setMessages([
                      ...messages, 
                      { 
                        role: 'assistant', 
                        content: 'Would you like to modify this Core Story Concept or create a new one?' 
                      }
                    ]);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}