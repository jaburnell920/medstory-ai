import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Check if this is a key points extraction request
  if (body.prompt) {
    const { prompt, max_tokens } = body;
    
    try {
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
  const { disease, drug, audience, length } = body;

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

2. Use the following title: "Core Story Concept Candidate #1" then add a blank line after this. 
3. Following the title, distill each truth into a memorable mini-narrative that is structured in the form of a tension section which is ${length} number of words and a resolution section which is ${length} number of words. The resolution pays off the tension in hand-in-glove fashion that makes perfect sense. Do not display the number of words in the tension and resolution section – just use the words "TENSION" and "RESOLUTION".

Return only the concepts in the template above.
        `;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for scientific storytelling.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return NextResponse.json({ result: chatCompletion.choices[0].message.content });

    // return NextResponse.json({
    //   result: `Tension:
    //   In a world where kidney stones cause excruciating pain and inefficiency in daily life, urologists face the ongoing challenge of providing effective treatments to prevent reoccurrence in their patients. Despite various therapeutic approaches, many individuals still endure the agony of kidney stone formation, prompting urologists to seek innovative solutions to improve patient outcomes and quality of life.

    //   Resolution:
    //   Introducing magnesium as a potential game-changer in the prevention of kidney stones. Through in-depth research and clinical trials, urologists discover the promising role of magnesium in inhibiting the formation of crystals that lead to stone development. As urologists delve deeper into the science behind magnesium's mechanisms of action, they uncover a new avenue for personalized treatment strategies, empowering them to offer their patients a proactive and effective approach to managing kidney stone recurrence.,`,
    // });
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
