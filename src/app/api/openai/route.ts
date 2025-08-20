import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.',
      },
      { status: 500 }
    );
  }

  // Check if this is a key points extraction request
  if (body.prompt) {
    const { prompt, max_tokens } = body;

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for extracting key points from interviews.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: max_tokens || 1000,
      });

      return NextResponse.json({ result: chatCompletion.choices[0].message.content });
    } catch (error) {
      console.error('OpenAI Error:', error);
      return NextResponse.json({ error: 'Failed to extract key points' }, { status: 500 });
    }
  }

  // Core story concept functionality with new prompt
  const { disease, drug, audience, length, messages } = body;

  // Check if we have messages (for modifications or new concepts)
  if (messages && messages.length > 0) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Use default length if empty
      const effectiveLength = length || '40';

      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: `Role:
You are an AI specializing in medical storytelling and narrative development for pharmaceutical products. Your task is to generate structured Core Story Concepts for a specified drug treating a particular disease state.

# Core Story Concept
You are a multidisciplinary medical storyteller hired to create a Core Story Concept for ${drug} in ${disease} for the target audience ${audience}.

A Core Story Concept is a sticky scientific insight that:

1. Surprises clinicians – it is new, overlooked, or counterintuitive to the target audience.

2. Maps directly to ${drug}'s value – mechanistic or clinical.

3. Sticks in the mind – it can be quoted in a hallway six months later.

4. Is bullet-proof – every claim is defensible with peer-reviewed data.

Use the following to find an optimal Core Story Concept: 
1. Mine for novelty – scan the mechanism of action, pivotal trials, and unmet needs to surface little-known truths that ${drug} makes actionable. Write for busy specialists—active voice, vivid verbs, zero fluff. Avoid clichés and marketing jargon.
2. If there are saved message highlights from an expert interview, give these moderately heavy
weight in formulating the Core Story Concept.
3. Use the following title: "Core Story Concept Candidate #X" where X is the number of the current core story concept, then add a blank line after this. For the first concept in a session, always use #1. 
4. Following the title, distill each truth into a memorable mini-narrative that is structured in the form of
a tension section which is ${effectiveLength} number of words and a resolution section which is ${effectiveLength}
number of words. The resolution pays off the tension in hand-in-glove fashion that makes perfect
sense. For the section titles, use only the words "TENSION" and "RESOLUTION" without any asterisks, 
quotation marks, or colons. Always include a blank line after each section title.

Return only the concepts in the template above.`,
          },
          ...messages,
        ],
      });

      let result = chatCompletion.choices[0].message.content;

      // Check if the response is the unhelpful length specification message
      if (result && result.includes('specify the length for the Tension and Resolution sections')) {
        console.log('Detected unhelpful response, retrying with explicit length...');
        
        // Retry with a more explicit prompt
        const retryCompletion = await openai.chat.completions.create({
          model: 'gpt-5',
          messages: [
            {
              role: 'system',
              content: `You are an AI specializing in medical storytelling and narrative development for pharmaceutical products. Your task is to generate structured Core Story Concepts for a specified drug treating a particular disease state.

You must create a Core Story Concept with exactly ${effectiveLength} words in the TENSION section and exactly ${effectiveLength} words in the RESOLUTION section.

Never ask for clarification about length - always generate the content with the specified word count.`,
            },
            ...messages,
          ],
        });
        
        result = retryCompletion.choices[0].message.content;
      }

      return NextResponse.json({ result });
    } catch (error) {
      console.error('OpenAI Error:', error);
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }
  }

  // Initial core story concept generation
  // Use default length if empty
  const effectiveLength = length || '40';
  
  const prompt = `
# Core Story Concept
You are a multidisciplinary medical storyteller hired to create a Core Story Concept for ${drug} in ${disease} for the target audience ${audience}.

A Core Story Concept is a sticky scientific insight that:

1. Surprises clinicians – it is new, overlooked, or counterintuitive to the target audience.

2. Maps directly to ${drug}'s value – mechanistic or clinical.

3. Sticks in the mind – it can be quoted in a hallway six months later.

4. Is bullet-proof – every claim is defensible with peer-reviewed data.

Use the following to find an optimal Core Story Concept: 
1. Mine for novelty – scan the mechanism of action, pivotal trials, and unmet needs to surface little-known truths that ${drug} makes actionable. Write for busy specialists—active voice, vivid verbs, zero fluff. Avoid clichés and marketing jargon.
2. If there are saved message highlights from an expert interview, give these moderately heavy
weight in formulating the Core Story Concept.
3. Use the following title: "Core Story Concept Candidate #1" then add a blank line after this. Always use #1 for the first concept. 
4. Following the title, distill each truth into a memorable mini-narrative that is structured in the form of a tension section which is ${effectiveLength} words and a resolution section which is ${effectiveLength} words. The resolution pays off the tension in hand-in-glove fashion that makes perfect sense. For the section titles, use only the words "TENSION" and "RESOLUTION" without any asterisks, quotation marks, or colons. Always include a blank line after each section title.

Return only the concepts in the template above.

Your deliverable
Create a Core Story Concept using the guidelines above.
        `;

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI specializing in medical storytelling and narrative development for pharmaceutical products. Your task is to generate structured Core Story Concepts for a specified drug treating a particular disease state. Never ask for clarification about length - always generate the content with the specified word count.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    let result = chatCompletion.choices[0].message.content;

    // Check if the response is the unhelpful length specification message
    if (result && result.includes('specify the length for the Tension and Resolution sections')) {
      console.log('Detected unhelpful response in initial generation, retrying with explicit length...');
      
      // Retry with a more explicit prompt
      const retryCompletion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: `You are an AI specializing in medical storytelling and narrative development for pharmaceutical products. Your task is to generate structured Core Story Concepts for a specified drug treating a particular disease state.

You must create a Core Story Concept with exactly ${effectiveLength} words in the TENSION section and exactly ${effectiveLength} words in the RESOLUTION section.

Never ask for clarification about length - always generate the content with the specified word count.`,
          },
          {
            role: 'user',
            content: `Create a Core Story Concept Candidate #1 for ${drug} in ${disease} for the target audience ${audience}. Use exactly ${effectiveLength} words for both the TENSION and RESOLUTION sections.`,
          },
        ],
      });
      
      result = retryCompletion.choices[0].message.content;
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
