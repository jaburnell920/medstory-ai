'use client';

import { useState, useEffect } from 'react';
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
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  // Load selected concept from session storage on component mount
  useEffect(() => {
    const savedSelected = sessionStorage.getItem('selectedCoreStoryConcept');
    if (savedSelected) {
      setSelectedConceptId(savedSelected);
    }

    const savedConcepts = sessionStorage.getItem('coreStoryConceptsData');
    if (savedConcepts) {
      const parsedConcepts = JSON.parse(savedConcepts);
      setConcepts(parsedConcepts);
      
      // If we have concepts, set up the state to show the modification interface
      if (parsedConcepts.length > 0) {
        const firstConcept = parsedConcepts[0];
        setContext({
          disease: firstConcept.disease,
          drug: firstConcept.drug,
          audience: firstConcept.audience,
          length: firstConcept.length,
        });
        setResult(firstConcept.content);
        setStep(4); // Set to post-questionnaire state
        setMessages([
          {
            role: 'assistant',
            content: 'Would you like to modify this Core Story Concept or create a new one?',
          },
        ]);
      }
    }
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
    // Don't reset concepts or selected concepts to preserve user selections
    setCurrentConceptIndex(0);
  };

  // Function to handle selecting a concept (radio button behavior)
  const handleSelectConcept = (conceptId: string) => {
    setSelectedConceptId(conceptId);

    // Save to session storage
    sessionStorage.setItem('selectedCoreStoryConcept', conceptId);

    toast.success('Core Story Concept selected!');
  };

  // Navigation functions for concepts
  const goToNextConcept = () => {
    if (concepts.length > 0) {
      setCurrentConceptIndex((prevIndex) =>
        prevIndex === concepts.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const goToPreviousConcept = () => {
    if (concepts.length > 0) {
      setCurrentConceptIndex((prevIndex) =>
        prevIndex === 0 ? concepts.length - 1 : prevIndex - 1
      );
    }
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
      messages[messages.length - 1].content ===
        'Would you like to modify this Core Story Concept or create a new one?'
    ) {
      setLoading(true);

      if (trimmed.toLowerCase().includes('modify')) {
        // Ask for modifications
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'What modifications would you like to make?',
          },
        ]);
        setLoading(false);
        return;
      } else if (!trimmed.toLowerCase().includes('new') && !trimmed.toLowerCase().includes('no')) {
        // Treat any other input as a direct modification request
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
                  content: `Modify this Core Story Concept for ${context.drug} in ${context.disease} based on the following feedback: ${trimmed}. Keep the length at ${context.length}.`,
                },
                {
                  role: 'assistant',
                  content: concepts.length > 0 ? concepts[currentConceptIndex]?.content : result,
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

          // Update the existing concept instead of creating a new one
          setConcepts((prevConcepts) => {
            const updatedConcepts = [...prevConcepts];
            if (updatedConcepts[currentConceptIndex]) {
              updatedConcepts[currentConceptIndex] = {
                ...updatedConcepts[currentConceptIndex],
                content: data.result,
              };
            }
            // Save to session storage
            sessionStorage.setItem('coreStoryConceptsData', JSON.stringify(updatedConcepts));
            return updatedConcepts;
          });

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
        }
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
                  content: `Create a new Core Story Concept for ${context.drug} in ${context.disease} for the target audience ${context.audience} with a length of ${context.length}.`,
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
          };

          setConcepts((prevConcepts) => {
            const updatedConcepts = [...prevConcepts, newConcept];
            // Save to session storage
            sessionStorage.setItem('coreStoryConceptsData', JSON.stringify(updatedConcepts));
            // Set the current index to the new concept
            setCurrentConceptIndex(updatedConcepts.length - 1);
            // Auto-select the new concept
            setSelectedConceptId(newConcept.id);
            return updatedConcepts;
          });

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
      messages[messages.length - 1].content ===
        'Got it. Would you like to see a table with all the Core Story Concept Candidates?'
    ) {
      if (trimmed.toLowerCase().includes('yes')) {
        // Here we would normally create a table, but for now we'll just acknowledge
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'Here is a table with all the Core Story Concept Candidates.',
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
      messages[messages.length - 1].content === 'What modifications would you like to make?'
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
                content: `Modify this Core Story Concept for ${context.drug} in ${context.disease} based on the following feedback: ${trimmed}. Keep the length at ${context.length}.`,
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

        // Update the existing concept instead of creating a new one
        setConcepts((prevConcepts) => {
          const updatedConcepts = [...prevConcepts];
          if (updatedConcepts[currentConceptIndex]) {
            updatedConcepts[currentConceptIndex] = {
              ...updatedConcepts[currentConceptIndex],
              content: data.result,
            };
          }
          // Save to session storage
          sessionStorage.setItem('coreStoryConceptsData', JSON.stringify(updatedConcepts));
          return updatedConcepts;
        });

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
      }
      return;
    }

    // Initial questionnaire flow
    if (step === 0) setContext((prev) => ({ ...prev, disease: trimmed }));
    if (step === 1) setContext((prev) => ({ ...prev, drug: trimmed }));
    if (step === 2) setContext((prev) => ({ ...prev, audience: trimmed }));
    if (step === 3) {
      // Process the length preference
      const lengthValue = trimmed.toLowerCase().includes('concise') ? '<25 words' : '40-60 words';
      setContext((prev) => ({ ...prev, length: lengthValue }));
    }

    if (step === 3) {
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
                content: `Create a Core Story Concept for ${context.drug} in ${context.disease} for the target audience ${context.audience} with a length of ${context.length}.`,
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
        };

        setConcepts((prevConcepts) => {
          const updatedConcepts = [...prevConcepts, newConcept];
          // Save to session storage
          sessionStorage.setItem('coreStoryConceptsData', JSON.stringify(updatedConcepts));
          // Set the current index to the new concept
          setCurrentConceptIndex(updatedConcepts.length - 1);
          // Auto-select the new concept
          setSelectedConceptId(newConcept.id);
          return updatedConcepts;
        });

        // Automatically add the "Would you like to modify..." message
        setMessages((prevMessages) => [
          ...prevMessages,
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
          src="/core_story_chat.png"
          alt="Core Story Chat"
          width={72}
          height={72}
          className="w-18 h-18"
        />
      }
      sectionName="Core Story Concept"
      taskName="Create Core Story Concept options"
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
            showInput={true}
            placeholder="Type your response..."
            onReset={handleReset}
          />
        </div>

        {/* Result Section - Right Side */}
        {(result || concepts.length > 0) && (
          <div className="flex-1 space-y-6">
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md space-y-6">
              <h2 className="text-xl font-bold text-blue-600 bg-blue-50 p-2 rounded">
                Core Story Concept Candidate #{concepts.length > 0 ? currentConceptIndex + 1 : 1}
              </h2>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {concepts.length > 0 ? concepts[currentConceptIndex]?.content : result}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {/* Radio button for selection */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <input
                    type="radio"
                    id={`concept-${concepts.length > 0 ? concepts[currentConceptIndex]?.id : 'current'}`}
                    name="selectedConcept"
                    checked={
                      concepts.length > 0
                        ? selectedConceptId === concepts[currentConceptIndex]?.id
                        : false
                    }
                    onChange={() => {
                      if (concepts.length > 0) {
                        handleSelectConcept(concepts[currentConceptIndex].id);
                      } else if (result) {
                        // If we have a result but it's not yet in concepts array
                        const newConcept: CoreStoryConcept = {
                          id: `concept-${Date.now()}`,
                          content: result,
                          disease: context.disease,
                          drug: context.drug,
                          audience: context.audience,
                          length: context.length,
                        };

                        setConcepts((prevConcepts) => {
                          const updatedConcepts = [...prevConcepts, newConcept];
                          sessionStorage.setItem(
                            'coreStoryConceptsData',
                            JSON.stringify(updatedConcepts)
                          );
                          return updatedConcepts;
                        });

                        handleSelectConcept(newConcept.id);
                      }
                    }}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                  />
                  <label
                    htmlFor={`concept-${concepts.length > 0 ? concepts[currentConceptIndex]?.id : 'current'}`}
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Select This Core Story Concept
                  </label>
                </div>

                {/* Navigation buttons */}
                {concepts.length > 1 && (
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={goToPreviousConcept}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                    >
                      Previous Core Story Concept
                    </button>
                    <button
                      onClick={goToNextConcept}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                    >
                      Next Core Story Concept
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
