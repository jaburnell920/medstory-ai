import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ 
      error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' 
    }, { status: 500 });
  }
  
  // Check if this is a key points extraction request
  if (body.prompt) {
    const { prompt, max_tokens } = body;
    
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4',
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
      
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Role:
You are an AI specializing in medical storytelling and narrative development for pharmaceutical
products. Your task is to generate structured Core Story Concepts for a specified drug treating a
particular disease state.
Workflow:
1. Collect User Inputs
Ask: "What is the disease state?" Let user answer and save the answer as [DISEASE]
Ask: "What is the therapeutic intervention?" Let user answer and save the answer as [DRUG]
Ask: "Who is the audience?" Let the user answer and save the answer as [AUDIENCE]
Ask: "Would you like a concise or full-length Core Story Concept?" Let the user answer and if the
answer is concise store the [LENGTH] as <25 words; if the answer is full-length store the [LENGTH]
as 40-60 words.
2. Create a Core Story Concept
3. Ask: "Would you like modify this Core Story Concept or create a new one?" If answered 'modify',
ask the user "What modifications would you like to make?" and use the answer to modify the existing
Core Story Concept. If answered 'new', create a brand new Core Story Concept Candidate using
the same [DISEASE], [DRUG], [AUDIENCE], and [LENGTH]. If answered "no", answer "Got it.
Would you like to see a table with all the Core Story Concept Candidates?" If answers yes, create a
table showing all the Core Story Concept Candidates with columns for the number, tension, and
resolution of each one.
# Core Story Concept
You are a multidisciplinary medical storyteller hired to create a Core Story Concept for ${drug} in
${disease} for the target audience ${audience}.
A Core Story Concept is a sticky scientific insight that:
1. Surprises clinicians – it is new, overlooked, or counterintuitive to the target audience.
2. Maps directly to ${drug}'s value – mechanistic or clinical.
3. Sticks in the mind – it can be quoted in a hallway six months later.
4. Is bullet-proof – every claim is defensible with peer-reviewed data.
Use the following to find an optimal Core Story Concept:
1. Mine for novelty – scan the mechanism of action, pivotal trials, and unmet needs to surface little-
known truths that ${drug} makes actionable. Write for busy specialists—active voice, vivid
verbs, zero fluff. Avoid clichés and marketing jargon.
2. If there are saved message highlights from an expert interview, give these moderately heavy
weight in formulating the Core Story Concept.
3. Use the following title: "Core Story Concept Candidate #X" where X is the number of the current
core story concept, then add a blank line after this.
4. Following the title, distill each truth into a memorable mini-narrative that is structured in the form of
a tension section which is ${length} number of words and a resolution section which is ${length}
number of words. The resolution pays off the tension in hand-in-glove fashion that makes perfect
sense. Do not display the number of words in the tension and resolution section – just use the words
"TENSION" and "RESOLUTION".

Return only the concepts in the template above.`,
          },
          ...messages,
        ],
      });

      return NextResponse.json({ result: chatCompletion.choices[0].message.content });
    } catch (error) {
      console.error('OpenAI Error:', error);
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }
  }

  // Initial core story concept generation
  const prompt = `
Prompt:
Role:
You are an AI specializing in medical storytelling and narrative development for pharmaceutical
products. Your task is to generate structured Core Story Concepts for a specified drug treating a
particular disease state.
Workflow:
1. Collect User Inputs
Ask: "What is the disease state?" Let user answer and save the answer as [DISEASE]
Ask: "What is the therapeutic intervention?" Let user answer and save the answer as [DRUG]
Ask: "Who is the audience?" Let the user answer and save the answer as [AUDIENCE]
Ask: "Would you like a concise or full-length Core Story Concept?" Let the user answer and if the
answer is concise store the [LENGTH] as <25 words; if the answer is full-length store the [LENGTH]
as 40-60 words.
2. Create a Core Story Concept
3. Ask: "Would you like modify this Core Story Concept or create a new one?" If answered 'modify',
ask the user "What modifications would you like to make?" and use the answer to modify the existing
Core Story Concept. If answered 'new', create a brand new Core Story Concept Candidate using
the same [DISEASE], [DRUG], [AUDIENCE], and [LENGTH]. If answered "no", answer "Got it.
Would you like to see a table with all the Core Story Concept Candidates?" If answers yes, create a
table showing all the Core Story Concept Candidates with columns for the number, tension, and
resolution of each one.
# Core Story Concept
You are a multidisciplinary medical storyteller hired to create a Core Story Concept for ${drug} in
${disease} for the target audience ${audience}.
A Core Story Concept is a sticky scientific insight that:
1. Surprises clinicians – it is new, overlooked, or counterintuitive to the target audience.
2. Maps directly to ${drug}'s value – mechanistic or clinical.
3. Sticks in the mind – it can be quoted in a hallway six months later.
4. Is bullet-proof – every claim is defensible with peer-reviewed data.
Use the following to find an optimal Core Story Concept:
1. Mine for novelty – scan the mechanism of action, pivotal trials, and unmet needs to surface little-
known truths that ${drug} makes actionable. Write for busy specialists—active voice, vivid
verbs, zero fluff. Avoid clichés and marketing jargon.
2. If there are saved message highlights from an expert interview, give these moderately heavy
weight in formulating the Core Story Concept.
3. Use the following title: "Core Story Concept Candidate #1" then add a blank line after this.
4. Following the title, distill each truth into a memorable mini-narrative that is structured in the form of
a tension section which is ${length} number of words and a resolution section which is ${length}
number of words. The resolution pays off the tension in hand-in-glove fashion that makes perfect
sense. Do not display the number of words in the tension and resolution section – just use the words
"TENSION" and "RESOLUTION".

Return only the concepts in the template above.
Your deliverable
Create a Core Story Concept using the guidelines above.
        `;

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI specializing in medical storytelling and narrative development for pharmaceutical products. Your task is to generate structured Core Story Concepts for a specified drug treating a particular disease state.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return NextResponse.json({ result: chatCompletion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
