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

  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set());

  // Load selected concepts from session storage on component mount
  useEffect(() => {
    const savedSelected = sessionStorage.getItem('selectedCoreStoryConcepts');
    if (savedSelected) {
      setSelectedConcepts(new Set(JSON.parse(savedSelected)));
    }

    const savedConcepts = sessionStorage.getItem('coreStoryConceptsData');
    if (savedConcepts) {
      setConcepts(JSON.parse(savedConcepts));
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
  };

  // Function to handle selecting a concept
  const handleSelectConcept = (conceptId: string) => {
    const newSelected = new Set(selectedConcepts);

    if (newSelected.has(conceptId)) {
      newSelected.delete(conceptId);
    } else {
      newSelected.add(conceptId);
    }

    setSelectedConcepts(newSelected);

    // Save to session storage
    sessionStorage.setItem('selectedCoreStoryConcepts', JSON.stringify(Array.from(newSelected)));

    toast.success(
      newSelected.has(conceptId) ? 'Core Story Concept selected!' : 'Core Story Concept unselected'
    );
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
                  content: `Create a new Core Story Concept Candidate #${concepts.length + 1} for ${context.drug} in ${context.disease} for the target audience ${context.audience} with a length of ${context.length}.`,
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
        // Generate table content from concepts
        let tableContent = 'Here is a table with all the Core Story Concept Candidates:\n\n';
        tableContent += '| # | Tension | Resolution |\n';
        tableContent += '|---|---------|------------|\n';

        concepts.forEach((concept, index) => {
          // Extract tension and resolution from concept content
          const lines = concept.content.split('\n');
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
                content: `Modify this Core Story Concept Candidate #${concepts.length + 1} for ${context.drug} in ${context.disease} based on the following feedback: ${trimmed}. Keep the length at ${context.length}.`,
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

        // Update the most recent concept instead of creating a new one
        setConcepts((prevConcepts) => {
          const updatedConcepts = [...prevConcepts];
          if (updatedConcepts.length > 0) {
            const lastIndex = updatedConcepts.length - 1;
            updatedConcepts[lastIndex] = {
              ...updatedConcepts[lastIndex],
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
        };

        setConcepts((prevConcepts) => {
          const updatedConcepts = [...prevConcepts, newConcept];
          // Save to session storage
          sessionStorage.setItem('coreStoryConceptsData', JSON.stringify(updatedConcepts));
          return updatedConcepts;
        });

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
        {concepts.length > 0 && (
          <div className="flex-1 space-y-4">
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-900">Core Story Concepts</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{selectedConcepts.size} selected</span>
                </div>
              </div>

              <div className="space-y-4">
                {concepts.map((concept) => (
                  <div
                    key={concept.id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={concept.id}
                        checked={selectedConcepts.has(concept.id)}
                        onChange={() => handleSelectConcept(concept.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {concept.content
                            .replace(
                              /\*\*TENSION\*\*/g,
                              '<span class="font-bold text-blue-800 block mt-4 mb-2">TENSION</span>'
                            )
                            .replace(
                              /\*\*RESOLUTION\*\*/g,
                              '<span class="font-bold text-blue-800 block mt-4 mb-2">RESOLUTION</span>'
                            )
                            .replace(
                              /Core Story Concept Candidate #\d+/g,
                              (match) =>
                                `<span class="font-bold text-blue-800 text-lg">${match}</span>`
                            )
                            .replace(/##/g, '') // Remove all occurrences of ##
                            .split('\n')
                            .map((line, i) => (
                              <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
                            ))}
                        </div>
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
