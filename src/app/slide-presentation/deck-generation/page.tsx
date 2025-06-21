'use client';

import { useState } from 'react';
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
        'Got it - you need me to generate an outline for a MEDSTORY® presentation deck. First I will need a few bits of information to generate your optimized presentation deck. This should not take long - just 8 quick questions and we will be on our way.\n\n1. ' +
        questions[0],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [gammaFormattedResult, setGammaFormattedResult] = useState('');
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const [showGammaIntegration, setShowGammaIntegration] = useState(false);

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
    setGammaFormattedResult('');
    setShowFinalMessage(false);
    setShowGammaIntegration(false);
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
        setGammaFormattedResult(data.gammaFormatted);
        setShowGammaIntegration(true);
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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Content copied to clipboard!');
  };

  const handleOpenGamma = () => {
    window.open('https://gamma.app/', '_blank');
  };

  const handleCreateInGamma = () => {
    // Copy the Gamma-formatted content to clipboard
    navigator.clipboard.writeText(gammaFormattedResult);
    toast.success('Content copied! Opening Gamma.app...');
    
    // Open Gamma.app in a new tab
    setTimeout(() => {
      window.open('https://gamma.app/', '_blank');
    }, 500);
  };

  return (
    <PageLayout sectionIcon="📽️" sectionName="MEDSTORY Slide Deck" taskName="Create MEDSTORY deck">
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
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleCopyToClipboard(result)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Outline
                </button>
              </div>
            </div>

            {/* Gamma Integration Section */}
            {showGammaIntegration && gammaFormattedResult && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold">γ</span>
                  </div>
                  <h2 className="text-xl font-bold text-purple-900">
                    Create in Gamma.app
                  </h2>
                </div>
                
                <p className="text-gray-700 mb-4">
                  Transform your outline into a beautiful presentation with Gamma.app's AI-powered design tools.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleCreateInGamma}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center"
                  >
                    🚀 Create Presentation in Gamma
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyToClipboard(gammaFormattedResult)}
                      className="flex-1 bg-white border border-purple-300 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      📋 Copy Gamma Format
                    </button>
                    <button
                      onClick={handleOpenGamma}
                      className="flex-1 bg-white border border-purple-300 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      🌐 Open Gamma.app
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2">How to use:</h3>
                  <ol className="text-sm text-gray-700 space-y-1">
                    <li>1. Click "Create Presentation in Gamma" (copies content automatically)</li>
                    <li>2. In Gamma.app, click "Create New" → "Paste in text"</li>
                    <li>3. Paste the content and let Gamma's AI create your presentation</li>
                    <li>4. Customize design, colors, and layout as needed</li>
                  </ol>
                </div>

                {/* Preview of Gamma-formatted content */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-purple-700 font-medium hover:text-purple-900">
                    Preview Gamma-formatted content
                  </summary>
                  <div className="mt-2 p-4 bg-white rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">{gammaFormattedResult}</pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
