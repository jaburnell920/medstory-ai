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
  const [results, setResults] = useState<string[]>([]);
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
        'Do you want to use the currently selected Core Story Concept or provide a new one?\n\nCurrently selected: Plaque inflammation drives CV events. Direct and safe ways to reduce plaque inflammation are needed. Orticumab is a plaque-targeted anti-inflammatory therapy. By inhibiting pro-inflammatory macrophages within plaques, this new approach has the potential to reduce CV risk on top of current standard of care.',
    },
  ]);

  const handleReset = () => {
    setStep(0);
    setInput('');
    setLoading(false);
    setResults([]);
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
          'Do you want to use the currently selected Core Story Concept or provide a new one?\n\nCurrently selected: Plaque inflammation drives CV events. Direct and safe ways to reduce plaque inflammation are needed. Orticumab is a plaque-targeted anti-inflammatory therapy. By inhibiting pro-inflammatory macrophages within plaques, this new approach has the potential to reduce CV risk on top of current standard of care.',
      },
    ]);
  };

  // Function to render each section in separate blue boxes
  const renderSeparateBoxes = (content: string) => {
    const sections = [];
    
    // Split content by the NEW CONTENT separator to handle accumulated content
    const contentParts = content.split('---NEW CONTENT---');
    
    contentParts.forEach((part, partIndex) => {
      if (!part.trim()) return;
      
      const isNewContent = partIndex > 0;
      
      // Extract Attack Points (including those with NEW: prefix)
      const attackPointRegex = /(?:NEW:\s*)?Attack Point #\d+[\s\S]*?(?=(?:NEW:\s*)?Attack Point #\d+|\*\*Tension-Resolution #|Tension-Resolution #|\*\*Conclusion|Conclusion|\*\*References|References|Would you|---NEW CONTENT---|$)/gi;
      let attackPointMatch;
      while ((attackPointMatch = attackPointRegex.exec(part)) !== null) {
        if (attackPointMatch[0].trim()) {
          const attackPointContent = attackPointMatch[0].trim();
          const hasNewPrefix = attackPointContent.includes('NEW:');
          sections.push({
            title: (isNewContent || hasNewPrefix) ? 'New Attack Point' : 'Attack Point',
            content: hasNewPrefix ? attackPointContent.replace('NEW:', '').trim() : attackPointContent
          });
        }
      }
      
      // Extract individual Tension-Resolution Points
      const tensionResolutionRegex = /(?:\*\*)?Tension-Resolution #\d+(?:\*\*)?:?[\s\S]*?(?=(?:\*\*)?Tension-Resolution #\d+(?:\*\*)?|\*\*Conclusion|Conclusion|\*\*References|References|Would you|---NEW CONTENT---|$)/gi;
      let match;
      while ((match = tensionResolutionRegex.exec(part)) !== null) {
        if (match[0].trim()) {
          const tensionContent = match[0].trim();
          // Extract the number from the tension-resolution point
          const numberMatch = tensionContent.match(/Tension-Resolution #(\d+)/i);
          const pointNumber = numberMatch ? numberMatch[1] : '';
          sections.push({
            title: `Tension-Resolution Point ${pointNumber}`,
            content: tensionContent
          });
        }
      }
      
      // Extract Conclusion
      const conclusionMatch = part.match(/(?:\*\*)?Conclusion(?:\*\*)?[\s\S]*?(?=\*\*References|References|Would you|---NEW CONTENT---|$)/i);
      if (conclusionMatch && conclusionMatch[0].trim()) {
        sections.push({
          title: 'Conclusion',
          content: conclusionMatch[0].trim()
        });
      }
      
      // Extract References
      const referencesMatch = part.match(/(?:\*\*)?References(?:\*\*)?[\s\S]*?(?=Would you|---NEW CONTENT---|$)/i);
      if (referencesMatch && referencesMatch[0].trim()) {
        sections.push({
          title: 'References',
          content: referencesMatch[0].trim()
        });
      }
    });
    
    // If no sections were found, add the entire content as one box
    if (sections.length === 0) {
      return (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <pre className="text-gray-800 whitespace-pre-wrap font-sans">{content}</pre>
        </div>
      );
    }
    
    // Render each section in its own blue box
    return (
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">{section.title}</h3>
            <pre className="text-gray-800 whitespace-pre-wrap font-sans">{section.content}</pre>
          </div>
        ))}
      </div>
    );
  };

  const questions = [
    'Do you want to use the currently selected Core Story Concept or provide a new one?\n\nCurrently selected: Plaque inflammation drives CV events. Direct and safe ways to reduce plaque inflammation are needed. Orticumab is a plaque-targeted anti-inflammatory therapy. By inhibiting pro-inflammatory macrophages within plaques, this new approach has the potential to reduce CV risk on top of current standard of care.',
    'Who is your Audience?',
    'What is your Intervention Name?',
    'What is the Disease or Condition?',
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
      if (step === 0) {
        // Handle Core Story Concept selection
        if (trimmed.toLowerCase().includes('currently selected') || trimmed.toLowerCase().includes('current')) {
          setContext((prev) => ({ ...prev, coreStoryConcept: 'Plaque inflammation drives CV events. Direct and safe ways to reduce plaque inflammation are needed. Orticumab is a plaque-targeted anti-inflammatory therapy. By inhibiting pro-inflammatory macrophages within plaques, this new approach has the potential to reduce CV risk on top of current standard of care.' }));
        } else {
          // User wants to provide new one, ask for it
          setMessages((msgs) => [
            ...msgs,
            {
              role: 'assistant',
              content: 'Please enter the Core Story Concept you\'d like to use to guide the story flow.',
            },
          ]);
          setStep(-1); // Special step to handle manual CSC input
          return;
        }
      }
      if (step === -1) {
        // Handle manual Core Story Concept input
        setContext((prev) => ({ ...prev, coreStoryConcept: trimmed }));
        setStep(1); // Move to audience question
        setMessages((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: questions[1],
          },
        ]);
        return;
      }
      if (step === 1) setContext((prev) => ({ ...prev, audience: trimmed }));
      if (step === 2) setContext((prev) => ({ ...prev, interventionName: trimmed }));

      if (step === 3) {
        setContext((prev) => ({ ...prev, diseaseCondition: trimmed }));
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'Creating your Story Flow Outline',
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
            setResult(prevResult => {
              // If there's existing content, append new content with a separator
              if (prevResult && prevResult.trim()) {
                return prevResult + '\n\n---NEW CONTENT---\n\n' + content;
              }
              return content;
            });
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
          setResult(prevResult => {
            // If there's existing content, append new content with a separator
            if (prevResult && prevResult.trim()) {
              return prevResult + '\n\n---NEW CONTENT---\n\n' + content;
            }
            return content;
          });
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
            showInput={!conversationStarted ? step <= questions.length - 1 || step === -1 : true}
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
              {renderSeparateBoxes(result)}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
