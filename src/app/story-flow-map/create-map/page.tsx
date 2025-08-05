'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
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
    // Only run this effect on the client side
    if (typeof window === 'undefined') return;
    
    // Check if required data exists in localStorage
    const { hasCoreStoryConcept, hasStoryFlowOutline } = checkMemoryForRequiredData();
    
    // Log the state for debugging
    console.log('Initial check - Core Story Concept exists:', hasCoreStoryConcept);
    console.log('Initial check - Story Flow Outline exists:', hasStoryFlowOutline);
    
    let initialMessage = '';
    
    if (!hasCoreStoryConcept) {
      initialMessage = 'To create a Story Flow Map, I need you to create a Core Story Concept. Please go to the Core Story Concept section of MEDSTORYAI to do this then return here and I\'ll be happy to generate the Story Flow Map. Thanks.';
    } else if (!hasStoryFlowOutline) {
      initialMessage = 'To create a Story Flow Map, I need you to create a Story Flow Outline first. Please go to the Story Flow section of MEDSTORYAI to do this then return here and I\'ll be happy to generate the Story Flow Map. Thanks.';
    } else {
      initialMessage = 'Just to confirm, would you like me to use the currently selected attack point, the most recent story flow outline, and the currently selected Core Story Concept to create the story flow map?';
    }

    setMessages([
      {
        role: 'assistant',
        content: initialMessage,
      },
    ]);
  }, []);

  // Function to check if required data exists in localStorage
  const checkMemoryForRequiredData = (): { hasCoreStoryConcept: boolean; hasStoryFlowOutline: boolean } => {
    if (typeof window === 'undefined') return { hasCoreStoryConcept: false, hasStoryFlowOutline: false };

    try {
      // Check all localStorage keys for debugging
      console.log('All localStorage keys:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`- ${key}`);
      }
      
      // Check for Core Story Concept data - try multiple possible keys
      const coreStoryConceptData = localStorage.getItem('selectedCoreStoryConceptData') || 
                                  localStorage.getItem('coreStoryConcept') || 
                                  localStorage.getItem('selectedCoreStoryConcept');
      console.log('Core Story Concept data from localStorage:', coreStoryConceptData);
      
      let hasCoreStoryConcept = false;

      if (coreStoryConceptData) {
        try {
          const conceptData = JSON.parse(coreStoryConceptData);
          console.log('Parsed Core Story Concept data:', conceptData);
          
          // Check different possible structures
          if (conceptData && typeof conceptData === 'object') {
            if (conceptData.content && conceptData.content.trim().length > 0) {
              hasCoreStoryConcept = true;
            } else if (typeof conceptData === 'string' && conceptData.trim().length > 0) {
              hasCoreStoryConcept = true;
            } else if (Array.isArray(conceptData) && conceptData.length > 0) {
              hasCoreStoryConcept = true;
            }
          } else if (typeof conceptData === 'string' && conceptData.trim().length > 0) {
            hasCoreStoryConcept = true;
          }
          
          console.log('Has Core Story Concept:', hasCoreStoryConcept);
        } catch (e) {
          console.error('Error parsing Core Story Concept data:', e);
          // If it's not valid JSON, check if it's a non-empty string
          if (typeof coreStoryConceptData === 'string' && coreStoryConceptData.trim().length > 0) {
            hasCoreStoryConcept = true;
            console.log('Core Story Concept is a non-empty string');
          }
        }
      }

      // Check for Story Flow Outline data (attack points and tension-resolution points)
      const storyFlowData = localStorage.getItem('storyFlowData');
      const attackPointsData = localStorage.getItem('attackPoints');
      const tensionResolutionData = localStorage.getItem('tensionResolutionPoints');
      const savedTensionResolutionData = localStorage.getItem('savedTensionResolutionData');
      
      console.log('Story Flow data from localStorage:', storyFlowData);
      console.log('Attack Points data from localStorage:', attackPointsData);
      console.log('Tension Resolution data from localStorage:', tensionResolutionData);
      console.log('Saved Tension Resolution data from localStorage:', savedTensionResolutionData);

      let hasStoryFlowOutline = false;

      // Check if any story flow outline data exists
      if (storyFlowData) {
        try {
          const flowData = JSON.parse(storyFlowData);
          console.log('Parsed Story Flow data:', flowData);
          hasStoryFlowOutline =
            flowData &&
            ((flowData.attackPoints && flowData.attackPoints.length > 0) ||
              (flowData.tensionResolutionPoints && flowData.tensionResolutionPoints.length > 0));
          console.log('Has Story Flow Outline from storyFlowData:', hasStoryFlowOutline);
        } catch (e) {
          console.error('Error parsing Story Flow data:', e);
          // If parsing fails, check individual items
        }
      }

      // Fallback: check individual localStorage items
      if (!hasStoryFlowOutline) {
        let hasAttackPoints = false;
        let hasTensionResolution = false;
        let hasSavedTensionResolution = false;
        
        if (attackPointsData) {
          try {
            const attackPoints = JSON.parse(attackPointsData);
            hasAttackPoints = attackPoints && attackPoints.length > 0;
            console.log('Has Attack Points:', hasAttackPoints);
          } catch (e) {
            console.error('Error parsing Attack Points data:', e);
            // If it's not valid JSON, check if it's a non-empty string
            if (typeof attackPointsData === 'string' && attackPointsData.trim().length > 0) {
              hasAttackPoints = true;
              console.log('Attack Points is a non-empty string');
            }
          }
        }
        
        if (tensionResolutionData) {
          try {
            const tensionResolution = JSON.parse(tensionResolutionData);
            hasTensionResolution = tensionResolution && tensionResolution.length > 0;
            console.log('Has Tension Resolution:', hasTensionResolution);
          } catch (e) {
            console.error('Error parsing Tension Resolution data:', e);
            // If it's not valid JSON, check if it's a non-empty string
            if (typeof tensionResolutionData === 'string' && tensionResolutionData.trim().length > 0) {
              hasTensionResolution = true;
              console.log('Tension Resolution is a non-empty string');
            }
          }
        }
        
        // Check for saved tension resolution data
        if (savedTensionResolutionData) {
          try {
            const savedData = JSON.parse(savedTensionResolutionData);
            console.log('Parsed Saved Tension Resolution data:', savedData);
            
            // Check if it's an array
            if (Array.isArray(savedData) && savedData.length > 0) {
              // Use the first item in the array
              const firstItem = savedData[0];
              hasSavedTensionResolution = firstItem && 
                ((firstItem.attackPoint && firstItem.attackPoint.trim && firstItem.attackPoint.trim().length > 0) || 
                 (firstItem.tensionResolutionPoints && firstItem.tensionResolutionPoints.length > 0) ||
                 (firstItem.selectedAttackPoint && firstItem.selectedAttackPoint.content && firstItem.selectedAttackPoint.content.trim().length > 0) ||
                 (firstItem.selectedTensionPoints && firstItem.selectedTensionPoints.length > 0));
            } else {
              // Check if it has the expected structure with attack points or tension-resolution points
              hasSavedTensionResolution = savedData && 
                ((savedData.attackPoint && savedData.attackPoint.trim && savedData.attackPoint.trim().length > 0) || 
                 (savedData.tensionResolutionPoints && savedData.tensionResolutionPoints.length > 0) ||
                 (savedData.selectedAttackPoint && savedData.selectedAttackPoint.content && savedData.selectedAttackPoint.content.trim().length > 0) ||
                 (savedData.selectedTensionPoints && savedData.selectedTensionPoints.length > 0));
            }
            console.log('Has Saved Tension Resolution:', hasSavedTensionResolution);
          } catch (e) {
            console.error('Error parsing Saved Tension Resolution data:', e);
            // If it's not valid JSON, check if it's a non-empty string
            if (typeof savedTensionResolutionData === 'string' && savedTensionResolutionData.trim().length > 0) {
              hasSavedTensionResolution = true;
              console.log('Saved Tension Resolution is a non-empty string');
            }
          }
        }
        
        hasStoryFlowOutline = Boolean(hasAttackPoints) || Boolean(hasTensionResolution) || Boolean(hasSavedTensionResolution);
        console.log('Has Story Flow Outline from individual items:', hasStoryFlowOutline);
      }

      // For testing purposes, force both to true if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        // Uncomment these lines to force values for testing
        // hasCoreStoryConcept = true;
        // hasStoryFlowOutline = true;
      }

      console.log('Final result - Has Core Story Concept:', hasCoreStoryConcept);
      console.log('Final result - Has Story Flow Outline:', hasStoryFlowOutline);
      
      return { hasCoreStoryConcept, hasStoryFlowOutline };
    } catch (error) {
      console.error('Error checking memory for required data:', error);
      return { hasCoreStoryConcept: false, hasStoryFlowOutline: false };
    }
  };

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
      if (
        response.includes('yes') ||
        response.includes('confirm') ||
        response.includes('proceed')
      ) {
        // User confirmed - check if data exists in memory
        console.log('User confirmed, checking for required data...');
        const { hasCoreStoryConcept, hasStoryFlowOutline } = checkMemoryForRequiredData();
        console.log('handleSubmit check - Core Story Concept exists:', hasCoreStoryConcept);
        console.log('handleSubmit check - Story Flow Outline exists:', hasStoryFlowOutline);

        if (!hasCoreStoryConcept) {
          // No Core Story Concept in memory
          console.log('No Core Story Concept found, showing message');
          setMessages([
            ...newMessages,
            {
              role: 'assistant',
              content:
                'To create a Story Flow Map, I need you to create a Core Story Concept. Please go to the Core Story Concept section of MEDSTORYAI to do this then return here and I\'ll be happy to generate the Story Flow Map. Thanks.',
            },
          ]);
          return;
        }

        if (!hasStoryFlowOutline) {
          // No Story Flow Outline in memory
          console.log('No Story Flow Outline found, showing message');
          setMessages([
            ...newMessages,
            {
              role: 'assistant',
              content:
                'To create a Story Flow Map, I need you to create a Story Flow Outline first. Please go to the Story Flow section of MEDSTORYAI to do this then return here and I\'ll be happy to generate the Story Flow Map. Thanks.',
            },
          ]);
          return;
        }
        
        console.log('Both Core Story Concept and Story Flow Outline found, proceeding...');

        // Both Core Story Concept and Story Flow Outline exist
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content:
              'Thank you for confirming. I will now create your story flow map using the selected data.',
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
            content:
              'I understand. I diplomatically suggest that you complete the Core Story Concept and Story Flow Outline sections of MEDSTORYAI and then return here to view and edit the Story Flow Map.',
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
      // Get data from localStorage
      const memoryData = getDataFromMemory();

      const response = await fetch('/api/story-flow-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          memoryData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStoryFlowData(data.storyFlowData);
        setShowMap(true);
        setStep(1);

        // Create a table of the current story points without the tension/resolution values
        const storyPointsTable = createStoryPointsTable(data.storyFlowData.storyPoints);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Here is your Story Flow Map based on the selected data.\n\n${storyPointsTable}\n\nWould you like to modify this Story Flow Map?`,
          },
        ]);
      } else {
        toast.error('Failed to create story flow map');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'I encountered an error creating the story flow map. Please ensure you have completed the Core Story Concept and Story Flow Outline sections first.',
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

  // Function to get data from localStorage
  const getDataFromMemory = () => {
    if (typeof window === 'undefined') return null;

    try {
      // Get Core Story Concept
      const coreStoryConceptData = localStorage.getItem('selectedCoreStoryConceptData') || 
                                  localStorage.getItem('coreStoryConcept') || 
                                  localStorage.getItem('selectedCoreStoryConcept');
      let coreStoryConcept = '';

      if (coreStoryConceptData) {
        try {
          const conceptData = JSON.parse(coreStoryConceptData);
          if (conceptData && typeof conceptData === 'object') {
            coreStoryConcept = conceptData?.content || '';
          } else if (typeof conceptData === 'string') {
            coreStoryConcept = conceptData;
          }
        } catch (e) {
          console.error('Error parsing Core Story Concept data:', e);
          if (typeof coreStoryConceptData === 'string') {
            coreStoryConcept = coreStoryConceptData;
          }
        }
      }

      // Get Story Flow Outline data
      let attackPoints = [];
      let tensionResolutionPoints = [];

      // Try to get from consolidated storyFlowData first
      const storyFlowData = localStorage.getItem('storyFlowData');
      if (storyFlowData) {
        try {
          const flowData = JSON.parse(storyFlowData);
          attackPoints = flowData.attackPoints || [];
          tensionResolutionPoints = flowData.tensionResolutionPoints || [];
        } catch (e) {
          console.error('Error parsing Story Flow data:', e);
          // If parsing fails, try individual items
        }
      }

      // Try to get from savedTensionResolutionData
      if (attackPoints.length === 0 || tensionResolutionPoints.length === 0) {
        const savedTensionResolutionData = localStorage.getItem('savedTensionResolutionData');
        if (savedTensionResolutionData) {
          try {
            const savedData = JSON.parse(savedTensionResolutionData);
            console.log('Parsed savedTensionResolutionData for getDataFromMemory:', savedData);
            
            // Handle array structure
            if (Array.isArray(savedData) && savedData.length > 0) {
              const firstItem = savedData[0];
              
              // Check for attack point
              if (attackPoints.length === 0 && firstItem.selectedAttackPoint) {
                attackPoints = [firstItem.selectedAttackPoint.content || firstItem.selectedAttackPoint];
                console.log('Got attack point from array:', attackPoints);
              }
              
              // Check for tension-resolution points
              if (tensionResolutionPoints.length === 0 && firstItem.selectedTensionPoints && firstItem.selectedTensionPoints.length > 0) {
                tensionResolutionPoints = firstItem.selectedTensionPoints.map(point => point.content || point);
                console.log('Got tension points from array:', tensionResolutionPoints);
              }
            } else {
              // Handle non-array structure
              // Check for attack point
              if (attackPoints.length === 0 && savedData.selectedAttackPoint) {
                attackPoints = [savedData.selectedAttackPoint.content || savedData.selectedAttackPoint];
              } else if (attackPoints.length === 0 && savedData.attackPoint) {
                attackPoints = [savedData.attackPoint];
              }
              
              // Check for tension-resolution points
              if (tensionResolutionPoints.length === 0 && savedData.selectedTensionResolutionPoints) {
                tensionResolutionPoints = savedData.selectedTensionResolutionPoints;
              } else if (tensionResolutionPoints.length === 0 && savedData.selectedTensionPoints) {
                tensionResolutionPoints = savedData.selectedTensionPoints.map(point => point.content || point);
              } else if (tensionResolutionPoints.length === 0 && savedData.tensionResolutionPoints) {
                tensionResolutionPoints = savedData.tensionResolutionPoints;
              }
            }
            
            console.log('Got data from savedTensionResolutionData:', { attackPoints, tensionResolutionPoints });
          } catch (e) {
            console.error('Error parsing Saved Tension Resolution data:', e);
          }
        }
      }

      // Fallback: get from individual localStorage items
      if (attackPoints.length === 0) {
        const attackPointsData = localStorage.getItem('attackPoints');
        if (attackPointsData) {
          try {
            attackPoints = JSON.parse(attackPointsData);
          } catch (e) {
            console.error('Error parsing Attack Points data:', e);
          }
        }
      }

      if (tensionResolutionPoints.length === 0) {
        const tensionResolutionData = localStorage.getItem('tensionResolutionPoints');
        if (tensionResolutionData) {
          try {
            tensionResolutionPoints = JSON.parse(tensionResolutionData);
          } catch (e) {
            console.error('Error parsing Tension Resolution data:', e);
          }
        }
      }

      console.log('Final data from memory:', {
        coreStoryConcept,
        attackPoints,
        tensionResolutionPoints,
      });

      return {
        coreStoryConcept,
        attackPoints,
        tensionResolutionPoints,
      };
    } catch (error) {
      console.error('Error getting data from memory:', error);
      return null;
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
          currentData: storyFlowData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStoryFlowData(data.storyFlowData);

        // Create a table of the current story points without the tension/resolution values
        const storyPointsTable = createStoryPointsTable(data.storyFlowData.storyPoints);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I have updated the Story Flow Map based on your request: "${modifications}". The map has been redrawn with the current information.\n\n${storyPointsTable}\n\nWould you like to modify this Story Flow Map?`,
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

  // Helper function to create a table of story points without tension/resolution values
  const createStoryPointsTable = (storyPoints: StoryPoint[]): string => {
    let tableContent = '| # | Tension | Resolution |\n|---|---------|------------|\n';
    
    storyPoints.forEach(point => {
      if (point.label === 'AP') {
        tableContent += `| AP | ${point.tension} | |\n`;
      } else if (point.label === 'CSC') {
        tableContent += `| CSC | | ${point.resolution} |\n`;
      } else {
        tableContent += `| ${point.label} | ${point.tension} | ${point.resolution} |\n`;
      }
    });
    
    return tableContent;
  };

  const renderStoryFlowMap = () => {
    if (!storyFlowData || !showMap) return null;

    const { storyPoints } = storyFlowData;

    // Calculate positions based on requirements
    // AP at (0, AP tension value)
    // Tension points at (x, tension value) starting from x=10, increasing by 20
    // Resolution points at (x+10, resolution value)
    // CSC at next x coordinate with y=25

    const tensionResolutionPairs = storyPoints.filter((p) => p.label !== 'AP' && p.label !== 'CSC');
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
            <text x="25" y="45" fontSize="14" fontWeight="bold" fill="black" textAnchor="middle">
              Story
            </text>
            <text x="25" y="60" fontSize="14" fontWeight="bold" fill="black" textAnchor="middle">
              Tension
            </text>

            {/* X-axis label */}
            <text
              x={svgWidth / 2}
              y={svgHeight - 10}
              fontSize="14"
              fontWeight="bold"
              fill="black"
              textAnchor="middle"
            >
              Story Progress
            </text>

            {/* Render all circles and connections */}
            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const circles: any[] = [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const lines: any[] = [];
              let previousX = 0,
                previousY = 0;

              storyPoints.forEach((point, index) => {
                if (point.label === 'AP') {
                  // Attack Point at (0, AP tension value) - but we need to offset for visibility
                  const x = 60; // Offset from left edge
                  const y = svgHeight - 40 - point.tensionValue * yScale;

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
                  const y = svgHeight - 40 - 25 * yScale;

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
                  const tensionY = svgHeight - 40 - point.tensionValue * yScale;
                  const resolutionY = svgHeight - 40 - point.resolutionValue * yScale;

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
    <PageLayout
      sectionIcon={
        <Image
          src="/core_story_concept_new.png"
          alt="Story Flow Map"
          width={72}
          height={72}
          className="w-18 h-18"
        />
      }
      sectionName="Story Flow"
      taskName="Create story flow map"
    >
      <div className="flex gap-4 h-full">
        {/* Chat Interface - Left Side */}
        <div className="w-3/5 h-full">
          <ChatInterface
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            loading={loading}
            placeholder="Type your response..."
          />
        </div>

        {/* Story Flow Map - Right Side - Fixed */}
        <div className="flex-1 h-full">
          {showMap ? (
            <div className="h-full">{renderStoryFlowMap()}</div>
          ) : (
            <div></div>
            // <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex items-center justify-center">
            //   <p className="text-gray-500 text-center">
            //     Story Flow Map will appear here once generated
            //   </p>
            // </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
