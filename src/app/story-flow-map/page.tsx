'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

export default function StoryFlowMap() {
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

  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([]);

  // Check for saved Core Story Concept on component mount
  useEffect(() => {
    const savedConcept = localStorage.getItem('selectedCoreStoryConceptData');
    if (savedConcept) {
      const conceptData = JSON.parse(savedConcept);
      const defaultCoreStoryConcept = "Plaque inflammation drives CV events. Direct and safe ways to reduce plaque inflammation are needed. Orticumab is a plaque-targeted anti-inflammatory therapy. By inhibiting pro-inflammatory macrophages within plaques, this new approach has the potential to reduce CV risk on top of current standard of care.";
      
      setMessages([
        {
          role: 'assistant',
          content: `Do you want to use the currently selected Core Story Concept or provide a new one?`,
        },
      ]);
    } else {
      // No saved concept, start with the default question
      const defaultCoreStoryConcept = "Plaque inflammation drives CV events. Direct and safe ways to reduce plaque inflammation are needed. Orticumab is a plaque-targeted anti-inflammatory therapy. By inhibiting pro-inflammatory macrophages within plaques, this new approach has the potential to reduce CV risk on top of current standard of care.";
      
      setMessages([
        {
          role: 'assistant',
          content: `Do you want to use the currently selected Core Story Concept or provide a new one?`,
        },
      ]);
    }
  }, []);

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
    
    const defaultCoreStoryConcept = "Plaque inflammation drives CV events. Direct and safe ways to reduce plaque inflammation are needed. Orticumab is a plaque-targeted anti-inflammatory therapy. By inhibiting pro-inflammatory macrophages within plaques, this new approach has the potential to reduce CV risk on top of current standard of care.";
    
    setMessages([
      {
        role: 'assistant',
        content: `Do you want to use the currently selected Core Story Concept or provide a new one?`,
      },
    ]);
  };

  const questions = [
    'What is your Audience?',
    'What is your Intervention Name?',
    'What is the Disease or Condition?',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    const trimmed = input.trim();

    // Handle Core Story Concept selection
    if (!conversationStarted && step === 0) {
      if (trimmed.toLowerCase().includes('currently selected') || trimmed.toLowerCase().includes('current')) {
        const defaultCoreStoryConcept = "Plaque inflammation drives CV events. Direct and safe ways to reduce plaque inflammation are needed. Orticumab is a plaque-targeted anti-inflammatory therapy. By inhibiting pro-inflammatory macrophages within plaques, this new approach has the potential to reduce CV risk on top of current standard of care.";
        setContext((prev) => ({ ...prev, coreStoryConcept: defaultCoreStoryConcept }));
        setStep(1);
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: questions[0], // "What is your Audience?"
          },
        ]);
        return;
      } else if (trimmed.toLowerCase().includes('new') || trimmed.toLowerCase().includes('provide')) {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'Please enter the Core Story Concept you\'d like to use to guide the story flow.',
          },
        ]);
        setStep(-1); // Special step for manual CSC entry
        return;
      }
    }

    // Handle manual Core Story Concept entry
    if (step === -1) {
      setContext((prev) => ({ ...prev, coreStoryConcept: trimmed }));
      setStep(1);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: questions[0], // "What is your Audience?"
        },
      ]);
      return;
    }

    // Handle remaining questions
    if (!conversationStarted) {
      if (step === 1) setContext((prev) => ({ ...prev, audience: trimmed }));
      if (step === 2) setContext((prev) => ({ ...prev, interventionName: trimmed }));

      if (step === 3) {
        setContext((prev) => ({ ...prev, diseaseCondition: trimmed }));
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'Creating your Story Flow Outline...',
          },
        ]);
        setLoading(true);

        try {
          const res = await fetch('/api/story-flow-outline', {
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
          
          setMessages((msgs) => [
            ...msgs.slice(0, -1), // Remove "Creating..." message
            {
              role: 'assistant',
              content: data.result,
            },
          ]);

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
      if (nextStep <= questions.length) {
        setMessages((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: questions[nextStep - 1],
          },
        ]);
      }
    } else {
      // Handle ongoing conversation
      setLoading(true);

      try {
        const res = await fetch('/api/story-flow-outline', {
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

        // Add AI response to chat
        setMessages((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: data.result,
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
            showInput={!conversationStarted ? step <= questions.length : true}
            placeholder="Type your response..."
            onReset={handleReset}
          />
        </div>
      </div>
    </PageLayout>
  );
}