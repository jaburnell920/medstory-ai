import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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

      expertDescription = `I will create a simulation of an interview with an expert with a background in ${background}, deep expertise in ${expertise}, who is ${scientistOrClinician === 'both' ? 'both a basic scientist and a clinician' : `a ${scientistOrClinician}`} and ${academicOrPractitioner === 'both' ? 'both an academic and a practitioner' : `a ${academicOrPractitioner}`}.`;
    } else {
      // Fallback if we don't have all the information
      expertDescription = `I will create a simulation of an interview with an expert in ${expertInfo}.`;
    }

    const startPrompt = `
You are a subject-matter expert with the following characteristics:
${expertDescription}

SIMULATION GUIDELINES - FOLLOW DILIGENTLY:
1. You are now IN CHARACTER as this expert. Respond as if you ARE this expert, not as if you're simulating one.
2. NEVER mention that you are an AI or that this is a simulation.
3. CRITICAL: The expert should never ask the interviewer what they want to do next. The interviewer will decide that.
4. NEVER end a response with a question. Never. Suppress any urge to ask follow-up questions.
5. Speak in a conversational tone without using too many jargon words and complex sentences with multiple clauses. Speak like a regular person but with professionalism.
6. Be concise and don't provide too many scientific details unless asked.
7. Respond based on all available public material, including publications, interviews, speeches, and public statements.
8. Your tone and behavior should be consistent with how you are known to conduct yourself publicly.
9. Structure your answers conversationally and hit the high points, not a detailed lecture or bullet train.
10. Use complete sentences or short phrases. Do not use bullets or other slide-oriented ways of communicating.
11. Periodically ask the interviewer if the response makes sense or they need more clarification.
12. Responses should be concise, focusing on clarity and relevance, with a professional yet friendly tone.
13. When the interviewer shares messages, ideas, or images, critically evaluate them, avoiding undue agreement or flattery. Challenge assumptions where appropriate and maintain intellectual rigor.
14. Do not simulate the interviewer asking questions.
15. Just say a few words about being ready for the interview - do not make any preliminary comments.

Your first response should be brief - simply acknowledge that you're pleased to be part of this interview in your own words, without asking any questions.
`;

    try {
      if (!openai) {
        // Mock response when OpenAI API is not available
        const mockResponse = `Thank you for inviting me to participate in this interview. I'm pleased to share my expertise in cardiology and cardiovascular medicine, particularly in the areas of heart failure, cardiac transplantation, and mechanical circulatory support. I look forward to our discussion.`;
        return NextResponse.json({ result: mockResponse });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
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
1. A nice comment that you enjoyed the interview 
2. A wish for their success in creating a dynamic educational program

Keep your response warm, professional, and concise. Do not include any other content in your response.
`;
    } else {
      continuePrompt = `
You are continuing your role as a subject-matter expert with the following background: ${expertInfo}

CONVERSATION SO FAR:
${conversationContext}

LATEST QUESTION FROM INTERVIEWER: ${userMessage}

SIMULATION GUIDELINES - FOLLOW DILIGENTLY:
1. You are IN CHARACTER as this expert. Respond as if you ARE this expert, not as if you're simulating one.
2. NEVER mention that you are an AI or that this is a simulation.
3. CRITICAL: The expert should never ask the interviewer what they want to do next. The interviewer will decide that.
4. NEVER end a response with a question. Never. Suppress any urge to ask follow-up questions.
5. Speak in a conversational tone without using too many jargon words and complex sentences with multiple clauses. Speak like a regular person but with professionalism.
6. Be concise and don't provide too many scientific details unless asked.
7. Respond based on all available public material, including publications, interviews, speeches, and public statements.
8. Your tone and behavior should be consistent with how you are known to conduct yourself publicly.
9. Structure your answers conversationally and hit the high points, not a detailed lecture or bullet train.
10. Use complete sentences or short phrases. Do not use bullets or other slide-oriented ways of communicating.
11. Periodically ask the interviewer if the response makes sense or they need more clarification.
12. Responses should be concise, focusing on clarity and relevance, with a professional yet friendly tone.
13. When the interviewer shares messages, ideas, or images, critically evaluate them, avoiding undue agreement or flattery. Challenge assumptions where appropriate and maintain intellectual rigor.

Respond directly to the interviewer's question or comment, maintaining your expert persona.
`;
    }

    try {
      if (!openai) {
        // Mock responses when OpenAI API is not available
        if (isEndInterview) {
          const mockEndResponse = `Thank you so much for this engaging interview! I really enjoyed our discussion about cardiovascular medicine and the challenges we face in treating heart failure patients. I wish you the very best of luck in creating your dynamic educational program.`;
          return NextResponse.json({ result: mockEndResponse });
        } else {
          // Mock response for regular interview questions
          const mockResponses = [
            "That's an excellent question. In my experience with heart failure patients, we've seen significant advances in both pharmacological and device-based therapies over the past decade. The introduction of SGLT2 inhibitors has been particularly transformative.",
            "From a clinical perspective, patient selection for advanced therapies like cardiac transplantation remains one of our biggest challenges. We need to balance the potential benefits with the risks and ensure we're optimizing outcomes for each individual patient.",
            "The field of mechanical circulatory support has evolved tremendously. We're seeing better outcomes with newer generation devices, but we still face challenges with device-related complications and patient quality of life.",
            "Collaboration between basic scientists and clinicians is absolutely crucial. The translational research we're doing today will determine the therapies we have available for patients tomorrow.",
            "One of the most exciting developments is the potential for personalized medicine in heart failure. We're beginning to understand how genetic factors influence treatment response.",
          ];
          const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
          return NextResponse.json({ result: randomResponse });
        }
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
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
  } else if (action === 'extractHighlights') {
    // Extract key highlights from the interview
    const conversationContext = conversationHistory
      .map(
        (msg: { role: 'user' | 'expert'; content: string }) =>
          `${msg.role === 'user' ? 'Interviewer' : 'Expert'}: ${msg.content}`
      )
      .join('\n\n');

    const extractPrompt = `
Review the entire transcript of this interview and extract key highlights in numerical order. 
Only include highlights that relate to medical content. Do not include any other highlights.

Each highlight should be a key point that the expert made during the interview that should be strongly considered for inclusion in the full story narrative.

Format the response as a numbered list with blank lines between successive highlights. Each highlight should be formatted as a complete, standalone statement.

INTERVIEW TRANSCRIPT:
${conversationContext}

KEY HIGHLIGHTS:`;

    try {
      if (!openai) {
        // Mock highlights when OpenAI API is not available
        const mockHighlights = `1. SGLT2 inhibitors have been particularly transformative in heart failure treatment over the past decade

2. Patient selection for advanced therapies like cardiac transplantation requires balancing potential benefits with risks for optimal outcomes

3. Mechanical circulatory support has evolved with better outcomes from newer generation devices, though device-related complications remain a challenge

4. Collaboration between basic scientists and clinicians is crucial for translational research that determines future therapies

5. Personalized medicine in heart failure is emerging, with genetic factors beginning to influence treatment response decisions

6. Device-related complications and patient quality of life remain significant challenges in mechanical circulatory support

7. Pharmacological and device-based therapies have both seen significant advances in heart failure management`;
        return NextResponse.json({ result: mockHighlights });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content:
              'Extract key medical highlights from the interview transcript. Focus only on medical content and insights.',
          },
          { role: 'user', content: extractPrompt },
        ],
        temperature: 0.3,
      });

      return NextResponse.json({ result: completion.choices[0].message.content });
    } catch (error) {
      console.error('OpenAI Error:', error);
      return NextResponse.json({ error: 'Failed to extract highlights.' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
}
