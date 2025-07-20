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
  
  // Original core story concept functionality
  const { drug, disease, audience, intensity } = body;

  const prompt = `
      You are helping create a Core Story Concept for a medical communication tool.

      Please generate a concept candidate based on:

      - Drug: ${drug}
      - Disease or condition: ${disease}
      - Audience: ${audience}
      - Intensity of emotion/creativity: ${intensity}

      Structure your response with the following headings:
      Tension:
      [One paragraph]

      Resolution:
      [One paragraph]

      Only return the content, no commentary or intro.
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
