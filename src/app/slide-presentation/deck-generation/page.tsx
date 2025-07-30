'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

const questions = [
  'Do you want me to use a specific Core Story Concept? (Y/N - if yes, paste it here)',
  'Do you want me to use a specific Story Flow Map? (Y/N - if yes, paste it here)',
  'Who is your target audience? (eg, PCPs, CARDs, specialists, patients, general public)',
  'How long is the presentation? (in minutes)',
  'What is the maximum number of slides for the presentation? (none or specify number)',
  'What is your desired tone? (eg, provocative, academic, friendly, calm - or a combination)',
  'How visual should it be? (e.g. minimal, moderate visuals, highly visual)',
  'Do you want me to write speaker notes for each slide? (Y/N)',
  'Would you like me to mimic the visual style of a specific Powerpoint deck? (Y/N - if yes, upload the file)',
];

export default function DeckGenerationPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([
    {
      role: 'assistant',
      content:
        'Got it - you need me to generate an outline for a MEDSTORY® presentation deck. First I\'ll need a few bits of information to generate your optimized presentation deck. This shouldn\'t take long - just 8 quick questions and we\'ll be on our way.\n\n1. ' +
        questions[0],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  const handleReset = () => {
    setStep(0);
    setAnswers([]);
    setInput('');
    setMessages([
      {
        role: 'assistant',
        content:
          'Got it - you need me to generate an outline for a MEDSTORY® presentation deck. First I\'ll need a few bits of information to generate your optimized presentation deck. This shouldn\'t take long - just 8 quick questions and we\'ll be on our way.\n\n1. ' +
          questions[0],
      },
    ]);
    setLoading(false);
    setResult('');
    setShowFinalMessage(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput('');

    if (step < questions.length - 1) {
      setAnswers([...answers, input]);
      setMessages([
        ...newMessages,
        { role: 'assistant' as const, content: `${step + 2}. ${questions[step + 1]}` },
      ]);
      setStep(step + 1);
    } else {
      setAnswers([...answers, input]);
      setMessages([
        ...newMessages,
        {
          role: 'assistant' as const,
          content:
            'Thanks for that info. Give me a moment and your presentation outline will be ready shortly...',
        },
      ]);
      setShowFinalMessage(true);
      setLoading(true);

      const updatedAnswers = [...answers, input];
      setAnswers(updatedAnswers);

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

Based on the following answers, generate a complete, persuasive, memorable PowerPoint presentation outline:

1. Core Story Concept: ${updatedAnswers[0]}
2. Story Flow Map: ${updatedAnswers[1]}
3. Target Audience: ${updatedAnswers[2]}
4. Presentation Length: ${updatedAnswers[3]} minutes
5. Maximum Slides: ${updatedAnswers[4]}
6. Desired Tone: ${updatedAnswers[5]}
7. Visual Level: ${updatedAnswers[6]}
8. Speaker Notes: ${updatedAnswers[7]}
9. Visual Style Reference: ${updatedAnswers[8]}

Each slide should be formatted in sections which are separated by blank lines. First section is TEXT followed by either bullets or floating text. Second section is VISUALS followed by detailed description of the visuals. Third section is SPEAKER NOTES which should be between 25 and 150 words. Fourth section is REFERENCES with the numbered references. Insert blank lines after the last line of each section. Add a separator line after each slide.
Slide title - should express the main idea of the slide fully but in less than 15 words. Do not include the words "tension" "tension point" "resolution" or "resolution point" in the slides title.
Slide text - either bullets (maximum 5) or floating text (maximum 2). Make sure all text is supported by references that are listed in the footnote.
Suggested visuals - make the visual directly associate with one of the bullets or with one of the floating text. Make sure that all information presented in the visuals is supported by references that are listed in the footnote.
Speaker notes (if user indicated to include these in questions above). Speaker notes should be conversational and between 50 and 150 words. These should go into details if necessary to fully explain all the text and visuals on the slide but without going into excessive detail.
Footnote references - number these sequentially and use the following format: Smith E, et al. N Eng J Med. 2024;345:50-61. For each slide, number the references starting at 1. It's OK to have the same reference on different slides in different positions in the reference list.
If a story flow map is provided, use this for the narrative arc of the presentation deck.
If a story flow map is not provided, create narrative arc that includes a compelling, curiosity-generating attack point followed by multiple tension points each of which is resolved and then smoothly transitions to next tension point, and concludes with a summary slide containing the big idea of the presentation, delivers insight, and ends with clarity and emotional payoff

Design the presentation to:
Grab attention in the first 30 seconds
Use visual and emotional anchors for memory retention
Align with scientific principles of attention, motivation, and persuasion
Make the talk feel valuable, novel, and easy to share with others

Generate the entire outline without stopping for user input.
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
        setResult(data.result);
      } catch (err) {
        toast.error('Something went wrong.');
        console.error(err);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Failed to generate presentation outline.' },
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
          className="w-18 h-18"
        />
      }
      sectionName="MEDSTORY Slide Deck"
      taskName="Create MEDSTORY deck"
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
            showInput={!showFinalMessage}
            placeholder="Type your response..."
            onReset={handleReset}
          />
        </div>

        {/* Result Section - Right Side */}
        {result && (
          <div className="flex-1 space-y-6" ref={resultRef}>
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-blue-900 mb-4">
                MEDSTORY Presentation Outline
              </h2>
              <div className="text-gray-800 whitespace-pre-wrap">{result}</div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
