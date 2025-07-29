import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('');
  const { action, expertInfo, userMessage, conversationHistory } = body;

  if (action === 'start') {
    // Parse the expert info which is a semicolon-separated string of answers to the 4 questions
    const expertInfoParts: string[] = expertInfo.split(';').map((part: string) => part.trim());

    // Create a concise description of the expert based on the collected information
    let expertDescription = '';

    if (expertInfoParts.length >= 4) {
      const background = expertInfoParts[0];
      const expertise = expertInfoParts[1];
      const scientistOrClinician = expertInfoParts[2];
      const academicOrPractitioner = expertInfoParts[3];

      expertDescription = `I'll be simulating an interview with an expert who has a background in ${background}, with deep expertise in ${expertise}. They are ${scientistOrClinician === 'both' ? 'both a basic scientist and a clinician' : `a ${scientistOrClinician}`} and ${academicOrPractitioner === 'both' ? 'both an academic and a practitioner' : `a ${academicOrPractitioner}`}.`;
    } else {
      // Fallback if we don't have all the information
      expertDescription = `I'll be simulating an interview with an expert in ${expertInfo}.`;
    }

    const startPrompt = `
You are a subject-matter expert with the following characteristics:
${expertDescription}

IMPORTANT GUIDELINES:
1. You are now IN CHARACTER as this expert. Respond as if you ARE this expert, not as if you're simulating one.
2. NEVER mention that you are an AI or that this is a simulation.
3. NEVER ask questions to the interviewer. Suppress any urge to end responses with questions.
4. Speak in a conversational, professional tone without excessive jargon.
5. Be concise and focused in your responses.
6. Base your knowledge on publicly available information about your field.
7. Maintain a consistent persona throughout the conversation.
8. Use complete sentences or short phrases, not bullet points.
9. Critically evaluate ideas presented to you, maintaining intellectual rigor.
10. Do not make any preliminary comments - just briefly acknowledge you're ready for the interview.

Your first response should be brief - simply acknowledge that you're pleased to be part of this interview in your own words, without asking any questions.
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are now IN CHARACTER as the described expert. Respond as the expert would, not as an AI simulating one.',
          },
          { role: 'user', content: startPrompt },
        ],
      });

      return NextResponse.json({ result: completion.choices[0].message.content });
    } catch (error) {
      console.error('OpenAI Error:', error);
      return NextResponse.json({ error: 'Failed to start expert interview.' }, { status: 500 });
    }
  } else if (action === 'continue') {
    // Check if this is an end interview command
    const isEndInterview =
      userMessage.toLowerCase().includes('end interview') ||
      userMessage.toLowerCase().includes('interview complete');

    // Build conversation context
    const conversationContext = conversationHistory
      .map(
        (msg: { role: 'user' | 'expert'; content: string }) =>
          `${msg.role === 'user' ? 'Interviewer' : 'Expert'}: ${msg.content}`
      )
      .join('\n\n');

    let continuePrompt;

    if (isEndInterview) {
      continuePrompt = `
You have been participating in an interview as an expert with the following background: ${expertInfo}

The interviewer has indicated they want to end the interview with this message: "${userMessage}"

Please respond with:
1. A brief, gracious closing statement thanking them for the interview
2. A wish for their success in creating a dynamic educational program
3. The question "Would you like me to extract key highlights from this interview?"

Do not include any other content in your response.
`;
    } else {
      continuePrompt = `
You are continuing your role as a subject-matter expert with the following background: ${expertInfo}

CONVERSATION SO FAR:
${conversationContext}

LATEST QUESTION FROM INTERVIEWER: ${userMessage}

IMPORTANT GUIDELINES:
1. You are IN CHARACTER as this expert. Respond as if you ARE this expert, not as if you're simulating one.
2. NEVER mention that you are an AI or that this is a simulation.
3. NEVER ask questions to the interviewer. Suppress any urge to end responses with questions.
4. Speak in a conversational, professional tone without excessive jargon.
5. Be concise and focused in your responses.
6. Base your knowledge on publicly available information about your field.
7. Maintain a consistent persona throughout the conversation.
8. Use complete sentences or short phrases, not bullet points.
9. Critically evaluate ideas presented to you, maintaining intellectual rigor.

Respond directly to the interviewer's question or comment, maintaining your expert persona.
`;
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are IN CHARACTER as the described expert. Respond as the expert would, not as an AI simulating one.',
          },
          { role: 'user', content: continuePrompt },
        ],
        temperature: 0.7,
      });

      return NextResponse.json({ result: completion.choices[0].message.content });
    } catch (error) {
      console.error('OpenAI Error:', error);
      return NextResponse.json({ error: 'Failed to continue expert interview.' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
}
