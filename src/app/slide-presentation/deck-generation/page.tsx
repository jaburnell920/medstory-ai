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

// Function to clean markdown symbols from content
const cleanMarkdownSymbols = (content: string): string => {
  if (!content) return '';
  
  return content
    // Remove markdown bold symbols
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove standalone asterisks and stars
    .replace(/^\*+\s*$/gm, '')
    // Remove horizontal rules (---, ***, ===)
    .replace(/^[-*=]{3,}\s*$/gm, '')
    // Remove extra asterisks at the beginning of lines
    .replace(/^\*+\s*/gm, '')
    // Remove trailing asterisks
    .replace(/\s*\*+$/gm, '')
    // Clean up multiple consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove leading/trailing whitespace
    .trim();
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

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  useEffect(() => {
    // Check for Core Story Concept and Story Flow Outline in memory/localStorage
    const checkRequiredConcepts = () => {
      // Check for Core Story Concept data - try multiple possible keys
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

      // Check for Story Flow Outline data (attack points and tension-resolution points)
      const storyFlowData = localStorage.getItem('storyFlowData');
      const attackPointsData = localStorage.getItem('attackPoints');
      const tensionResolutionData = localStorage.getItem('tensionResolutionPoints');
      const savedTensionResolutionData = localStorage.getItem('savedTensionResolutionData');

      let hasStoryFlowOutline = false;

      // Check if any story flow outline data exists
      if (storyFlowData) {
        try {
          const flowData = JSON.parse(storyFlowData);
          hasStoryFlowOutline =
            flowData &&
            ((flowData.attackPoints && flowData.attackPoints.length > 0) ||
              (flowData.tensionResolutionPoints && flowData.tensionResolutionPoints.length > 0));
        } catch {
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

      // Both concepts exist, proceed with the deck generation
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

    // Simulate checking (in a real app, this might be an API call)
    setTimeout(checkRequiredConcepts, 1000);
  }, []);

  const handleRetry = async () => {
    setLoading(true);
    setGenerationFailed(false);
    setResult('');
    setRetryCount(prev => prev + 1);

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

    // Compile story flow outline from available data
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
      const res = await fetch('/api/deck-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answers,
          detailedPrompt: detailedPrompt,
        }),
      });
      const data = await res.json();
      
      // Check if the response contains an error
      if (data.error) {
        setLastError(data.error);
        toast.error(data.error);
        setGenerationFailed(true);
        return;
      }
      
      // Clean the result content before setting it
      const cleanedResult = cleanMarkdownSymbols(data.result || '');
      setResult(cleanedResult);
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
      // Check for Core Story Concept data - try multiple possible keys
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

      // Check for Story Flow Outline data (attack points and tension-resolution points)
      const storyFlowData = localStorage.getItem('storyFlowData');
      const attackPointsData = localStorage.getItem('attackPoints');
      const tensionResolutionData = localStorage.getItem('tensionResolutionPoints');
      const savedTensionResolutionData = localStorage.getItem('savedTensionResolutionData');

      let hasStoryFlowOutline = false;

      // Check if any story flow outline data exists
      if (storyFlowData) {
        try {
          const flowData = JSON.parse(storyFlowData);
          hasStoryFlowOutline =
            flowData &&
            ((flowData.attackPoints && flowData.attackPoints.length > 0) ||
              (flowData.tensionResolutionPoints && flowData.tensionResolutionPoints.length > 0));
        } catch {
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

      // Add a small delay to show the thinking animation
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

      // Compile story flow outline from available data
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
        // Create a new API endpoint for deck generation
        const res = await fetch('/api/deck-generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: updatedAnswers,
            detailedPrompt: detailedPrompt,
          }),
        });
        const data = await res.json();
        
        // Check if the response contains an error
        if (data.error) {
          setLastError(data.error);
          toast.error(data.error);
          setGenerationFailed(true);
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: data.error },
          ]);
          return;
        }
        
        // Clean the result content before setting it
        const cleanedResult = cleanMarkdownSymbols(data.result || '');
        setResult(cleanedResult);
      } catch (err) {
        const errorMessage = 'Network error occurred. Please check your connection and try again.';
        setLastError(errorMessage);
        toast.error(errorMessage);
        console.error(err);
        setGenerationFailed(true);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: errorMessage },
        ]);
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
                  <p className="mb-2"><strong>Error:</strong> {lastError}</p>
                )}
                {retryCount > 0 && (
                  <p className="mb-2">Retry attempts: {retryCount}</p>
                )}
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
        <div className="flex-1 h-full">
          {result ? (
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex flex-col">
              <h2 className="text-xl font-bold text-blue-900 mb-4 flex-shrink-0">
                MEDSTORY Presentation Outline
              </h2>
              <div className="space-y-4 overflow-y-auto flex-1">
                {(() => {
                  // First try to split by common slide separators
                  let slides = result.split(/(?=Slide \d+:)|(?=### Slide \d+:)|(?=## Slide \d+:)/);

                  // If we don't have multiple slides, try splitting by separator lines
                  if (slides.length <= 1) {
                    slides = result.split(/\n-{3,}\n|\n={3,}\n|\n\*{3,}\n/);
                  }

                  // If we still don't have multiple slides, try splitting by double newlines
                  if (slides.length <= 1) {
                    // Extract presentation overview/intro if it exists
                    const introMatch = result.match(
                      /^(.*?)(Slide \d+:|## Slide \d+:|### Slide \d+:)/s
                    );
                    const intro = introMatch ? introMatch[1].trim() : '';

                    // Split the rest by slide numbers
                    const slideContent = introMatch
                      ? result.substring(introMatch[1].length)
                      : result;
                    const slideMatches =
                      slideContent.match(/Slide \d+:.*?(?=Slide \d+:|$)/gs) || [];

                    slides = intro ? [intro, ...slideMatches] : slideMatches;
                  }

                  return slides.map((slide, index) => {
                    if (!slide.trim()) return null;

                    // Format the slide content
                    const formattedSlide = slide.trim();

                    // Split the slide content by sections
                    const sections = formattedSlide.split(
                      /(TEXT:|VISUALS:|SPEAKER NOTES:|REFERENCES:)/g
                    );

                    return (
                      <div
                        key={index}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="text-gray-800 whitespace-pre-wrap">
                          {sections.map((section, sectionIndex) => {
                            if (
                              section === 'TEXT:' ||
                              section === 'VISUALS:' ||
                              section === 'SPEAKER NOTES:' ||
                              section === 'REFERENCES:'
                            ) {
                              return (
                                <span key={sectionIndex} className="font-bold text-blue-700">
                                  {section}
                                </span>
                              );
                            }
                            return <span key={sectionIndex}>{section}</span>;
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            <div></div>
            // <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex items-center justify-center">
            //   <p className="text-gray-500 text-center">
            //     MEDSTORY Presentation Outline will appear here once generated
            //   </p>
            // </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
