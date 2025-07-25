'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

export default function TensionResolution() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [context, setContext] = useState({
    coreStoryConcept: '',
    audience: '',
    interventionName: '',
    diseaseCondition: '',
  });

  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([
    {
      role: 'assistant',
      content:
        'What is your Core Story Concept? (The big scientific idea that is driving the story flow as a whole and that the audience must remember, believe in, be persuaded by and that the entire story flow leads up to)',
    },
  ]);

  const handleReset = () => {
    setStep(0);
    setInput('');
    setLoading(false);
    setResult('');
    setConversationStarted(false);
    setContext({
      coreStoryConcept: '',
      audience: '',
      interventionName: '',
      diseaseCondition: '',
    });
    setMessages([
      {
        role: 'assistant',
        content:
          'What is your Core Story Concept? (The big scientific idea that is driving the story flow as a whole and that the audience must remember, believe in, be persuaded by and that the entire story flow leads up to)',
      },
    ]);
  };

  const questions = [
    'What is your Core Story Concept? (The big scientific idea that is driving the story flow as a whole and that the audience must remember, believe in, be persuaded by and that the entire story flow leads up to)',
    'Who is your Audience? (The type of people in the audience, e.g., PCPs, academics neurologists, cardiologists)',
    'What is your Intervention Name? (A drug, device, or biotechnology that is given to a person to improve or cure their disease or condition)',
    'What is the Disease or Condition? (Clinical arena)',
  ];

  // Function to separate content from questions in AI response
  const parseAIResponse = (response: string) => {
    // Look for questions that should appear in chat
    const questionPatterns = [
      /Would you like.*?\?/gi,
      /Do you want.*?\?/gi,
      /What.*?would you like.*?\?/gi,
      /How.*?would you like.*?\?/gi,
      /Which.*?would you prefer.*?\?/gi,
      /are you satisfied.*?\?/gi,
      /What modifications.*?\?/gi,
    ];

    let content = response;
    let question = '';

    // Split response into lines to better handle formatting
    const lines = response.split('\n');
    const contentLines = [];
    let foundQuestion = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line contains a question
      let isQuestion = false;
      for (const pattern of questionPatterns) {
        if (pattern.test(line)) {
          question = line;
          isQuestion = true;
          foundQuestion = true;
          break;
        }
      }
      
      // If we haven't found a question yet, or this isn't a question line, add to content
      if (!isQuestion && !foundQuestion) {
        contentLines.push(lines[i]);
      }
    }

    // If no question found in individual lines, check the entire response
    if (!question) {
      for (const pattern of questionPatterns) {
        const matches = response.match(pattern);
        if (matches && matches.length > 0) {
          question = matches[matches.length - 1];
          content = response.replace(question, '').trim();
          break;
        }
      }
    } else {
      content = contentLines.join('\n').trim();
    }

    return { content: content.trim(), question: question.trim() };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    const trimmed = input.trim();

    // Handle initial setup questions
    if (!conversationStarted) {
      if (step === 0) setContext((prev) => ({ ...prev, coreStoryConcept: trimmed }));
      if (step === 1) setContext((prev) => ({ ...prev, audience: trimmed }));
      if (step === 2) setContext((prev) => ({ ...prev, interventionName: trimmed }));

      if (step === 3) {
        setContext((prev) => ({ ...prev, diseaseCondition: trimmed }));
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'Creating your Story Flow Outline…',
          },
        ]);
        setLoading(true);

        try {
          const res = await fetch('/api/tension-resolution', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'start',
              coreStoryConcept: context.coreStoryConcept,
              audience: context.audience,
              interventionName: context.interventionName,
              diseaseCondition: trimmed,
            }),
          });

          const data = await res.json();
          const { content, question } = parseAIResponse(data.result);
          
          if (content) {
            setResult(content);
          }
          
          if (question) {
            setMessages((msgs) => [
              ...msgs.slice(0, -1), // Remove "Creating..." message
              {
                role: 'assistant',
                content: question,
              },
            ]);
          }
          
          setConversationStarted(true);
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
    } else {
      // Handle ongoing conversation
      setLoading(true);
      
      try {
        const res = await fetch('/api/tension-resolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'continue',
            coreStoryConcept: context.coreStoryConcept,
            audience: context.audience,
            interventionName: context.interventionName,
            diseaseCondition: context.diseaseCondition,
            userMessage: trimmed,
            conversationHistory: newMessages,
          }),
        });

        const data = await res.json();
        const { content, question } = parseAIResponse(data.result);
        
        // Update result if there's substantial content
        if (content && content.length > 50) {
          setResult(content);
        }
        
        // Add AI response to chat
        const responseContent = question || data.result;
        setMessages((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: responseContent,
          },
        ]);
        
      } catch (err) {
        toast.error('Something went wrong.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <PageLayout
      sectionIcon={
        <Image
          src="/story_flow_map_chat.png"
          alt="Story Flow Map"
          width={72}
          height={72}
          className="w-18 h-18"
        />
      }
      sectionName="Story Flow Map"
      taskName="Create story flow outline"
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
            showInput={!conversationStarted ? step <= questions.length - 1 : true}
            placeholder="Type your response..."
            onReset={handleReset}
          />
        </div>

        {/* Result Section - Right Side */}
        {result && (
          <div className="flex-1 space-y-6">
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md space-y-6">
              <h2 className="text-xl font-bold text-blue-900">
                Attack Point & Tension-Resolution Points
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <pre className="text-gray-800 whitespace-pre-wrap font-sans">{result}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
