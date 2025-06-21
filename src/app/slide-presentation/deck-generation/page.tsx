'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';
import BeautifulAiModal from '@/app/components/BeautifulAiModal';

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
        'Got it - you need me to generate an outline for a MEDSTORY® presentation deck. First I will need a few bits of information to generate your optimized presentation deck. This should not take long - just 8 quick questions and we will be on our way.\n\n1. ' +
        questions[0],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [beautifulAiUrl, setBeautifulAiUrl] = useState('');
  const [showBeautifulAiModal, setShowBeautifulAiModal] = useState(false);

  const handleReset = () => {
    setStep(0);
    setAnswers([]);
    setInput('');
    setMessages([
      {
        role: 'assistant',
        content:
          'Got it - you need me to generate an outline for a MEDSTORY® presentation deck. First I will need a few bits of information to generate your optimized presentation deck. This should not take long - just 8 quick questions and we will be on our way.\n\n1. ' +
          questions[0],
      },
    ]);
    setLoading(false);
    setResult('');
    setShowFinalMessage(false);
    setExportLoading(false);
    setBeautifulAiUrl('');
  };

  const handleExportToBeautifulAi = () => {
    setShowBeautifulAiModal(true);
  };
  
  const handleBeautifulAiSubmit = async (email: string, password: string) => {
    setShowBeautifulAiModal(false);
    setExportLoading(true);
    
    try {
      const res = await fetch('/api/beautiful-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outline: result,
          email,
          password,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setBeautifulAiUrl(data.presentationUrl);
        toast.success('Successfully exported to Beautiful.ai!');
        // Open the presentation in a new tab
        window.open(data.presentationUrl, '_blank');
      } else {
        toast.error(data.error || 'Failed to export to Beautiful.ai');
      }
    } catch (err) {
      console.error('Beautiful.ai Export Error:', err);
      toast.error('Failed to export to Beautiful.ai');
    } finally {
      setExportLoading(false);
    }
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
- generative AI prompting
- PowerPoint design
- live presentation coaching
- TED Talk-style speaking
- narrative storytelling structure
- cognitive and behavioral psychology
- persuasive science/business communication
- visual data storytelling and infographic design
- stoic philosophy for clarity, simplicity, and purpose

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

Create a slide-by-slide outline using these guidelines:
- Each slide should be formatted in sections separated by blank lines
- First section: TEXT (bullets max 5, or floating text max 2)
- Second section: VISUALS (detailed description)
- Third section: SPEAKER NOTES (25-150 words, conversational)
- Fourth section: REFERENCES (numbered, format: Smith E, et al. N Eng J Med. 2024;345:50-61)
- Slide titles should express main idea in less than 15 words
- Design to grab attention in first 30 seconds
- Use visual and emotional anchors for memory retention
- Align with scientific principles of attention, motivation, and persuasion
- Make valuable, novel, and easy to share

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
    <PageLayout sectionIcon="📽️" sectionName="MEDSTORY Slide Deck" taskName="Create MEDSTORY deck">
      <BeautifulAiModal
        isOpen={showBeautifulAiModal}
        onClose={() => setShowBeautifulAiModal(false)}
        onSubmit={handleBeautifulAiSubmit}
      />
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Chat Interface - Left Side */}
        <div className="w-full lg:w-1/2">
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
          <div className="flex-1 space-y-6">
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-blue-900 mb-4">
                MEDSTORY Presentation Outline
              </h2>
              <div className="text-gray-800 whitespace-pre-wrap">{result}</div>
              <div className="mt-6">
                <button
                  onClick={() => handleExportToBeautifulAi()}
                  disabled={exportLoading}
                  className={`${
                    exportLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white font-bold py-2 px-4 rounded flex items-center`}
                >
                  <span className="mr-2">
                    {exportLoading ? 'Exporting...' : 'Export to Beautiful.ai'}
                  </span>
                  {exportLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                {beautifulAiUrl && (
                  <div className="mt-2">
                    <a
                      href={beautifulAiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View your Beautiful.ai presentation
                    </a>
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
