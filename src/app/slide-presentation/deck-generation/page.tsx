'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

const questions = [
  'Who is your target audience? (eg, PCPs, CARDs, specialists, patients, general public)',
  'How long is the presentation? (in minutes)',
  "What's the maximum number of slides for the presentation? (none or specify number)",
  'What is your desired tone? (eg, provocative, academic, friendly, calm - or a combination)',
  'How visual should it be? (e.g. minimal, moderate visuals, highly visual)',
  'Do you want me to write speaker notes for each slide? (Y/N)',
];

// Soft clean for display (non-destructive)
const softClean = (content: string): string =>
  (content || '')
    .replace(/\*\*(.*?)\*\*/g, '$1') // drop **bold**
    .replace(/\n{3,}/g, '\n\n') // collapse blank lines
    .trim();

// Replace labels with styled HTML, make punctuation optional, and add a blank line after each label
const styleLabelsHtml = (content: string): string => {
  const esc = (content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Optional: style "Slide N: Title"
  const withStyledHeaders = esc.replace(
    /(^|\r?\n)(\s*Slide\s*\d+\s*:\s*[^\r\n]+)/gi,
    (_m, ls, header) => `${ls}<span class="font-bold text-blue-900">${header}</span>`
  );

  // Style section labels at line start; accept optional :, -, – or — and any spacing
  // Also force a colon and add an extra newline so there's an empty line underneath
  const labelRegex = /(^|\r?\n)(\s*)(TEXT|VISUALS|SPEAKER\s*NOTES|REFERENCES)\s*(?:[:\-–—])?/gi;

  const withStyledLabels = withStyledHeaders.replace(
    labelRegex,
    (_m, ls, indent, label) =>
      `${ls}${indent}<span class="font-bold text-blue-700">${label.replace(/\s+/g, ' ').toUpperCase()}:</span>\n\n`
  );

  return withStyledLabels;
};

export default function DeckGenerationPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([
    {
      role: 'assistant',
      content: 'Checking for Core Story Concept and Story Flow Outline...',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [hasRequiredConcepts, setHasRequiredConcepts] = useState(false);
  const [generationFailed, setGenerationFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState('');
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Streaming controller
  const streamControllerRef = useRef<AbortController | null>(null);

  // Stream helper
  async function streamDeckGeneration({
    detailedPrompt,
    answers,
    onStart,
    onChunk,
    onError,
    onDone,
  }: {
    detailedPrompt: string;
    answers: string[];
    onStart?: () => void;
    onChunk?: (text: string) => void;
    onError?: (message: string) => void;
    onDone?: () => void;
  }) {
    // Abort any in-flight request
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
    }
    const controller = new AbortController();
    streamControllerRef.current = controller;

    try {
      onStart?.();

      const res = await fetch('/api/deck-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, detailedPrompt }),
        signal: controller.signal,
      });

      const contentType = res.headers.get('Content-Type') || '';

      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const data = await res.json().catch(() => ({}));
          const msg = data?.error || `Request failed: ${res.status}`;
          throw new Error(msg);
        }
        throw new Error(`Request failed: ${res.status}`);
      }

      // Streamed plaintext path
      if (contentType.startsWith('text/plain')) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let chunkCount = 0;
        let totalLength = 0;

        console.log('Starting to read deck generation stream...');
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`Stream completed. Total chunks: ${chunkCount}, total length: ${totalLength}`);
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          chunkCount++;
          totalLength += chunk.length;
          
          // Log progress every 20 chunks
          if (chunkCount % 20 === 0) {
            console.log(`Received ${chunkCount} chunks, ${totalLength} characters so far`);
          }
          
          onChunk?.(chunk);
        }
        onDone?.();
        return;
      }

      // Fallback JSON path
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onChunk?.(data.result || '');
      onDone?.();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return; // silent cancel
      const message =
        err instanceof Error ? err.message : 'Network error occurred. Please try again.';
      onError?.(message);
    } finally {
      if (streamControllerRef.current === controller) {
        streamControllerRef.current = null;
      }
    }
  }

  // Abort on unmount
  useEffect(() => {
    return () => {
      if (streamControllerRef.current) streamControllerRef.current.abort();
    };
  }, []);

  // Auto-scroll when result updates
  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  // Initial check for required concepts in localStorage
  useEffect(() => {
    const checkRequiredConcepts = () => {
      const coreStoryConceptData =
        localStorage.getItem('selectedCoreStoryConceptData') ||
        localStorage.getItem('coreStoryConcept') ||
        localStorage.getItem('selectedCoreStoryConcept');

      let hasCoreStoryConcept = false;

      if (coreStoryConceptData) {
        try {
          const conceptData = JSON.parse(coreStoryConceptData);
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
        } catch {
          if (typeof coreStoryConceptData === 'string' && coreStoryConceptData.trim().length > 0) {
            hasCoreStoryConcept = true;
          }
        }
      }

      const storyFlowData = localStorage.getItem('storyFlowData');
      const attackPointsData = localStorage.getItem('attackPoints');
      const tensionResolutionData = localStorage.getItem('tensionResolutionPoints');
      const savedTensionResolutionData = localStorage.getItem('savedTensionResolutionData');

      let hasStoryFlowOutline = false;

      if (storyFlowData) {
        try {
          const flowData = JSON.parse(storyFlowData);
          hasStoryFlowOutline =
            flowData &&
            ((flowData.attackPoints && flowData.attackPoints.length > 0) ||
              (flowData.tensionResolutionPoints && flowData.tensionResolutionPoints.length > 0));
        } catch {
          // ignore
        }
      }

      if (!hasStoryFlowOutline) {
        let hasAttackPoints = false;
        let hasTensionResolution = false;
        let hasSavedTensionResolution = false;

        if (attackPointsData) {
          try {
            const attackPoints = JSON.parse(attackPointsData);
            hasAttackPoints = attackPoints && attackPoints.length > 0;
          } catch {
            if (typeof attackPointsData === 'string' && attackPointsData.trim().length > 0) {
              hasAttackPoints = true;
            }
          }
        }

        if (tensionResolutionData) {
          try {
            const tensionResolution = JSON.parse(tensionResolutionData);
            hasTensionResolution = tensionResolution && tensionResolution.length > 0;
          } catch {
            if (
              typeof tensionResolutionData === 'string' &&
              tensionResolutionData.trim().length > 0
            ) {
              hasTensionResolution = true;
            }
          }
        }

        if (savedTensionResolutionData) {
          try {
            const savedTensionResolution = JSON.parse(savedTensionResolutionData);
            hasSavedTensionResolution = savedTensionResolution && savedTensionResolution.length > 0;
          } catch {
            if (
              typeof savedTensionResolutionData === 'string' &&
              savedTensionResolutionData.trim().length > 0
            ) {
              hasSavedTensionResolution = true;
            }
          }
        }

        hasStoryFlowOutline = hasAttackPoints || hasTensionResolution || hasSavedTensionResolution;
      }

      if (!hasCoreStoryConcept) {
        setMessages([
          {
            role: 'assistant',
            content:
              "To create a Story Flow Map, I need you to create a Core Story Concept. Please go to the Core Story Concept section of MEDSTORYAI to do this then return here and I'll be happy to generate the Story Flow Map. Thanks.",
          },
        ]);
        setInitialCheckComplete(true);
        return;
      }

      if (!hasStoryFlowOutline) {
        setMessages([
          {
            role: 'assistant',
            content:
              "To create a Story Flow Map, I need you to create a Story Flow Outline first. Please go to the Story Flow section of MEDSTORYAI to do this then return here and I'll be happy to generate the Story Flow Map. Thanks.",
          },
        ]);
        setInitialCheckComplete(true);
        return;
      }

      setHasRequiredConcepts(true);
      setMessages([
        {
          role: 'assistant',
          content:
            "Got it - you need me to generate an outline for a MEDSTORY® presentation deck. First I'll need a few bits of information to generate your optimized presentation deck. This shouldn't take long - just 6 quick questions and we'll be on our way.\n\n1. " +
            questions[0],
        },
      ]);
      setInitialCheckComplete(true);
    };

    setTimeout(checkRequiredConcepts, 1000);
  }, []);

  const handleRetry = async () => {
    setLoading(true);
    setGenerationFailed(false);
    setResult('');
    setRetryCount((prev) => prev + 1);

    // Get the stored concepts and answers
    const coreStoryConceptData =
      localStorage.getItem('selectedCoreStoryConceptData') ||
      localStorage.getItem('coreStoryConcept') ||
      localStorage.getItem('selectedCoreStoryConcept');

    let coreStoryConcept = '';
    if (coreStoryConceptData) {
      try {
        const conceptData = JSON.parse(coreStoryConceptData);
        if (conceptData && typeof conceptData === 'object' && conceptData.content) {
          coreStoryConcept = conceptData.content;
        } else if (typeof conceptData === 'string') {
          coreStoryConcept = conceptData;
        }
      } catch {
        if (typeof coreStoryConceptData === 'string') {
          coreStoryConcept = coreStoryConceptData;
        }
      }
    }

    // Get story flow outline data
    const storyFlowData = localStorage.getItem('storyFlowData');
    const attackPointsData = localStorage.getItem('attackPoints');
    const tensionResolutionData = localStorage.getItem('tensionResolutionPoints');
    const savedTensionResolutionData = localStorage.getItem('savedTensionResolutionData');

    let storyFlowOutline = '';

    if (storyFlowData) {
      try {
        const flowData = JSON.parse(storyFlowData);
        if (flowData) {
          storyFlowOutline += JSON.stringify(flowData, null, 2);
        }
      } catch {
        storyFlowOutline += storyFlowData;
      }
    }

    if (attackPointsData) {
      try {
        const attackPoints = JSON.parse(attackPointsData);
        if (attackPoints && attackPoints.length > 0) {
          storyFlowOutline += '\n\nAttack Points:\n' + JSON.stringify(attackPoints, null, 2);
        }
      } catch {
        if (typeof attackPointsData === 'string' && attackPointsData.trim().length > 0) {
          storyFlowOutline += '\n\nAttack Points:\n' + attackPointsData;
        }
      }
    }

    if (tensionResolutionData) {
      try {
        const tensionResolution = JSON.parse(tensionResolutionData);
        if (tensionResolution && tensionResolution.length > 0) {
          storyFlowOutline +=
            '\n\nTension Resolution Points:\n' + JSON.stringify(tensionResolution, null, 2);
        }
      } catch {
        if (typeof tensionResolutionData === 'string' && tensionResolutionData.trim().length > 0) {
          storyFlowOutline += '\n\nTension Resolution Points:\n' + tensionResolutionData;
        }
      }
    }

    if (savedTensionResolutionData) {
      try {
        const savedTensionResolution = JSON.parse(savedTensionResolutionData);
        if (savedTensionResolution && savedTensionResolution.length > 0) {
          storyFlowOutline +=
            '\n\nSaved Tension Resolution Data:\n' +
            JSON.stringify(savedTensionResolution, null, 2);
        }
      } catch {
        if (
          typeof savedTensionResolutionData === 'string' &&
          savedTensionResolutionData.trim().length > 0
        ) {
          storyFlowOutline += '\n\nSaved Tension Resolution Data:\n' + savedTensionResolutionData;
        }
      }
    }

    // Create the detailed prompt for the AI
    const detailedPrompt = `
I want you to act as a world-class expert in:
 generative AI prompting
 PowerPoint design
 live presentation coaching
 TED Talk-style speaking
 narrative storytelling structure
 cognitive and behavioral psychology
 persuasive science/business communication
 visual data storytelling and infographic design
 stoic philosophy for clarity, simplicity, and purpose

Based on the following information, generate a complete, persuasive, memorable PowerPoint presentation outline:

Core Story Concept: ${coreStoryConcept}
Story Flow Outline: ${storyFlowOutline}

1. Target Audience: ${answers[0]}
2. Presentation Length: ${answers[1]} minutes
3. Maximum Slides: ${answers[2]}
4. Desired Tone: ${answers[3]}
5. Visual Level: ${answers[4]}
6. Speaker Notes: ${answers[5]}

Each slide should be formatted in sections which are separated by blank lines. First section is TEXT followed by either bullets or floating text. Second section is VISUALS followed by detailed description of the visuals. Third section is SPEAKER NOTES which should be between 25 and 150 words. Fourth section is REFERENCES with the numbered references. Insert blank lines after the last line of each section. Add a separator line after each slide.
 Slide title - should express the main idea of the slide fully but in less than 15 words. Do not include the words "tension" "tension point" "resolution" or "resolution point" in the slides title.
 Slide text - either bullets (maximum 5) or floating text (maximum 2). Make sure all text is supported by references that are listed in the footnote.
 Suggested visuals - make the visual directly associate with one of the bullets or with one of the floating text. Make sure that all information presented in the visuals is supported by references that are listed in the footnote.
 Speaker notes (if user indicated to include these in questions above). Speaker notes should be conversational and between 50 and 150 words. These should go into details if necessary to fully explain all the text and visuals on the slide but without going into excessive detail.
 Footnote references - number these sequentially and use the following format: Smith E, et al. N Eng J Med. 2024;345:50-61. For each slide, number the references starting at 1. It's OK to have the same reference on different slides in different positions in the reference list.
 If a story flow map is provided, use this for the narrative arc of the presentation deck.
 If a story flow map is not provided, create narrative arc that includes a compelling, curiosity-generating attack point followed by multiple tension points each of which is resolved and then smoothly transitions to next tension point, and concludes with a summary slide containing the big idea of the presentation, delivers insight, and ends with clarity and emotional payoff
 Generate the entire outline and do not stop midway to get user input
 Design the presentation to:
 Grab attention in the first 30 seconds
 Use visual and emotional anchors for memory retention
 Align with scientific principles of attention, motivation, and persuasion
 Make the talk feel valuable, novel, and easy to share with others
When creating the Powerpoint file for downloading:
 Use all the slides in the outline
 Make the aspect ratio of the slides 16:9
 Use the outline exactly as shown.
 Insert the speaker notes into the notes section of each slide the PP file
    `;

    try {
      await streamDeckGeneration({
        detailedPrompt,
        answers,
        onStart: () => {
          setResult('');
        },
        onChunk: (chunk) => {
          setResult((prev) => prev + chunk);
        },
        onError: (message) => {
          setLastError(message);
          toast.error(message);
          setGenerationFailed(true);
          setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
        },
        onDone: () => {
          // Check if generation appears complete after state update
          setResult((prev) => {
            const content = prev.trim();
            
            // Schedule completion check for next tick to avoid setState during render
            setTimeout(() => {
              const hasMultipleSlides = (content.match(/Slide \d+/gi) || []).length >= 2;
              const hasReferences = content.includes('REFERENCES') || content.includes('References');
              const endsAbruptly = !content.endsWith('.') && !content.endsWith('!') && !content.endsWith('?') && !hasReferences;
              
              if (content.length < 1000 || !hasMultipleSlides || endsAbruptly) {
                console.warn('Generation may be incomplete:', {
                  length: content.length,
                  hasMultipleSlides,
                  hasReferences,
                  endsAbruptly,
                  lastChars: content.slice(-100)
                });
                toast.error('Generation may be incomplete. Please try again if the outline seems cut off.');
              } else {
                console.log('Generation appears complete:', {
                  length: content.length,
                  slideCount: (content.match(/Slide \d+/gi) || []).length
                });
                toast.success('Presentation outline generated successfully!');
              }
            }, 0);
            
            return prev;
          });
        },
      });
    } catch (err) {
      const errorMessage = 'Network error occurred. Please check your connection and try again.';
      setLastError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
      setGenerationFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Cancel any in-flight stream
    if (streamControllerRef.current) streamControllerRef.current.abort();

    setStep(0);
    setAnswers([]);
    setInput('');
    setLoading(false);
    setResult('');
    setInitialCheckComplete(false);
    setHasRequiredConcepts(false);
    setGenerationFailed(false);
    setRetryCount(0);
    setLastError('');
    setMessages([
      {
        role: 'assistant',
        content: 'Checking for Core Story Concept and Story Flow Outline...',
      },
    ]);

    // Re-run the initial check
    setTimeout(() => {
      const coreStoryConceptData =
        localStorage.getItem('selectedCoreStoryConceptData') ||
        localStorage.getItem('coreStoryConcept') ||
        localStorage.getItem('selectedCoreStoryConcept');

      let hasCoreStoryConcept = false;

      if (coreStoryConceptData) {
        try {
          const conceptData = JSON.parse(coreStoryConceptData);
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
        } catch {
          if (typeof coreStoryConceptData === 'string' && coreStoryConceptData.trim().length > 0) {
            hasCoreStoryConcept = true;
          }
        }
      }

      const storyFlowData = localStorage.getItem('storyFlowData');
      const attackPointsData = localStorage.getItem('attackPoints');
      const tensionResolutionData = localStorage.getItem('tensionResolutionPoints');
      const savedTensionResolutionData = localStorage.getItem('savedTensionResolutionData');

      let hasStoryFlowOutline = false;

      if (storyFlowData) {
        try {
          const flowData = JSON.parse(storyFlowData);
          hasStoryFlowOutline =
            flowData &&
            ((flowData.attackPoints && flowData.attackPoints.length > 0) ||
              (flowData.tensionResolutionPoints && flowData.tensionResolutionPoints.length > 0));
        } catch {
          // ignore
        }
      }

      if (!hasStoryFlowOutline) {
        let hasAttackPoints = false;
        let hasTensionResolution = false;
        let hasSavedTensionResolution = false;

        if (attackPointsData) {
          try {
            const attackPoints = JSON.parse(attackPointsData);
            hasAttackPoints = attackPoints && attackPoints.length > 0;
          } catch {
            if (typeof attackPointsData === 'string' && attackPointsData.trim().length > 0) {
              hasAttackPoints = true;
            }
          }
        }

        if (tensionResolutionData) {
          try {
            const tensionResolution = JSON.parse(tensionResolutionData);
            hasTensionResolution = tensionResolution && tensionResolution.length > 0;
          } catch {
            if (
              typeof tensionResolutionData === 'string' &&
              tensionResolutionData.trim().length > 0
            ) {
              hasTensionResolution = true;
            }
          }
        }

        if (savedTensionResolutionData) {
          try {
            const savedTensionResolution = JSON.parse(savedTensionResolutionData);
            hasSavedTensionResolution = savedTensionResolution && savedTensionResolution.length > 0;
          } catch {
            if (
              typeof savedTensionResolutionData === 'string' &&
              savedTensionResolutionData.trim().length > 0
            ) {
              hasSavedTensionResolution = true;
            }
          }
        }

        hasStoryFlowOutline = hasAttackPoints || hasTensionResolution || hasSavedTensionResolution;
      }

      if (!hasCoreStoryConcept) {
        setMessages([
          {
            role: 'assistant',
            content:
              "To create a Story Flow Map, I need you to create a Core Story Concept. Please go to the Core Story Concept section of MEDSTORYAI to do this then return here and I'll be happy to generate the Story Flow Map. Thanks.",
          },
        ]);
        setInitialCheckComplete(true);
        return;
      }

      if (!hasStoryFlowOutline) {
        setMessages([
          {
            role: 'assistant',
            content:
              "To create a Story Flow Map, I need you to create a Story Flow Outline first. Please go to the Story Flow section of MEDSTORYAI to do this then return here and I'll be happy to generate the Story Flow Map. Thanks.",
          },
        ]);
        setInitialCheckComplete(true);
        return;
      }

      setHasRequiredConcepts(true);
      setMessages([
        {
          role: 'assistant',
          content:
            "Got it - you need me to generate an outline for a MEDSTORY® presentation deck. First I'll need a few bits of information to generate your optimized presentation deck. This shouldn't take long - just 6 quick questions and we'll be on our way.\n\n1. " +
            questions[0],
        },
      ]);
      setInitialCheckComplete(true);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !hasRequiredConcepts) return;

    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput('');

    if (step < questions.length - 1) {
      setAnswers([...answers, input]);
      setLoading(true);

      setTimeout(() => {
        setMessages([
          ...newMessages,
          { role: 'assistant' as const, content: `${step + 2}. ${questions[step + 1]}` },
        ]);
        setStep(step + 1);
        setLoading(false);
      }, 500);
    } else {
      setAnswers([...answers, input]);
      setMessages([
        ...newMessages,
        {
          role: 'assistant' as const,
          content:
            'Thanks for that info. Give me a moment and your presentation outline will be ready shortly',
        },
      ]);
      setLoading(true);

      const updatedAnswers = [...answers, input];
      setAnswers(updatedAnswers);

      // Get the stored concepts
      const coreStoryConceptData =
        localStorage.getItem('selectedCoreStoryConceptData') ||
        localStorage.getItem('coreStoryConcept') ||
        localStorage.getItem('selectedCoreStoryConcept');

      let coreStoryConcept = '';
      if (coreStoryConceptData) {
        try {
          const conceptData = JSON.parse(coreStoryConceptData);
          if (conceptData && typeof conceptData === 'object' && conceptData.content) {
            coreStoryConcept = conceptData.content;
          } else if (typeof conceptData === 'string') {
            coreStoryConcept = conceptData;
          }
        } catch {
          if (typeof coreStoryConceptData === 'string') {
            coreStoryConcept = coreStoryConceptData;
          }
        }
      }

      // Get story flow outline data
      const storyFlowData = localStorage.getItem('storyFlowData');
      const attackPointsData = localStorage.getItem('attackPoints');
      const tensionResolutionData = localStorage.getItem('tensionResolutionPoints');
      const savedTensionResolutionData = localStorage.getItem('savedTensionResolutionData');

      let storyFlowOutline = '';

      if (storyFlowData) {
        try {
          const flowData = JSON.parse(storyFlowData);
          if (flowData) {
            storyFlowOutline += JSON.stringify(flowData, null, 2);
          }
        } catch {
          // If parsing fails, use raw data
          storyFlowOutline += storyFlowData;
        }
      }

      if (attackPointsData) {
        try {
          const attackPoints = JSON.parse(attackPointsData);
          if (attackPoints && attackPoints.length > 0) {
            storyFlowOutline += '\n\nAttack Points:\n' + JSON.stringify(attackPoints, null, 2);
          }
        } catch {
          if (typeof attackPointsData === 'string' && attackPointsData.trim().length > 0) {
            storyFlowOutline += '\n\nAttack Points:\n' + attackPointsData;
          }
        }
      }

      if (tensionResolutionData) {
        try {
          const tensionResolution = JSON.parse(tensionResolutionData);
          if (tensionResolution && tensionResolution.length > 0) {
            storyFlowOutline +=
              '\n\nTension Resolution Points:\n' + JSON.stringify(tensionResolution, null, 2);
          }
        } catch {
          if (
            typeof tensionResolutionData === 'string' &&
            tensionResolutionData.trim().length > 0
          ) {
            storyFlowOutline += '\n\nTension Resolution Points:\n' + tensionResolutionData;
          }
        }
      }

      if (savedTensionResolutionData) {
        try {
          const savedTensionResolution = JSON.parse(savedTensionResolutionData);
          if (savedTensionResolution && savedTensionResolution.length > 0) {
            storyFlowOutline +=
              '\n\nSaved Tension Resolution Data:\n' +
              JSON.stringify(savedTensionResolution, null, 2);
          }
        } catch {
          if (
            typeof savedTensionResolutionData === 'string' &&
            savedTensionResolutionData.trim().length > 0
          ) {
            storyFlowOutline += '\n\nSaved Tension Resolution Data:\n' + savedTensionResolutionData;
          }
        }
      }

      // Create the detailed prompt for the AI
      const detailedPrompt = `
I want you to act as a world-class expert in:
 generative AI prompting
 PowerPoint design
 live presentation coaching
 TED Talk-style speaking
 narrative storytelling structure
 cognitive and behavioral psychology
 persuasive science/business communication
 visual data storytelling and infographic design
 stoic philosophy for clarity, simplicity, and purpose

Based on the following information, generate a complete, persuasive, memorable PowerPoint presentation outline:

Core Story Concept: ${coreStoryConcept}
Story Flow Outline: ${storyFlowOutline}

1. Target Audience: ${updatedAnswers[0]}
2. Presentation Length: ${updatedAnswers[1]} minutes
3. Maximum Slides: ${updatedAnswers[2]}
4. Desired Tone: ${updatedAnswers[3]}
5. Visual Level: ${updatedAnswers[4]}
6. Speaker Notes: ${updatedAnswers[5]}

Each slide should be formatted in sections which are separated by blank lines. First section is TEXT followed by either bullets or floating text. Second section is VISUALS followed by detailed description of the visuals. Third section is SPEAKER NOTES which should be between 25 and 150 words. Fourth section is REFERENCES with the numbered references. Insert blank lines after the last line of each section. Add a separator line after each slide.
 Slide title - should express the main idea of the slide fully but in less than 15 words. Do not include the words "tension" "tension point" "resolution" or "resolution point" in the slides title.
 Slide text - either bullets (maximum 5) or floating text (maximum 2). Make sure all text is supported by references that are listed in the footnote.
 Suggested visuals - make the visual directly associate with one of the bullets or with one of the floating text. Make sure that all information presented in the visuals is supported by references that are listed in the footnote.
 Speaker notes (if user indicated to include these in questions above). Speaker notes should be conversational and between 50 and 150 words. These should go into details if necessary to fully explain all the text and visuals on the slide but without going into excessive detail.
 Footnote references - number these sequentially and use the following format: Smith E, et al. N Eng J Med. 2024;345:50-61. For each slide, number the references starting at 1. It's OK to have the same reference on different slides in different positions in the reference list.
 If a story flow map is provided, use this for the narrative arc of the presentation deck.
 If a story flow map is not provided, create narrative arc that includes a compelling, curiosity-generating attack point followed by multiple tension points each of which is resolved and then smoothly transitions to next tension point, and concludes with a summary slide containing the big idea of the presentation, delivers insight, and ends with clarity and emotional payoff
 Generate the entire outline and do not stop midway to get user input
 Design the presentation to:
 Grab attention in the first 30 seconds
 Use visual and emotional anchors for memory retention
 Align with scientific principles of attention, motivation, and persuasion
 Make the talk feel valuable, novel, and easy to share with others
When creating the Powerpoint file for downloading:
 Use all the slides in the outline
 Make the aspect ratio of the slides 16:9
 Use the outline exactly as shown.
 Insert the speaker notes into the notes section of each slide the PP file
      `;

      try {
        await streamDeckGeneration({
          detailedPrompt,
          answers: updatedAnswers,
          onStart: () => {
            setResult('');
          },
          onChunk: (chunk) => {
            setResult((prev) => prev + chunk);
          },
          onError: (message) => {
            setLastError(message);
            toast.error(message);
            setGenerationFailed(true);
            setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
          },
          onDone: () => {
            // Check if generation appears complete after state update
            setResult((prev) => {
              const content = prev.trim();
              
              // Schedule completion check for next tick to avoid setState during render
              setTimeout(() => {
                const hasMultipleSlides = (content.match(/Slide \d+/gi) || []).length >= 2;
                const hasReferences = content.includes('REFERENCES') || content.includes('References');
                const endsAbruptly = !content.endsWith('.') && !content.endsWith('!') && !content.endsWith('?') && !hasReferences;
                
                if (content.length < 1000 || !hasMultipleSlides || endsAbruptly) {
                  console.warn('Generation may be incomplete:', {
                    length: content.length,
                    hasMultipleSlides,
                    hasReferences,
                    endsAbruptly,
                    lastChars: content.slice(-100)
                  });
                  toast.error('Generation may be incomplete. Please try again if the outline seems cut off.');
                } else {
                  console.log('Generation appears complete:', {
                    length: content.length,
                    slideCount: (content.match(/Slide \d+/gi) || []).length
                  });
                  toast.success('Presentation outline generated successfully!');
                }
              }, 0);
              
              return prev;
            });
          },
        });
      } catch (err) {
        const errorMessage = 'Network error occurred. Please check your connection and try again.';
        setLastError(errorMessage);
        toast.error(errorMessage);
        console.error(err);
        setGenerationFailed(true);
        setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <PageLayout
      sectionIcon={
        <Image
          src="/slide_presentation_new.png"
          alt="Core Story Chat"
          width={72}
          height={72}
          className="w-24 h-26"
        />
      }
      sectionName="MEDSTORY Slide Deck"
      taskName="Create MEDSTORY deck blueprint"
    >
      <div className="flex gap-1 h-full">
        {/* Chat Interface - Left Side */}
        <div className="w-1/2 h-full">
          <ChatInterface
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            loading={loading}
            showInput={hasRequiredConcepts && initialCheckComplete}
            placeholder="Type your response..."
            onReset={handleReset}
          />
          {/* Retry button for failed generation */}
          {generationFailed && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700 mb-3">
                {lastError && (
                  <p className="mb-2">
                    <strong>Error:</strong> {lastError}
                  </p>
                )}
                {retryCount > 0 && <p className="mb-2">Retry attempts: {retryCount}</p>}
                <p>Generation failed. You can try again or reset to start over.</p>
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  disabled={loading}
                >
                  {loading ? 'Retrying...' : 'Retry Generation'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Result Section - Right Side - Fixed */}
        <div className="flex-1 h-full" ref={resultRef}>
          {result ? (
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex flex-col">
              <h2 className="text-xl font-bold text-blue-900 mb-4 flex-shrink-0">
                MEDSTORY Presentation Outline
              </h2>

              {/* SAFELIST for Tailwind (ensures these classes are included even when injected via HTML) */}
              <div className="hidden">
                <span className="font-bold text-blue-700"></span>
                <span className="font-bold text-blue-900"></span>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1">
                {(() => {
                  const display = softClean(result);

                  // 1) Split into slides
                  let slides = display.split(/(?=Slide \d+:)|(?=### Slide \d+:)|(?=## Slide \d+:)/);

                  if (slides.length <= 1) {
                    slides = display.split(/\n-{3,}\n|\n={3,}\n|\n\*{3,}\n/);
                  }

                  if (slides.length <= 1) {
                    const introMatch = display.match(
                      /^(.*?)(Slide \d+:|## Slide \d+:|### Slide \d+:)/s
                    );
                    const intro = introMatch ? introMatch[1].trim() : '';
                    const slideContent = introMatch
                      ? display.substring(introMatch[1].length)
                      : display;
                    const slideMatches =
                      slideContent.match(/Slide \d+:.*?(?=Slide \d+:|$)/gs) || [];
                    slides = intro ? [intro, ...slideMatches] : slideMatches;
                  }

                  if (slides.length === 0) {
                    slides = [display];
                  }

                  return slides.map((slide, index) => {
                    if (!slide.trim()) return null;

                    // Normalize "Slide Title:" -> "Slide N: ..."
                    let formattedSlide = slide.trim();
                    formattedSlide = formattedSlide.replace(
                      /^(?:\s*)Slide\s*Title\s*:\s*(.+)$/im,
                      (_m, title) => `Slide ${index + 1}: ${title}`
                    );

                    // Replace labels with styled HTML, then render safely
                    const html = styleLabelsHtml(formattedSlide);

                    return (
                      <div
                        key={index}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div
                          className="text-gray-800 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
