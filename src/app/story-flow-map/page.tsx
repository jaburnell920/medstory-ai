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
  
  // State for story flow outline components
  const [storyFlowResults, setStoryFlowResults] = useState({
    attackPoints: [] as string[],
    tensionResolutionPoints: [] as string[],
    conclusion: '',
  });

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

  // Function to parse API response and separate content from follow-up questions
  const parseStoryFlowResponse = (response: string) => {
    // Check if this is an Attack Point
    if (response.includes('Attack Point #')) {
      // Split by the follow-up question
      const parts = response.split(/(?=Would you like|Do you want)/);
      const attackPointSection = parts[0].trim();
      const followUpQuestion = parts[1] ? parts[1].trim() : '';
      
      // Extract just the content after "Attack Point #X"
      const contentMatch = attackPointSection.match(/Attack Point #\d+\s*\n*([\s\S]*)/);
      const attackPointContent = contentMatch ? contentMatch[1].trim() : attackPointSection;
      
      return {
        type: 'attackPoint',
        content: attackPointContent,
        followUpQuestion: followUpQuestion
      };
    }
    
    // Check if this is Tension-Resolution Points
    if (response.includes('Tension-Resolution #') || response.includes('TensionResolution #')) {
      // Extract tension-resolution content and follow-up question
      const parts = response.split(/(?=Would you like|Do you want)/);
      const content = parts[0].trim();
      const followUpQuestion = parts[1] ? parts[1].trim() : '';
      
      return {
        type: 'tensionResolution',
        content: content,
        followUpQuestion: followUpQuestion
      };
    }
    
    // Check if this is a Conclusion
    if (response.includes('Conclusion') && (response.includes('TED talk') || response.includes('clinical takeaway'))) {
      const parts = response.split(/(?=Would you like|Do you want)/);
      const content = parts[0].trim();
      const followUpQuestion = parts[1] ? parts[1].trim() : '';
      
      return {
        type: 'conclusion',
        content: content,
        followUpQuestion: followUpQuestion
      };
    }
    
    // Check if this is just a follow-up question (no content to display)
    if (response.match(/^(Would you like|Do you want)/)) {
      return {
        type: 'chat',
        content: response,
        followUpQuestion: ''
      };
    }
    
    // Default case - treat as regular chat message
    return {
      type: 'chat',
      content: response,
      followUpQuestion: ''
    };
  };

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
    setStoryFlowResults({
      attackPoints: [],
      tensionResolutionPoints: [],
      conclusion: '',
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
          
          // Parse the response to separate content from follow-up questions
          const parsed = parseStoryFlowResponse(data.result);
          
          if (parsed.type === 'attackPoint') {
            // Add attack point to results
            setStoryFlowResults(prev => ({
              ...prev,
              attackPoints: [...prev.attackPoints, parsed.content]
            }));
            
            // Add follow-up question to chat if it exists
            if (parsed.followUpQuestion) {
              setMessages((msgs) => [
                ...msgs.slice(0, -1), // Remove "Creating..." message
                {
                  role: 'assistant',
                  content: parsed.followUpQuestion,
                },
              ]);
            }
          } else {
            // Fallback to original behavior
            setMessages((msgs) => [
              ...msgs.slice(0, -1), // Remove "Creating..." message
              {
                role: 'assistant',
                content: data.result,
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

        // Parse the response to separate content from follow-up questions
        const parsed = parseStoryFlowResponse(data.result);
        
        if (parsed.type === 'attackPoint') {
          // For attack points, replace the last one (for modifications) or add new one
          setStoryFlowResults(prev => {
            const newAttackPoints = [...prev.attackPoints];
            if (newAttackPoints.length > 0) {
              // Replace the last attack point (modification case)
              newAttackPoints[newAttackPoints.length - 1] = parsed.content;
            } else {
              // Add new attack point (first time)
              newAttackPoints.push(parsed.content);
            }
            return {
              ...prev,
              attackPoints: newAttackPoints
            };
          });
          
          // Add follow-up question to chat if it exists
          if (parsed.followUpQuestion) {
            setMessages((msgs) => [
              ...msgs,
              {
                role: 'assistant',
                content: parsed.followUpQuestion,
              },
            ]);
          }
        } else if (parsed.type === 'tensionResolution') {
          // Add tension-resolution points to results
          setStoryFlowResults(prev => ({
            ...prev,
            tensionResolutionPoints: [...prev.tensionResolutionPoints, parsed.content]
          }));
          
          // Add follow-up question to chat if it exists
          if (parsed.followUpQuestion) {
            setMessages((msgs) => [
              ...msgs,
              {
                role: 'assistant',
                content: parsed.followUpQuestion,
              },
            ]);
          }
        } else if (parsed.type === 'conclusion') {
          // Add conclusion to results
          setStoryFlowResults(prev => ({
            ...prev,
            conclusion: parsed.content
          }));
          
          // Add follow-up question to chat if it exists
          if (parsed.followUpQuestion) {
            setMessages((msgs) => [
              ...msgs,
              {
                role: 'assistant',
                content: parsed.followUpQuestion,
              },
            ]);
          }
        } else {
          // Fallback to original behavior for regular chat messages
          setMessages((msgs) => [
            ...msgs,
            {
              role: 'assistant',
              content: data.result,
            },
          ]);
        }
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

        {/* Results Section - Right Side */}
        {(storyFlowResults.attackPoints.length > 0 || storyFlowResults.tensionResolutionPoints.length > 0 || storyFlowResults.conclusion) && (
          <div className="flex-1 space-y-4">
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Story Flow Outline</h2>
              
              {/* Attack Points */}
              {storyFlowResults.attackPoints.map((attackPoint, index) => (
                <div key={`attack-${index}`} className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <h3 className="font-bold text-blue-800 text-lg mb-3">Attack Point #{index + 1}</h3>
                    <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {attackPoint}
                    </div>
                  </div>
                </div>
              ))}

              {/* Tension-Resolution Points */}
              {storyFlowResults.tensionResolutionPoints.map((tensionResolution, index) => (
                <div key={`tension-${index}`} className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <h3 className="font-bold text-blue-800 text-lg mb-3">Tension-Resolution Points</h3>
                    <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {tensionResolution}
                    </div>
                  </div>
                </div>
              ))}

              {/* Conclusion */}
              {storyFlowResults.conclusion && (
                <div className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <h3 className="font-bold text-blue-800 text-lg mb-3">Conclusion</h3>
                    <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {storyFlowResults.conclusion}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}