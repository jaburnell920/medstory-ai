'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

interface KeyPoint {
  id: string;
  content: string;
}

export default function TopPublicationsPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([
    {
      role: 'assistant',
      content:
        'Great. I will simulate an interview with an expert. Before we start, I need some information about the expert you have in mind:\n\nWhat is the professional background of the expert?',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [expertInfo, setExpertInfo] = useState('');
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [selectedKeyPoints, setSelectedKeyPoints] = useState<Set<string>>(new Set());
  const [initialKeyPointsLoaded, setInitialKeyPointsLoaded] = useState(false);
  const keyPointsRef = useRef<HTMLDivElement | null>(null);

  // Only scroll to key points when they are first generated, not on checkbox changes
  useEffect(() => {
    if (keyPointsRef.current && interviewEnded && keyPoints.length > 0 && !initialKeyPointsLoaded) {
      keyPointsRef.current.scrollIntoView({ behavior: 'smooth' });
      setInitialKeyPointsLoaded(true);
    }
  }, [interviewEnded, keyPoints, initialKeyPointsLoaded]);

  // Handle clicking on title to access saved page
  const handleTitleClick = () => {
    window.location.href = '/scientific-investigation/top-publications/saved';
  };

  const handleReset = () => {
    setInput('');
    setMessages([
      {
        role: 'assistant',
        content:
          'Great. I will simulate an interview with an expert. Before we start, I need some information about the expert you have in mind:\n\nWhat is the professional background of the expert?',
      },
    ]);
    setLoading(false);
    setInterviewStarted(false);
    setInterviewEnded(false);
    setExpertInfo('');
    setKeyPoints([]);
    setSelectedKeyPoints(new Set());
    setInitialKeyPointsLoaded(false);
  };

  const handleEndInterview = async () => {
    setLoading(true);

    try {
      // Extract key points from the conversation
      // Skip the first 8 messages which are the expert info collection
      const interviewMessages = interviewStarted ? messages.slice(8) : messages;
      const conversationText = interviewMessages
        .map((msg) => `${msg.role === 'user' ? 'Interviewer' : 'Expert'}: ${msg.content}`)
        .join('\n\n');

      // For demonstration purposes, create mock key points when API is not available
      const mockKeyPoints = [
        'The expert emphasized the importance of personalized medicine in cancer treatment',
        'Current research focuses on immunotherapy and targeted therapies',
        'Patient outcomes have improved significantly over the past decade',
        'Collaboration between researchers and clinicians is crucial for advancement',
        'Future directions include AI-assisted diagnosis and treatment planning',
      ];

      // Try to call OpenAI to extract key points, but fall back to mock data
      try {
        const res = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Extract 5-10 key points from this interview with an expert in ${expertInfo}. 
            Format each point as a clear, concise statement that captures an important insight or piece of information.
            
            INTERVIEW TRANSCRIPT:
            ${conversationText}
            
            KEY POINTS:`,
            max_tokens: 1000,
          }),
        });

        const data = await res.json();

        if (data.result) {
          // Parse the key points from API response
          const pointsText = data.result || '';
          // Try to handle different formats of key points
          let pointsList: string[] = [];

          // First try numbered format (1. Point)
          const numberedPoints = pointsText.split(/\d+\./).filter((p) => p.trim().length > 0);
          if (numberedPoints.length > 1) {
            pointsList = numberedPoints.map((p) => p.trim());
          }
          // Then try bullet points
          else if (pointsText.includes('•')) {
            pointsList = pointsText
              .split('•')
              .filter((p) => p.trim().length > 0)
              .map((p) => p.trim());
          }
          // Then try dash points
          else if (pointsText.includes('-')) {
            pointsList = pointsText
              .split('-')
              .filter((p) => p.trim().length > 0)
              .map((p) => p.trim());
          }
          // If all else fails, just use the whole text
          else {
            pointsList = [pointsText.trim()];
          }

          // Create key points with IDs
          const formattedKeyPoints: KeyPoint[] = pointsList.map(
            (content: string, index: number): KeyPoint => ({
              id: `keypoint-${Date.now()}-${index}`,
              content,
            })
          );

          setKeyPoints(formattedKeyPoints);
        } else {
          throw new Error('No result from API');
        }
      } catch (apiError) {
        console.log('API not available, using mock key points for demonstration', apiError);
        // Use mock key points when API is not available
        const formattedKeyPoints: KeyPoint[] = mockKeyPoints.map(
          (content: string, index: number): KeyPoint => ({
            id: `keypoint-${Date.now()}-${index}`,
            content,
          })
        );
        setKeyPoints(formattedKeyPoints);
      }

      setInterviewEnded(true);
    } catch (err) {
      console.error('Error extracting key points:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle checkbox changes for key points
  const handleKeyPointSelection = (pointId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedKeyPoints);
    if (isSelected) {
      newSelected.add(pointId);
    } else {
      newSelected.delete(pointId);
    }
    setSelectedKeyPoints(newSelected);
  };

  // Handle saving selected key points to session storage
  const handleSaveSelected = () => {
    // Save to session storage
    sessionStorage.setItem(
      'selectedInterviewKeyPoints',
      JSON.stringify(Array.from(selectedKeyPoints))
    );

    // Also save the actual key point data
    const selectedPointsData = keyPoints.filter((point) => selectedKeyPoints.has(point.id));
    sessionStorage.setItem('selectedInterviewKeyPointsData', JSON.stringify(selectedPointsData));

    // Show success message
    toast.success(`${selectedKeyPoints.size} key points saved successfully!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);

    // Check if this is an "end interview" command
    const isEndInterview =
      input.toLowerCase().includes('end interview') ||
      input.toLowerCase().includes('interview complete');

    if (!interviewStarted) {
      // First response - collect expert info
      // We'll collect all the expert information before starting the actual interview
      // The first 4 messages are for collecting expert information
      setLoading(true);

      // Continue collecting expert info
      let nextQuestion = '';

      if (newMessages.length === 2) {
        // After first answer (professional background)
        nextQuestion = 'In what areas of science and/or medicine do they have deep expertise?';
        setMessages([...newMessages, { role: 'assistant', content: nextQuestion }]);
        setLoading(false);
      } else if (newMessages.length === 4) {
        // After second answer (areas of expertise)
        nextQuestion = 'Is this expert a basic scientist, a clinician, or a mix of both?';
        setMessages([...newMessages, { role: 'assistant', content: nextQuestion }]);
        setLoading(false);
      } else if (newMessages.length === 6) {
        // After third answer (scientist/clinician)
        nextQuestion = 'Is this expert considered an academic, a practitioner, or a mix of both?';
        setMessages([...newMessages, { role: 'assistant', content: nextQuestion }]);
        setLoading(false);
      } else if (newMessages.length === 8) {
        // After fourth answer (academic/practitioner)
        // We have all the info, now start the interview
        const expertInfoCollected = newMessages
          .filter((msg) => msg.role === 'user')
          .map((msg) => msg.content)
          .join('; ');
        setExpertInfo(expertInfoCollected);
        setInterviewStarted(true);

        try {
          const res = await fetch('/api/expert-interview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'start',
              expertInfo: expertInfoCollected,
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
        setLoading(false);
      }
    } else {
      // Continue interview - append instruction to not ask questions
      const modifiedInput = isEndInterview
        ? input
        : `${input}. Do not ask any questions in your response.`;
      setLoading(true);

      try {
        const res = await fetch('/api/expert-interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'continue',
            expertInfo: expertInfo,
            userMessage: modifiedInput,
            conversationHistory: messages,
          }),
        });
        const data = await res.json();

        setMessages([...newMessages, { role: 'assistant', content: data.result }]);

        // If this was an end interview command, update the state and extract key points
        if (isEndInterview) {
          setInterviewEnded(true);
          // Wait for the response to be added to messages, then extract key points
          setTimeout(() => {
            handleEndInterview();
          }, 1000);
        }
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
      initialResultsLoaded={initialKeyPointsLoaded}
      sectionIcon={
        <Image
          src="/stakeholder_interviews_chat.png"
          alt="Core Story Chat"
          width={72}
          height={72}
          className="w-18 h-18"
        />
      }
      sectionName="Stakeholder Interviews"
      taskName={
        <span
          onClick={handleTitleClick}
          className="cursor-pointer hover:text-blue-600 transition-colors"
          title="Click to view saved key points"
        >
          Simulate expert interview
        </span>
      }
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
                ? 'Ask your question... (type "end interview" when finished)'
                : 'Enter your response...'
            }
            removeExpertPrefix={true}
            onReset={handleReset}
            onEndInterview={handleEndInterview}
            interviewEnded={interviewEnded}
          />
        </div>

        {/* Key Points Section - Right Side */}
        {interviewEnded && keyPoints.length > 0 && (
          <div className="flex-1 space-y-6" ref={keyPointsRef}>
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-900">Key Points from Interview</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{selectedKeyPoints.size} selected</span>
                  {selectedKeyPoints.size > 0 && (
                    <button
                      onClick={handleSaveSelected}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Save Selected
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                {keyPoints.map((point) => (
                  <div
                    key={point.id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={point.id}
                        checked={selectedKeyPoints.has(point.id)}
                        onChange={(e) => handleKeyPointSelection(point.id, e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor={point.id} className="cursor-pointer">
                          <div className="text-gray-700 text-sm leading-relaxed">
                            {point.content}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
