'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

interface StoryPoint {
  label: string;
  tension: string;
  resolution: string;
  tensionValue: number;
  resolutionValue: number;
}

interface StoryFlowMapData {
  attackPoint: string;
  tensionResolutionPoints: string[];
  coreStoryConcept: string;
  storyPoints: StoryPoint[];
}

export default function CreateStoryFlowMap() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [storyFlowData, setStoryFlowData] = useState<StoryFlowMapData | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([]);

  // Initialize with confirmation question
  useEffect(() => {
    const initialMessage = "Just to confirm, would you like me to use the currently selected attack point, the most recent story flow outline, and the currently selected Core Story Concept to create the story flow map?";
    
    setMessages([
      {
        role: 'assistant',
        content: initialMessage,
      },
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setInput(''); // Clear input

    const response = userMessage.toLowerCase();
    
    if (step === 0) {
      // Handle initial confirmation
      if (response.includes('yes') || response.includes('confirm') || response.includes('proceed')) {
        // User confirmed - proceed to create story flow map
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'Thank you for confirming. I will now create your story flow map using the selected data.',
          },
        ]);
        
        setLoading(true);
        await createStoryFlowMap();
      } else {
        // User declined - suggest completing prerequisites
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'I understand. I diplomatically suggest that you complete the Core Story Concept and Story Flow Outline sections of MEDSTORYAI and then return here to view and edit the Story Flow Map.',
          },
        ]);
      }
    } else if (step === 1) {
      // Handle modification requests
      if (response.includes('yes')) {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'What modifications would you like to make?',
          },
        ]);
        setStep(2);
      } else {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'Great! Your story flow map is complete. You can view it above.',
          },
        ]);
      }
    } else if (step === 2) {
      // Handle specific modification requests
      setLoading(true);
      await modifyStoryFlowMap(userMessage);
    }
  };

  const createStoryFlowMap = async () => {
    try {
      const response = await fetch('/api/story-flow-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStoryFlowData(data.storyFlowData);
        setShowMap(true);
        setStep(1);
        
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Would you like to modify this Story Flow Map?',
          },
        ]);
      } else {
        toast.error('Failed to create story flow map');
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'I encountered an error creating the story flow map. Please ensure you have completed the Core Story Concept and Story Flow Outline sections first.',
          },
        ]);
      }
    } catch (error) {
      console.error('Error creating story flow map:', error);
      toast.error('Error creating story flow map');
    } finally {
      setLoading(false);
    }
  };

  const modifyStoryFlowMap = async (modifications: string) => {
    try {
      const response = await fetch('/api/story-flow-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'modify', 
          modifications,
          currentData: storyFlowData 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStoryFlowData(data.storyFlowData);
        
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `I have updated the Story Flow Map based on your request: "${modifications}". The map has been redrawn with the current information. Would you like to modify this Story Flow Map?`,
          },
        ]);
        setStep(1);
      } else {
        toast.error('Failed to modify story flow map');
      }
    } catch (error) {
      console.error('Error modifying story flow map:', error);
      toast.error('Error modifying story flow map');
    } finally {
      setLoading(false);
    }
  };

  const renderStoryFlowMap = () => {
    if (!storyFlowData || !showMap) return null;

    const { storyPoints } = storyFlowData;
    
    // Calculate positions based on requirements
    // AP at (0, AP tension value)
    // Tension points at (x, tension value) starting from x=10, increasing by 20
    // Resolution points at (x+10, resolution value)
    // CSC at next x coordinate with y=25
    
    const tensionResolutionPairs = storyPoints.filter(p => p.label !== 'AP' && p.label !== 'CSC');
    const svgWidth = Math.max(800, 10 + tensionResolutionPairs.length * 20 + 100);
    const svgHeight = 180;
    
    // Scale factor to fit values in SVG (values are 0-100, we want them in reasonable SVG coordinates)
    const yScale = (svgHeight - 80) / 100; // Leave 40px margin top and bottom

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Story Flow Map</h3>
        <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <svg width={svgWidth} height={svgHeight} className="w-full">
            {/* Light gray background */}
            <rect width="100%" height="100%" fill="#f5f5f5" />
            
            {/* Y-axis label - two lines: "Story" above "Tension" */}
            <text x="25" y="45" fontSize="14" fontWeight="bold" fill="black" textAnchor="middle">Story</text>
            <text x="25" y="60" fontSize="14" fontWeight="bold" fill="black" textAnchor="middle">Tension</text>
            
            {/* X-axis label */}
            <text x={svgWidth / 2} y={svgHeight - 10} fontSize="14" fontWeight="bold" fill="black" textAnchor="middle">Story Progress</text>
            
            {/* Render all circles and connections */}
            {(() => {
              const circles = [];
              const lines = [];
              let previousX = 0, previousY = 0;
              
              storyPoints.forEach((point, index) => {
                if (point.label === 'AP') {
                  // Attack Point at (0, AP tension value) - but we need to offset for visibility
                  const x = 60; // Offset from left edge
                  const y = svgHeight - 40 - (point.tensionValue * yScale);
                  
                  circles.push(
                    <g key={`ap-${index}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={30}
                        fill="#ff8c00" // orange
                        stroke="none"
                      />
                      <text
                        x={x}
                        y={y + 5}
                        fontSize="16"
                        fill="white"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        AP
                      </text>
                    </g>
                  );
                  
                  previousX = x + 30; // Right edge of circle
                  previousY = y;
                  
                } else if (point.label === 'CSC') {
                  // Core Story Concept at next x coordinate with y=25
                  const x = 60 + 10 + tensionResolutionPairs.length * 20 + 10;
                  const y = svgHeight - 40 - (25 * yScale);
                  
                  circles.push(
                    <g key={`csc-${index}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={30}
                        fill="#32cd32" // green
                        stroke="none"
                      />
                      <text
                        x={x}
                        y={y + 5}
                        fontSize="16"
                        fill="white"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        CSC
                      </text>
                    </g>
                  );
                  
                  // Connection line from previous point to CSC
                  if (previousX && previousY) {
                    lines.push(
                      <line
                        key={`line-to-csc-${index}`}
                        x1={previousX}
                        y1={previousY}
                        x2={x - 30}
                        y2={y}
                        stroke="#404040"
                        strokeWidth="3"
                      />
                    );
                  }
                  
                } else {
                  // Tension-Resolution pairs
                  const pairIndex = parseInt(point.label) - 1;
                  const tensionX = 60 + 10 + pairIndex * 20;
                  const resolutionX = tensionX + 10;
                  const tensionY = svgHeight - 40 - (point.tensionValue * yScale);
                  const resolutionY = svgHeight - 40 - (point.resolutionValue * yScale);
                  
                  // Tension circle (dark red)
                  circles.push(
                    <g key={`tension-${index}`}>
                      <circle
                        cx={tensionX}
                        cy={tensionY}
                        r={30}
                        fill="#8b0000" // dark red
                        stroke="none"
                      />
                      <text
                        x={tensionX}
                        y={tensionY + 5}
                        fontSize="16"
                        fill="white"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {point.label}
                      </text>
                    </g>
                  );
                  
                  // Resolution circle (blue)
                  circles.push(
                    <g key={`resolution-${index}`}>
                      <circle
                        cx={resolutionX}
                        cy={resolutionY}
                        r={30}
                        fill="#0000ff" // blue
                        stroke="none"
                      />
                      <text
                        x={resolutionX}
                        y={resolutionY + 5}
                        fontSize="16"
                        fill="white"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {point.label}
                      </text>
                    </g>
                  );
                  
                  // Connection line from previous point to tension
                  if (previousX && previousY) {
                    lines.push(
                      <line
                        key={`line-to-tension-${index}`}
                        x1={previousX}
                        y1={previousY}
                        x2={tensionX - 30}
                        y2={tensionY}
                        stroke="#404040"
                        strokeWidth="3"
                      />
                    );
                  }
                  
                  // Connection line from tension to resolution
                  lines.push(
                    <line
                      key={`tension-resolution-${index}`}
                      x1={tensionX + 30}
                      y1={tensionY}
                      x2={resolutionX - 30}
                      y2={resolutionY}
                      stroke="#404040"
                      strokeWidth="3"
                    />
                  );
                  
                  previousX = resolutionX + 30; // Right edge of resolution circle
                  previousY = resolutionY;
                }
              });
              
              return [...lines, ...circles];
            })()}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <PageLayout>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Story Flow Map</h1>
              <p className="text-gray-600">
                Generate a visual story flow map based on your attack point, story flow outline, and core story concept.
              </p>
            </div>

            {renderStoryFlowMap()}

            <div className="bg-white rounded-lg shadow-lg">
              <ChatInterface
                messages={messages}
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                loading={loading}
                placeholder="Type your response..."
              />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}