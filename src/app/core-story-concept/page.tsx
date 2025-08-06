'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

interface CoreStoryConcept {
  id: string;
  content: string;
  disease: string;
  drug: string;
  audience: string;
  length: string;
  conceptNumber: number;
}

export default function CoreStoryConcept() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [context, setContext] = useState({
    disease: '',
    drug: '',
    audience: '',
    length: '',
  });

  // State for managing multiple core story concepts
  const [concepts, setConcepts] = useState<CoreStoryConcept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string>('');
  const [nextConceptNumber, setNextConceptNumber] = useState<number>(1);
  const [currentlyModifyingConcept, setCurrentlyModifyingConcept] =
    useState<CoreStoryConcept | null>(null);

  // Ref for auto-scrolling the results section
  const resultsScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content is generated
  useEffect(() => {
    if (resultsScrollRef.current && concepts.length > 0) {
      resultsScrollRef.current.scrollTop = resultsScrollRef.current.scrollHeight;
    }
  }, [concepts]);

  // Load saved concepts on component mount and clear generated results on page refresh
  useEffect(() => {
    // Always start with concept #1 for a new session
    setNextConceptNumber(1);

    // Clear any existing concepts data to ensure we start fresh
    localStorage.removeItem('coreStoryConceptsData');

    // We don't need to set the next concept number based on saved concepts anymore
    // This ensures we always start with #1

    const handleBeforeUnload = () => {
      // Clear the generated results but keep saved concepts
      setResult('');
      setStep(0);
      setLoading(false);
      setMessages([
        {
          role: 'assistant',
          content: 'What is the disease state?',
        },
      ]);
      setContext({
        disease: '',
        drug: '',
        audience: '',
        length: '',
      });
      setInput('');
      // Clear the generated concepts from display but keep saved concepts in localStorage
      setConcepts([]);
      setSelectedConcept('');
      setNextConceptNumber(1);
      setCurrentlyModifyingConcept(null);
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([
    {
      role: 'assistant',
      content: 'What is the disease state?',
    },
  ]);

  const handleReset = () => {
    setStep(0);
    setInput('');
    setLoading(false);
    setResult('');
    setContext({
      disease: '',
      drug: '',
      audience: '',
      length: '',
    });
    setMessages([
      {
        role: 'assistant',
        content: 'What is the disease state?',
      },
    ]);
    // Clear the generated concepts from display but keep saved concepts in localStorage
    setConcepts([]);
    setSelectedConcept('');
    setNextConceptNumber(1);
    setCurrentlyModifyingConcept(null);
  };

  // Function to handle selecting a concept
  const handleSelectConcept = (conceptId: string) => {
    setSelectedConcept(conceptId);

    // Save to localStorage
    localStorage.setItem('selectedCoreStoryConcept', conceptId);

    // Also save the selected concept data for the saved page
    const selectedConceptData = concepts.find((concept) => concept.id === conceptId);
    if (selectedConceptData) {
      localStorage.setItem('selectedCoreStoryConceptData', JSON.stringify(selectedConceptData));
    }

    toast.success('Core Story Concept selected!');
  };

  // Handle saving selected concept to localStorage (explicit save action)
  const handleSaveSelected = () => {
    if (!selectedConcept) return;

    // Find the selected concept data
    const selectedConceptData = concepts.find((concept) => concept.id === selectedConcept);
    if (!selectedConceptData) return;

    // Save to localStorage (same as selection, but with different toast message)
    localStorage.setItem('selectedCoreStoryConceptData', JSON.stringify(selectedConceptData));
    localStorage.setItem('selectedCoreStoryConcept', selectedConcept);

    // Show success message
    toast.success('Core story concept saved successfully!');
  };

  // Handle clicking on title to access saved page
  const handleTitleClick = () => {
    window.location.href = '/core-story-concept/saved';
  };

  const questions = [
    'What is the disease state?',
    'What is the therapeutic intervention?',
    'Who is the audience?',
    'Would you like a concise or full-length Core Story Concept?',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    const trimmed = input.trim();

    // Check if we're in the post-generation phase
    if (
      result &&
      messages.length > 0 &&
      (messages[messages.length - 1].content.includes(
        'Would you like to modify this Core Story Concept'
      ) ||
        messages[messages.length - 1].content.includes("I've created a new Core Story Concept") ||
        messages[messages.length - 1].content.includes("I've modified the Core Story Concept"))
    ) {
      setLoading(true);

      if (trimmed.toLowerCase().includes('modify')) {
        // Set the currently modifying concept to the most recent one
        if (concepts.length > 0) {
          setCurrentlyModifyingConcept(concepts[concepts.length - 1]);
        }
        // Ask for modifications without showing "Ok, here we go"
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'What modifications would you like to make?',
          },
        ]);
        setLoading(false);
        return;
      } else if (trimmed.toLowerCase().includes('new')) {
        // Generate a new concept
        try {
          const res = await fetch('/api/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a multidisciplinary medical storyteller hired to create a Core Story Concept.',
                },
                {
                  role: 'user',
                  content: `Create a new Core Story Concept Candidate #${nextConceptNumber} for ${context.drug} in ${context.disease} for the target audience ${context.audience} with a length of ${context.length}.`,
                },
              ],
              disease: context.disease,
              drug: context.drug,
              audience: context.audience,
              length: context.length,
            }),
          });

          const data = await res.json();
          setResult(data.result);

          // Create a new concept
          const newConcept: CoreStoryConcept = {
            id: `concept-${Date.now()}`,
            content: data.result,
            disease: context.disease,
            drug: context.drug,
            audience: context.audience,
            length: context.length,
            conceptNumber: concepts.length === 0 ? 1 : nextConceptNumber,
          };

          setConcepts((prevConcepts) => {
            const updatedConcepts = [...prevConcepts, newConcept];
            // Save to localStorage
            localStorage.setItem('coreStoryConceptsData', JSON.stringify(updatedConcepts));
            return updatedConcepts;
          });

          // Auto-select the new concept and increment the next concept number
          setSelectedConcept(newConcept.id);
          localStorage.setItem('selectedCoreStoryConcept', newConcept.id);
          localStorage.setItem('selectedCoreStoryConceptData', JSON.stringify(newConcept));
          setNextConceptNumber(nextConceptNumber + 1);

          setMessages([
            ...newMessages,
            {
              role: 'assistant',
              content:
                "I've created a new Core Story Concept. Would you like to modify this Core Story Concept or create a new one?",
            },
          ]);
        } catch (err) {
          toast.error('Something went wrong.');
          console.error(err);
        } finally {
          setLoading(false);
        }
        return;
      } else if (trimmed.toLowerCase().includes('no')) {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content:
              'Got it. Would you like to see a table with all the Core Story Concept Candidates?',
          },
        ]);
        setLoading(false);
        return;
      }
      return;
    }

    // Check if we're in the table request phase
    if (
      result &&
      messages.length > 0 &&
      messages[messages.length - 1].content.includes(
        'Would you like to see a table with all the Core Story Concept Candidates?'
      )
    ) {
      if (trimmed.toLowerCase().includes('yes')) {
        // Generate table content from concepts
        let tableContent = 'Here is a table with all the Core Story Concept Candidates:\n\n';
        tableContent += '| # | Tension | Resolution |\n';
        tableContent += '|---|---------|------------|\n';

        concepts.forEach((concept, index) => {
          // Extract tension and resolution from concept content
          // First, clean the content by removing asterisks, quotation marks, and colons
          const cleanedContent = concept.content.replace(/[*"':]/g, '');
          const lines = cleanedContent.split('\n');
          let tension = '';
          let resolution = '';
          let currentSection = '';

          lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine.toUpperCase().includes('TENSION')) {
              currentSection = 'tension';
            } else if (trimmedLine.toUpperCase().includes('RESOLUTION')) {
              currentSection = 'resolution';
            } else if (trimmedLine && currentSection === 'tension') {
              tension += trimmedLine + ' ';
            } else if (trimmedLine && currentSection === 'resolution') {
              resolution += trimmedLine + ' ';
            }
          });

          tableContent += `| ${index + 1} | ${tension.trim()} | ${resolution.trim()} |\n`;
        });

        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: tableContent,
          },
        ]);
      }
      setLoading(false);
      return;
    }

    // Check if we're in the modification phase
    if (
      result &&
      messages.length > 0 &&
      messages[messages.length - 1].content.includes('What modifications would you like to make?')
    ) {
      setLoading(true);
      try {
        const res = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content:
                  'You are a multidisciplinary medical storyteller hired to create a Core Story Concept.',
              },
              {
                role: 'user',
                content: `Modify this Core Story Concept Candidate #${currentlyModifyingConcept ? currentlyModifyingConcept.conceptNumber : 1} for ${context.drug} in ${context.disease} based on the following feedback: ${trimmed}. Keep the length at ${context.length}. Keep the same candidate number in the response.`,
              },
              {
                role: 'assistant',
                content: result,
              },
            ],
            disease: context.disease,
            drug: context.drug,
            audience: context.audience,
            length: context.length,
          }),
        });

        const data = await res.json();
        setResult(data.result);

        // Update the specific concept being modified instead of creating a new one
        setConcepts((prevConcepts) => {
          const updatedConcepts = [...prevConcepts];
          if (currentlyModifyingConcept) {
            const conceptIndex = updatedConcepts.findIndex(
              (c) => c.id === currentlyModifyingConcept.id
            );
            if (conceptIndex !== -1) {
              updatedConcepts[conceptIndex] = {
                ...updatedConcepts[conceptIndex],
                content: data.result,
              };
            }
          }
          // Save to localStorage
          localStorage.setItem('coreStoryConceptsData', JSON.stringify(updatedConcepts));
          return updatedConcepts;
        });

        // Update the selected concept data if it's the one being modified
        if (currentlyModifyingConcept && selectedConcept === currentlyModifyingConcept.id) {
          const updatedConcept = { ...currentlyModifyingConcept, content: data.result };
          localStorage.setItem('selectedCoreStoryConceptData', JSON.stringify(updatedConcept));
        }

        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content:
              "I've modified the Core Story Concept. Would you like to modify this Core Story Concept or create a new one?",
          },
        ]);
      } catch (err) {
        toast.error('Something went wrong.');
        console.error(err);
      } finally {
        setLoading(false);
        // Clear the tracking state after modification is complete
        setCurrentlyModifyingConcept(null);
      }
      return;
    }

    // Initial questionnaire flow
    if (step === 0) setContext((prev) => ({ ...prev, disease: trimmed }));
    if (step === 1) setContext((prev) => ({ ...prev, drug: trimmed }));
    if (step === 2) setContext((prev) => ({ ...prev, audience: trimmed }));
    if (step === 3) {
      // Process the length preference
      let lengthValue;
      if (trimmed.toLowerCase().includes('concise')) {
        lengthValue = '25';
      } else if (trimmed.toLowerCase().includes('full')) {
        lengthValue = '50';
      } else {
        // If the user's response is unclear, set a default
        lengthValue = '40';
      }
      setContext((prev) => ({ ...prev, length: lengthValue }));
    }

    // Only proceed with initial generation if we're in the initial questionnaire flow
    // and not in the post-generation modification phase
    if (step === 3 && !result) {
      setMessages([...newMessages, { role: 'assistant', content: 'Ok, here we go' }]);
      setLoading(true);

      try {
        const res = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content:
                  'You are a multidisciplinary medical storyteller hired to create a Core Story Concept.',
              },
              {
                role: 'user',
                content: `Create a Core Story Concept Candidate #1 for ${context.drug} in ${context.disease} for the target audience ${context.audience} with a length of ${context.length}.`,
              },
            ],
            disease: context.disease,
            drug: context.drug,
            audience: context.audience,
            length: context.length,
          }),
        });

        const data = await res.json();
        setResult(data.result);

        // Create a new concept and add it to the concepts array
        const newConcept: CoreStoryConcept = {
          id: `concept-${Date.now()}`,
          content: data.result,
          disease: context.disease,
          drug: context.drug,
          audience: context.audience,
          length: context.length,
          conceptNumber: concepts.length === 0 ? 1 : nextConceptNumber,
        };

        setConcepts((prevConcepts) => {
          const updatedConcepts = [...prevConcepts, newConcept];
          // Save to localStorage
          localStorage.setItem('coreStoryConceptsData', JSON.stringify(updatedConcepts));
          return updatedConcepts;
        });

        // Auto-select the new concept and increment the next concept number
        setSelectedConcept(newConcept.id);
        localStorage.setItem('selectedCoreStoryConcept', newConcept.id);
        localStorage.setItem('selectedCoreStoryConceptData', JSON.stringify(newConcept));
        setNextConceptNumber(nextConceptNumber + 1);

        // Add the follow-up question
        setMessages((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: 'Would you like to modify this Core Story Concept or create a new one?',
          },
        ]);
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
  };

  return (
    <PageLayout
      sectionIcon={
        <Image
          src="/csc_icon.png"
          alt="Core Story Chat"
          width={72}
          height={72}
          className="w-28 h-32"
        />
      }
      sectionName="Core Story Concept"
      taskName={
        <span
          onClick={handleTitleClick}
          className="cursor-pointer hover:text-blue-600 transition-colors"
          title="Click to view saved concepts"
        >
          Create Core Story Concept options
        </span>
      }
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
            showInput={true}
            placeholder="Type your response..."
            onReset={handleReset}
          />
        </div>

        {/* Result Section - Right Side - Fixed */}
        <div className="flex-1 h-full">
          {concepts.length > 0 ? (
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-blue-900">Core Story Concepts</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {selectedConcept ? '1 selected' : '0 selected'}
                  </span>
                  {selectedConcept && (
                    <button
                      onClick={handleSaveSelected}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Save Selected
                    </button>
                  )}
                </div>
              </div>

              <div ref={resultsScrollRef} className="space-y-4 overflow-y-auto flex-1">
                {concepts.map((concept) => (
                  <div
                    key={concept.id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        id={concept.id}
                        name="coreStoryConcept"
                        checked={selectedConcept === concept.id}
                        onChange={() => handleSelectConcept(concept.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {concept.content
                            ? concept.content
                                // Remove all asterisks, quotation marks, and colons from the output text
                                .replace(/[*"':]/g, '')
                                // Ensure consistent formatting for TENSION title
                                .replace(
                                  /^TENSION.*$/gim,
                                  '<div class="font-bold text-blue-800 text-base mt-6 mb-4">TENSION</div>\n'
                                )
                                // Ensure consistent formatting for RESOLUTION title
                                .replace(
                                  /^RESOLUTION.*$/gim,
                                  '<div class="font-bold text-blue-800 text-base mt-6 mb-4">RESOLUTION</div>\n'
                                )
                                // Ensure every CSC has a title with consistent formatting
                                .replace(
                                  /^Core Story Concept Candidate #\d+.*$/gim,
                                  () =>
                                    `<div class="font-bold text-blue-800 text-lg mb-4">Core Story Concept #${concept.conceptNumber}</div>`
                                )
                                // Add title if missing
                                .replace(
                                  /^(?!<div class="font-bold text-blue-800 text-lg mb-4">Core Story Concept Candidate)/,
                                  () => {
                                    if (!concept.content.includes('Core Story Concept Candidate')) {
                                      return `<div class="font-bold text-blue-800 text-lg mb-4">Core Story Concept Candidate b#${concept.conceptNumber}</div>\n`;
                                    }
                                    return '';
                                  }
                                )
                                .replace(/##/g, '') // Remove all occurrences of ##
                                .split('\n')
                                .map((line, i) => (
                                  <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
                                ))
                            : 'No content available'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div></div>
            // <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex items-center justify-center">
            //   <p className="text-gray-500 text-center">
            //     Core Story Concepts will appear here once generated
            //   </p>
            // </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
