'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

export default function TensionResolution() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [attackPoints, setAttackPoints] = useState<string[]>([]);
  const [persistentAttackPoints, setPersistentAttackPoints] = useState<string[]>([]); // Backup storage for attack points
  const [tensionResolutionPoints, setTensionResolutionPoints] = useState<string[]>([]);
  const [conclusion, setConclusion] = useState('');
  const [references, setReferences] = useState('');
  const [conversationStarted, setConversationStarted] = useState(false);

  // State for selections and saving
  const [selectedAttackPoint, setSelectedAttackPoint] = useState<string>('');
  const [selectedTensionPoints, setSelectedTensionPoints] = useState<Set<string>>(new Set());
  const [context, setContext] = useState({
    coreStoryConcept: '',
    audience: '',
    interventionName: '',
    diseaseCondition: '',
  });

  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([]);
  const resultsSectionRef = useRef<HTMLDivElement | null>(null);

  // Scroll to results section when content changes
  useEffect(() => {
    if (attackPoints.length > 0 || tensionResolutionPoints.length > 0 || conclusion || references || result) {
      // Use a longer delay to ensure content is fully rendered
      const timer = setTimeout(() => {
        const resultsContainer = document.querySelector('#results-section .overflow-y-auto');
        if (resultsContainer) {
          resultsContainer.scrollTop = resultsContainer.scrollHeight;
        } else {
          // Fallback to scrolling the entire section into view
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [attackPoints, tensionResolutionPoints, conclusion, references, result]);

  // Initialize messages with core story concept from localStorage
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const savedCoreStoryConceptData = localStorage.getItem('selectedCoreStoryConceptData');
      let initialMessage =
        'Do you want to use the currently selected Core Story Concept or provide a new one?';

      if (savedCoreStoryConceptData) {
        try {
          const conceptData = JSON.parse(savedCoreStoryConceptData);
          if (conceptData && conceptData.content) {
            // initialMessage += '\n\nCurrently selected: ' + conceptData.content;
            initialMessage =
              'Do you want to use the currently selected Core Story Concept or provide a new one?';
          }
        } catch (error) {
          console.error('Error parsing core story concept from localStorage:', error);
        }
      } else {
        initialMessage =
          'There is no Core Story Concept saved in memory. Please provide a new one, or visit the Create Core Story Concept Options page and then come back.';
      }

      setMessages([
        {
          role: 'assistant',
          content: initialMessage,
        },
      ]);
    }
  }, []);

  const handleReset = () => {
    setStep(0);
    setInput('');
    setLoading(false);
    setResult('');
    setAttackPoints([]);
    setPersistentAttackPoints([]); // Clear backup storage too
    setTensionResolutionPoints([]);
    setConclusion('');
    setReferences('');
    setConversationStarted(false);
    setSelectedAttackPoint('');
    setSelectedTensionPoints(new Set());
    setContext({
      coreStoryConcept: '',
      audience: '',
      interventionName: '',
      diseaseCondition: '',
    });
    // Reset messages with core story concept from localStorage
    if (typeof window !== 'undefined') {
      const savedCoreStoryConceptData = localStorage.getItem('selectedCoreStoryConceptData');
      let initialMessage =
        'Do you want to use the currently selected Core Story Concept or provide a new one?';

      if (savedCoreStoryConceptData) {
        try {
          const conceptData = JSON.parse(savedCoreStoryConceptData);
          if (conceptData && conceptData.content) {
            initialMessage += '\n\nCurrently selected: ' + conceptData.content;
          }
        } catch (error) {
          console.error('Error parsing core story concept from localStorage:', error);
        }
      }

      setMessages([
        {
          role: 'assistant',
          content: initialMessage,
        },
      ]);
    }
  };

  // Initialize with default questions
  const [questions, setQuestions] = useState([
    'Do you want to use the currently selected Core Story Concept or provide a new one?',
    'Who is your audience?',
    'What is your intervention name?',
    'What is the disease or condition?',
  ]);

  // Update the first question with core story concept from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCoreStoryConceptData = localStorage.getItem('selectedCoreStoryConceptData');

      if (savedCoreStoryConceptData) {
        try {
          const conceptData = JSON.parse(savedCoreStoryConceptData);
          if (conceptData && conceptData.content) {
            setQuestions((prevQuestions) => [
              prevQuestions[0] + '\n\nCurrently selected: ' + conceptData.content,
              ...prevQuestions.slice(1),
            ]);
          }
        } catch (error) {
          console.error('Error parsing core story concept from localStorage:', error);
        }
      }
    }
  }, []);

  // Helper function to clean attack points by removing unwanted strings
  const cleanAttackPoint = (attackPoint: string): string => {
    const unwantedString =
      'Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?';
    return attackPoint.replace(unwantedString, '').trim();
  };

  // Helper function to safely update attack points with persistent backup
  const updateAttackPoints = (
    newPoints: string[],
    mode: 'replace' | 'add' | 'modify' = 'replace'
  ) => {
    // Clean all new points before processing
    const cleanedNewPoints = newPoints
      .map((point) => cleanAttackPoint(point))
      .filter((point) => point.length > 0);

    let finalPoints: string[] = [];

    if (mode === 'add') {
      finalPoints = [...persistentAttackPoints, ...cleanedNewPoints];
      setAttackPoints(finalPoints);
      setPersistentAttackPoints(finalPoints);
    } else if (mode === 'modify') {
      finalPoints = [...persistentAttackPoints];
      if (finalPoints.length > 0 && cleanedNewPoints.length > 0) {
        // Replace last attack point with the modified version
        finalPoints[finalPoints.length - 1] = cleanedNewPoints[0];
      }
      setAttackPoints(finalPoints);
      setPersistentAttackPoints(finalPoints);
    } else {
      finalPoints = cleanedNewPoints;
      setAttackPoints(finalPoints);
      setPersistentAttackPoints(finalPoints);
    }

    // Auto-select the latest (most recent) attack point
    if (finalPoints.length > 0) {
      setSelectedAttackPoint(finalPoints[finalPoints.length - 1]);
    }
  };

  // Helper function to restore attack points from persistent storage
  const restoreAttackPoints = () => {
    if (persistentAttackPoints.length > 0) {
      setAttackPoints(persistentAttackPoints);
      // Auto-select the latest (most recent) attack point
      setSelectedAttackPoint(persistentAttackPoints[persistentAttackPoints.length - 1]);
    }
  };

  // Function to parse and categorize AI response content
  const parseContentResponse = (response: string) => {
    const lines = response.split('\n');
    const attackPointsFound: string[] = [];
    const tensionResolutionPointsFound: string[] = [];
    let conclusionFound = '';
    let referencesFound = '';

    let currentSection = '';
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for Attack Point
      if (/Attack Point #\d+/i.test(line)) {
        if (currentSection && currentContent.length > 0) {
          // Save previous section
          if (currentSection === 'attack') {
            const cleanedAttackPoint = cleanAttackPoint(currentContent.join('\n').trim());
            if (cleanedAttackPoint) {
              attackPointsFound.push(cleanedAttackPoint);
            }
          }
        }
        currentSection = 'attack';
        currentContent = [line];
        continue;
      }

      // Check for Tension-Resolution Point
      if (line.match(/^\*?\*?Tension-Resolution #\d+/i)) {
        if (currentSection && currentContent.length > 0) {
          // Save previous section
          if (currentSection === 'attack') {
            const cleanedAttackPoint = cleanAttackPoint(currentContent.join('\n').trim());
            if (cleanedAttackPoint) {
              attackPointsFound.push(cleanedAttackPoint);
            }
          } else if (currentSection === 'tension') {
            tensionResolutionPointsFound.push(currentContent.join('\n').trim());
          }
        }
        currentSection = 'tension';
        currentContent = [line];
        continue;
      }

      // Check for Conclusion
      if (line.match(/^\*?\*?Conclusion\*?\*?/i)) {
        if (currentSection && currentContent.length > 0) {
          // Save previous section
          if (currentSection === 'attack') {
            const cleanedAttackPoint = cleanAttackPoint(currentContent.join('\n').trim());
            if (cleanedAttackPoint) {
              attackPointsFound.push(cleanedAttackPoint);
            }
          } else if (currentSection === 'tension') {
            tensionResolutionPointsFound.push(currentContent.join('\n').trim());
          }
        }
        currentSection = 'conclusion';
        currentContent = [];
        continue;
      }

      // Check for References
      if (line.match(/^References?$/i)) {
        if (currentSection && currentContent.length > 0) {
          // Save previous section
          if (currentSection === 'attack') {
            const cleanedAttackPoint = cleanAttackPoint(currentContent.join('\n').trim());
            if (cleanedAttackPoint) {
              attackPointsFound.push(cleanedAttackPoint);
            }
          } else if (currentSection === 'tension') {
            tensionResolutionPointsFound.push(currentContent.join('\n').trim());
          } else if (currentSection === 'conclusion') {
            conclusionFound = currentContent.join('\n').trim();
          }
        }
        currentSection = 'references';
        currentContent = [];
        continue;
      }

      // Add line to current content if we're in a section
      if (currentSection) {
        currentContent.push(lines[i]);
      }
    }

    // Save the last section
    if (currentSection && currentContent.length > 0) {
      if (currentSection === 'attack') {
        const cleanedAttackPoint = cleanAttackPoint(currentContent.join('\n').trim());
        if (cleanedAttackPoint) {
          attackPointsFound.push(cleanedAttackPoint);
        }
      } else if (currentSection === 'tension') {
        tensionResolutionPointsFound.push(currentContent.join('\n').trim());
      } else if (currentSection === 'conclusion') {
        conclusionFound = currentContent.join('\n').trim();
      } else if (currentSection === 'references') {
        referencesFound = currentContent.join('\n').trim();
      }
    }

    return {
      attackPoints: attackPointsFound,
      tensionResolutionPoints: tensionResolutionPointsFound,
      conclusion: conclusionFound,
      references: referencesFound,
    };
  };

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

  // Handle attack point selection (radio button)
  const handleAttackPointSelection = (attackPointIndex: number) => {
    setSelectedAttackPoint(attackPointIndex.toString());
  };

  // Handle tension resolution point selection (checkbox)
  const handleTensionPointSelection = (tensionPointIndex: number, checked: boolean) => {
    const newSelected = new Set(selectedTensionPoints);
    if (checked) {
      newSelected.add(tensionPointIndex.toString());
    } else {
      newSelected.delete(tensionPointIndex.toString());
    }
    setSelectedTensionPoints(newSelected);
  };

  // Handle saving selected items
  const handleSaveSelected = () => {
    if (!selectedAttackPoint && selectedTensionPoints.size === 0) {
      toast.error('Please select at least one item to save.');
      return;
    }

    // Prepare data to save
    const saveData = {
      id: `tension-resolution-${Date.now()}`,
      timestamp: new Date().toISOString(),
      context: context,
      selectedAttackPoint: selectedAttackPoint
        ? {
            index: parseInt(selectedAttackPoint),
            content: attackPoints[parseInt(selectedAttackPoint)],
          }
        : null,
      selectedTensionPoints: Array.from(selectedTensionPoints).map((index) => ({
        index: parseInt(index),
        content: tensionResolutionPoints[parseInt(index)],
      })),
      conclusion: conclusion,
      references: references,
    };

    // Save to localStorage
    const existingSaved = localStorage.getItem('savedTensionResolutionData');
    let savedData = [];
    if (existingSaved) {
      try {
        savedData = JSON.parse(existingSaved);
      } catch (error) {
        console.error('Error parsing saved data:', error);
      }
    }

    savedData.push(saveData);
    localStorage.setItem('savedTensionResolutionData', JSON.stringify(savedData));

    const totalSelected = (selectedAttackPoint ? 1 : 0) + selectedTensionPoints.size;
    toast.success(`${totalSelected} item(s) saved successfully!`);
  };

  // Handle clicking on title to access saved page
  const handleTitleClick = () => {
    window.location.href = '/story-flow-map/tension-resolution/saved';
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
        if (
          trimmed.toLowerCase().includes('currently selected') ||
          trimmed.toLowerCase().includes('current')
        ) {
          // Get core story concept from localStorage
          if (typeof window !== 'undefined') {
            const savedCoreStoryConceptData = localStorage.getItem('selectedCoreStoryConceptData');

            if (savedCoreStoryConceptData) {
              try {
                const conceptData = JSON.parse(savedCoreStoryConceptData);
                if (conceptData && conceptData.content) {
                  setContext((prev) => ({
                    ...prev,
                    coreStoryConcept: conceptData.content,
                  }));
                } else {
                  // If no content found, set empty string and inform user
                  setContext((prev) => ({
                    ...prev,
                    coreStoryConcept: '',
                  }));

                  setMessages((msgs) => [
                    ...msgs,
                    {
                      role: 'assistant',
                      content: 'No saved Core Story Concept found. Please create a new one.',
                    },
                  ]);
                  setStep(-1); // Special step to handle manual CSC input
                  return;
                }
              } catch (error) {
                console.error('Error parsing core story concept from localStorage:', error);
                // Handle error by asking for a new core story concept
                setContext((prev) => ({
                  ...prev,
                  coreStoryConcept: '',
                }));

                setMessages((msgs) => [
                  ...msgs,
                  {
                    role: 'assistant',
                    content: 'Error loading saved Core Story Concept. Please create a new one.',
                  },
                ]);
                setStep(-1); // Special step to handle manual CSC input
                return;
              }
            } else {
              // No saved concept found
              setContext((prev) => ({
                ...prev,
                coreStoryConcept: '',
              }));

              setMessages((msgs) => [
                ...msgs,
                {
                  role: 'assistant',
                  content: 'No saved Core Story Concept found. Please create a new one.',
                },
              ]);
              setStep(-1); // Special step to handle manual CSC input
              return;
            }
          }
        } else {
          // User wants to provide new one, ask for it
          setMessages((msgs) => [
            ...msgs,
            {
              role: 'assistant',
              content:
                "Please enter the Core Story Concept you'd like to use to guide the story flow.",
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

          // Parse the content to extract different sections
          const parsedContent = parseContentResponse(data.result);

          // Update state with parsed content - only add new attack points if found
          if (parsedContent.attackPoints.length > 0) {
            const cleaned = parsedContent.attackPoints.map(cleanAttackPoint);
            updateAttackPoints(cleaned, 'add');
          }
          if (parsedContent.tensionResolutionPoints.length > 0) {
            setTensionResolutionPoints(parsedContent.tensionResolutionPoints);
          }
          if (parsedContent.conclusion) {
            setConclusion(parsedContent.conclusion);
          }
          if (parsedContent.references) {
            setReferences(parsedContent.references);
          }

          // Ensure attack points are preserved after initial setup
          restoreAttackPoints();

          // Keep the old result for backward compatibility
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
          } else {
            // Add the attack point follow-up question after Story Flow Outline is created
            setMessages((msgs) => [
              ...msgs.slice(0, -1), // Remove "Creating..." message
              {
                role: 'assistant',
                content:
                  'Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?',
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

        // Parse the content to extract different sections
        const parsedContent = parseContentResponse(data.result);

        // Determine if this is a modification or new creation based on user input and AI response
        const previousAIMessage = messages.length >= 2 ? messages[messages.length - 2] : null;

        if (parsedContent.attackPoints.length > 0) {
          const cleaned = parsedContent.attackPoints.map(cleanAttackPoint);
          if (previousAIMessage && previousAIMessage.content.includes('modif')) {
            updateAttackPoints(cleaned, 'modify');
          } else {
            // Default to 'add' so Attack Point #1, #2, etc., accumulate
            updateAttackPoints(cleaned, 'add');
          }
        }

        // Always restore attack points before updating other content to prevent loss
        // restoreAttackPoints();

        if (parsedContent.tensionResolutionPoints.length > 0) {
          setTensionResolutionPoints(parsedContent.tensionResolutionPoints);
          // Ensure attack points are still there after setting tension-resolution points
          // restoreAttackPoints();
        }
        if (parsedContent.conclusion) {
          setConclusion(parsedContent.conclusion);
        }
        if (parsedContent.references) {
          setReferences(parsedContent.references);
        }

        // Final restoration to ensure attack points are never lost
        // restoreAttackPoints();

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
          src="/core_story_concept_new.png"
          alt="Story Flow Map"
          width={72}
          height={72}
          className="w-18 h-18"
        />
      }
      sectionName="Story Flow Map"
      taskName={
        <span
          onClick={handleTitleClick}
          className="cursor-pointer hover:text-blue-600 transition-colors"
          title="Click to view saved tension-resolution outlines"
        >
          Create story flow outline
        </span>
      }
    >
      <div className="flex gap-2 h-full">
        {/* Chat Interface - Left Side */}
        <div className="w-1/2 h-full">
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

        {/* Result Section - Right Side - Wider */}
        <div className="w-1/2 h-full" id="results-section">
          {attackPoints.length > 0 ||
          tensionResolutionPoints.length > 0 ||
          conclusion ||
          references ||
          result ? (
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-blue-900">Story Flow Outline</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {(selectedAttackPoint ? 1 : 0) + selectedTensionPoints.size} selected
                  </span>
                  {(selectedAttackPoint || selectedTensionPoints.size > 0) && (
                    <button
                      onClick={handleSaveSelected}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Save Selected
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6 overflow-y-auto flex-1">
                {/* Attack Points */}
                {attackPoints.map((attackPoint, index) => (
                  <div
                    key={`attack-${index}`}
                    className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        id={`attack-${index}`}
                        name="attackPoint"
                        checked={selectedAttackPoint === index.toString()}
                        onChange={() => handleAttackPointSelection(index)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">
                          Attack Point #{index + 1}
                        </h3>
                        <pre className="text-gray-800 whitespace-pre-wrap font-sans">
                          {attackPoint.replace(
                            /^\*{0,2}Attack Point #\d+\*{0,2}:?\s*\n?/i,
                            ''
                          )}{' '}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Tension-Resolution Points */}
                {tensionResolutionPoints.map((point, index) => (
                  <div
                    key={`tension-${index}`}
                    className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`tension-${index}`}
                        checked={selectedTensionPoints.has(index.toString())}
                        onChange={(e) => handleTensionPointSelection(index, e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">
                          Tension-Resolution #{index + 1}
                        </h3>
                        <pre className="text-gray-800 whitespace-pre-wrap font-sans">
                          {point.replace(/^\*?\*?Tension-Resolution #\d+.*?\n?/i, '')}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Conclusion */}
                {conclusion && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Conclusion</h3>
                    <pre className="text-gray-800 whitespace-pre-wrap font-sans">{conclusion}</pre>
                  </div>
                )}

                {/* References */}
                {references && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">References</h3>
                    <pre className="text-gray-800 whitespace-pre-wrap font-sans">{references}</pre>
                  </div>
                )}

                {/* Fallback for old result format */}
                {result &&
                  attackPoints.length === 0 &&
                  tensionResolutionPoints.length === 0 &&
                  !conclusion &&
                  !references && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <pre className="text-gray-800 whitespace-pre-wrap font-sans">{result}</pre>
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div></div>
            // <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex items-center justify-center">
            //   <p className="text-gray-500 text-center">
            //     Story Flow Outline will appear here once generated
            //   </p>
            // </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
