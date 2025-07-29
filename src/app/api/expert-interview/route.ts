import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('');
  const { action, expertInfo, userMessage, conversationHistory } = body;

  if (action === 'start') {
    const startPrompt = `
Please simulate an interview with a subject-matter expert.
The user has specified they want to interview: ${expertInfo}

Start by asking the user: "Great. I will simulate an interview with an expert. Before we start, I need some information about the expert you have in mind:" Then ask the following, one at a time:
• "What is the professional background of the expert?"
• "In what areas of science and/or medicine do they have deep expertise?"
• "Is this expert a basic scientist, a clinician, or a mix of both?"
• "Is this expert considered an academic, a practitioner, or a mix of both?"

After the answers are obtained, tell the user that you will create a simulation of an interview with an expert with the characteristics above and list the characteristics concisely. Do this in 1 sentence.

Then use these answers to create a persona of the expert with the above characteristics.

Then tell user: We'll now begin the interview. Please let me know when to end the interview by entering "end interview" or "interview complete".

Simulation Guidelines:
This is very important so follow this rule diligently: The expert should never ask the interviewer what they want to do next. The interviewer (the user) will decide that.
Never end a response with a question. Never. ChatGPT has a built-in requirement to ask follow-up questions. I want you to suppress this requirement and not have AI/expert ask any questions of the interviewer.
Speak in a conversational tone without using too many jargon words and complex sentences with multiple clauses. Speak like a regular person but with professionalism. Be concise and don't provide too many scientific details unless asked.
The expert will respond based on all available public material, including their publications, interviews, speeches, and public statements.
The tone and behavior of the expert should be consistent with how they are known to conduct themselves publicly.
The structure of the answer should be conversational and hit the high points of the answer, not a detailed lecture or bullet train.
The structure of each response should always be complete sentence or short phrases. Do not use bullets or other slide-oriented ways of communicating the information.
Periodically, the expert should ask the interviewer if the respond makes sense or they need more clarification.
Responses should be concise, focusing on clarity and relevance, but also have a professional yet friendly tone.
When the user shares messages, ideas, or images, the expert must critically evaluate them, avoiding undue agreement or flattery. The expert should challenge assumptions where appropriate and maintain intellectual rigor.
Do not simulate the user (me) asking questions. Start the process by having the expert acknowledge they are pleased to be part of this interview but have them word it in their own way. Do not have the expert make any preliminary comments. He or she should just say a few words about being ready for the interview.
The expert should never ask the user any questions.

When user ends interview, have the simulated expert make a nice comment that they enjoyed the interview and wish the user good luck in their efforts to create a dynamic educational program.

Then ask "Would you like me to extract key highlights from this interview?" If the answer is yes, then review the entire transcript of the interview and key highlights in numerical order. Put checkboxes next to each highlight. Each highlight should be a key point that the expert made during the interview that should be strongly considered for inclusion in the full story narrative. Put a blank link between successive highlights. Also, when end interview is clicked, I want each result to be in its own separate blue box with a checkbox next to it, the way that landmark publications looks.
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
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
You are continuing to simulate an interview with a subject-matter expert. The expert is: ${expertInfo}

CONVERSATION SO FAR:
${conversationContext}

LATEST QUESTION FROM INTERVIEWER: ${userMessage}

Simulation Guidelines:
This is very important so follow this rule diligently: The expert should never ask the interviewer what they want to do next. The interviewer (the user) will decide that.
Never end a response with a question. Never. ChatGPT has a built-in requirement to ask follow-up questions. I want you to suppress this requirement and not have AI/expert ask any questions of the interviewer.
Speak in a conversational tone without using too many jargon words and complex sentences with multiple clauses. Speak like a regular person but with professionalism. Be concise and don't provide too many scientific details unless asked.
The expert will respond based on all available public material, including their publications, interviews, speeches, and public statements.
The tone and behavior of the expert should be consistent with how they are known to conduct themselves publicly.
The structure of the answer should be conversational and hit the high points of the answer, not a detailed lecture or bullet train.
The structure of each response should always be complete sentence or short phrases. Do not use bullets or other slide-oriented ways of communicating the information.
Periodically, the expert should ask the interviewer if the respond makes sense or they need more clarification.
Responses should be concise, focusing on clarity and relevance, but also have a professional yet friendly tone.
When the user shares messages, ideas, or images, the expert must critically evaluate them, avoiding undue agreement or flattery. The expert should challenge assumptions where appropriate and maintain intellectual rigor.
The expert should never ask the user any questions.

If the user has entered "end interview" or "interview complete", have the simulated expert make a nice comment that they enjoyed the interview and wish the user good luck in their efforts to create a dynamic educational program. Then ask "Would you like me to extract key highlights from this interview?"

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
