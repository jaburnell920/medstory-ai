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
        'Who would you like to simulate an interview with:\n\nA specific person...Please provide the full name and their affiliation\nA scientific expert...Please provide the scientific area of expertise',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [expertInfo, setExpertInfo] = useState('');
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [selectedKeyPoints, setSelectedKeyPoints] = useState<Set<string>>(new Set());
  const keyPointsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (keyPointsRef.current && interviewEnded && keyPoints.length > 0) {
      keyPointsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [interviewEnded]); // Only scroll when interview ends, not when keyPoints change

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
          'Who would you like to simulate an interview with:\n\nA specific person...Please provide the full name and their affiliation\nA scientific expert...Please provide the scientific area of expertise',
      },
    ]);
    setLoading(false);
    setInterviewStarted(false);
    setInterviewEnded(false);
    setExpertInfo('');
    setKeyPoints([]);
    setSelectedKeyPoints(new Set());
  };

  const handleEndInterview = async () => {
    setLoading(true);

    try {
      // Extract key points from the conversation
      const conversationText = messages.map((msg) => msg.content).join('\n\n');

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
            prompt: `Extract 5-10 key points from this interview with ${expertInfo}. 
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
          const pointsList: string[] = pointsText
            .split(/\d+\./)
            .filter((point: string) => point.trim().length > 0)
            .map((point: string) => point.trim());

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

    if (!interviewStarted) {
      // First response - store expert info and start interview
      setExpertInfo(input);
      setInterviewStarted(true);
      setLoading(true);

      try {
        const res = await fetch('/api/expert-interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'start',
            expertInfo: input,
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
      // Continue interview - append instruction to not ask questions
      const modifiedInput = `${input}. Do not ask any questions in your response.`;
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
          Simulated thought leader interview
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
                ? 'Ask your question...'
                : "Specify the expert you'd like to interview..."
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
              <div className="space-y-6">
                {keyPoints.map((point) => (
                  <div key={point.id} className="border-b border-gray-200 pb-4 last:border-b-0">
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
              {selectedKeyPoints.size > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Tip: Click &quot;Save Selected&quot; to save your chosen key points, then
                    click &quot;Simulated thought leader interview&quot; in the header to view them
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
