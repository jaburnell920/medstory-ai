'use client';

import { useState, useEffect } from 'react';
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
  const [context, setContext] = useState({
    coreStoryConcept: '',
    audience: '',
    interventionName: '',
    diseaseCondition: '',
  });

  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([]);

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
    'Do you want to use the currently selected Core Story Concept or provide a new one? ay',
    'Who is your Audience?',
    'What is your Intervention Name?',
    'What is the Disease or Condition?',
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

  // Helper function to safely update attack points with persistent backup
  const updateAttackPoints = (
    newPoints: string[],
    mode: 'replace' | 'add' | 'modify' = 'replace'
  ) => {
    if (mode === 'add') {
      const updatedPoints = [...persistentAttackPoints, ...newPoints];
      setAttackPoints(updatedPoints);
      setPersistentAttackPoints(updatedPoints);
    } else if (mode === 'modify') {
      const updatedPoints = [...persistentAttackPoints];
      if (updatedPoints.length > 0 && newPoints.length > 0) {
        // Replace last attack point with the modified version
        updatedPoints[updatedPoints.length - 1] = newPoints[0];
      }
      setAttackPoints(updatedPoints);
      setPersistentAttackPoints(updatedPoints);
    } else {
      setAttackPoints(newPoints);
      setPersistentAttackPoints(newPoints);
    }
  };

  // Helper function to restore attack points from persistent storage
  const restoreAttackPoints = () => {
    if (persistentAttackPoints.length > 0) {
      setAttackPoints(persistentAttackPoints);
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
            attackPointsFound.push(currentContent.join('\n').trim());
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
            attackPointsFound.push(currentContent.join('\n').trim());
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
            attackPointsFound.push(currentContent.join('\n').trim());
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
            attackPointsFound.push(currentContent.join('\n').trim());
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
        attackPointsFound.push(currentContent.join('\n').trim());
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
            updateAttackPoints(parsedContent.attackPoints, 'add');
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

        // Determine if this is a modification or new creation based on user input
        const isModifyingAttackPoint = trimmed.toLowerCase().includes('modif');
        // const isCreatingNewAttackPoint = trimmed.toLowerCase().includes('new') || trimmed.toLowerCase().includes('create');

        if (parsedContent.attackPoints.length > 0) {
          if (isModifyingAttackPoint) {
            updateAttackPoints(parsedContent.attackPoints, 'modify');
          } else {
            // Default to 'add' so Attack Point #1, #2, etc., accumulate
            updateAttackPoints(parsedContent.attackPoints, 'add');
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
        {(attackPoints.length > 0 ||
          tensionResolutionPoints.length > 0 ||
          conclusion ||
          references ||
          result) && (
          <div className="flex-1 space-y-6">
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md space-y-6">
              <h2 className="text-xl font-bold text-blue-900">Story Flow Outline</h2>

              {/* Attack Points */}
              {attackPoints.map((attackPoint, index) => (
                <div
                  key={`attack-${index}`}
                  className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                >
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Attack Point #{index + 1}
                  </h3>
                  <pre className="text-gray-800 whitespace-pre-wrap font-sans">
                    {attackPoint.replace(/^\*{0,2}Attack Point #\d+\*{0,2}:?\s*\n?/i, '')}{' '}
                  </pre>
                </div>
              ))}

              {/* Tension-Resolution Points */}
              {tensionResolutionPoints.map((point, index) => (
                <div
                  key={`tension-${index}`}
                  className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                >
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Tension-Resolution #{index + 1}
                  </h3>
                  <pre className="text-gray-800 whitespace-pre-wrap font-sans">
                    {point.replace(/^\*?\*?Tension-Resolution #\d+.*?\n?/i, '')}
                  </pre>
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
        )}
      </div>
    </PageLayout>
  );
}
