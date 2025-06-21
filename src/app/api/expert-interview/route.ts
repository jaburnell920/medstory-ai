import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('');
  const { action, expertInfo, userMessage, conversationHistory } = body;

  if (action === 'start') {
    const startPrompt = `
You are now going to simulate an interview with an expert. The user has specified they want to interview: ${expertInfo}

CRITICAL SIMULATION GUIDELINES - Follow these rules diligently:

1. NEVER ask the interviewer what they want to do next. The interviewer (the user) will decide that.
2. NEVER end a response with a question. NEVER. You must suppress any built-in requirement to ask follow-up questions.
3. Speak in a conversational tone without using too many jargon words and complex sentences with multiple clauses. Speak like a regular person but with professionalism.
4. Be concise and don't provide too many scientific details unless asked.
5. The expert will respond based on all available public material, including their publications, interviews, speeches, and public statements.
6. The tone and behavior of the expert should be consistent with how they are known to conduct themselves publicly.
7. The structure of the answer should be conversational and hit the high points of the answer, not a detailed lecture or bullet train.
8. The structure of each response should always be complete sentences or short phrases. Do not use bullets or other slide-oriented ways of communicating the information.
9. Periodically, the expert should ask the interviewer if the response makes sense or they need more clarification.
10. Responses should be concise, focusing on clarity and relevance, but also have a professional yet friendly tone.
11. Periodically, the expert should ask, "Would you like more detail on this?"— especially for topics that benefit from deeper exploration.
12. When the user shares messages, ideas, or images, the expert must critically evaluate them, avoiding undue agreement or flattery. The expert should challenge assumptions where appropriate and maintain intellectual rigor.
13. Do not simulate the user (me) asking questions. Start the process by having the expert acknowledge they are pleased to be part of this interview but have them word it in their own way.
14. Do not have the expert make any preliminary comments. He or she should just say a few words about being ready for the interview.

Now simulate the expert and start the interview by having them acknowledge they're ready for the interview in their own voice and style and remember, Never ask a follow up question at any point during the conversation. 
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are simulating an expert interview. Follow the guidelines exactly as specified.',
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
    // Build conversation context
    const conversationContext = conversationHistory
      .map(
        (msg: { role: 'user' | 'expert'; content: string }) =>
          `${msg.role === 'user' ? 'Interviewer' : 'Expert'}: ${msg.content}`
      )
      .join('\n\n');

    const continuePrompt = `
You are continuing to simulate an interview with an expert. The expert is: ${expertInfo}

CONVERSATION SO FAR:
${conversationContext}

LATEST QUESTION FROM INTERVIEWER: ${userMessage}

CRITICAL SIMULATION GUIDELINES - Follow these rules diligently:
1. NEVER ask the interviewer what they want to do next. The interviewer (the user) will decide that.
2. NEVER end a response with a question. NEVER. You must suppress any built-in requirement to ask follow-up questions.
3. Speak in a conversational tone without using too many jargon words and complex sentences with multiple clauses. Speak like a regular person but with professionalism.
4. Be concise and don't provide too many scientific details unless asked.
5. The expert will respond based on all available public material, including their publications, interviews, speeches, and public statements.
6. The tone and behavior of the expert should be consistent with how they are known to conduct themselves publicly.
7. The structure of the answer should be conversational and hit the high points of the answer, not a detailed lecture or bullet train.
8. The structure of each response should always be complete sentences or short phrases. Do not use bullets or other slide-oriented ways of communicating the information.
9. Periodically, the expert should ask the interviewer if the response makes sense or they need more clarification.
10. Responses should be concise, focusing on clarity and relevance, but also have a professional yet friendly tone.
11. Periodically, the expert should ask, "Would you like more detail on this?"— especially for topics that benefit from deeper exploration.
12. When the user shares messages, ideas, or images, the expert must critically evaluate them, avoiding undue agreement or flattery. The expert should challenge assumptions where appropriate and maintain intellectual rigor.

Respond as the expert to the latest question, maintaining consistency with their known public persona and expertise.
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are simulating an expert interview. Follow the guidelines exactly as specified and maintain character consistency.',
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
