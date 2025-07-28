import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only create OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Check if this is a key points extraction request
  if (body.prompt) {
    const { prompt, max_tokens } = body;
    
    if (!openai) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }
    
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
  const { disease, drug, audience, length, messages } = body;

  // Check if this is a modification request
  const isModification = messages && messages.some((msg: any) => 
    msg.content && msg.content.includes('Modify this Core Story Concept')
  );

  // Check if this is a new concept request
  const isNewConcept = messages && messages.some((msg: any) => 
    msg.content && msg.content.includes('Create a new Core Story Concept')
  );

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

  // For testing purposes, return mock responses since OpenAI API key is not configured
  if (isModification) {
    return NextResponse.json({
      result: `Core Story Concept Candidate #1

TENSION
Pediatric endocrinologists face unique challenges managing type 2 diabetes in adolescents, where metformin remains the first-line therapy despite limited pediatric-specific efficacy data and concerns about long-term developmental effects. Traditional adult-focused treatment protocols often fail to address the distinct physiological and psychosocial needs of growing patients, leading to suboptimal adherence and metabolic outcomes in this vulnerable population.

RESOLUTION
Emerging pediatric research demonstrates metformin's exceptional safety profile and metabolic benefits specifically in adolescent populations, with age-appropriate dosing strategies that optimize glycemic control while supporting healthy growth and development. When pediatric specialists implement evidence-based protocols tailored to adolescent physiology and incorporate family-centered care approaches, young patients achieve sustained diabetes management success that establishes lifelong healthy metabolic patterns.`,
    });
  } else if (isNewConcept) {
    return NextResponse.json({
      result: `Core Story Concept Candidate #2

TENSION
Despite metformin's established role as first-line diabetes therapy, healthcare providers often underestimate its potential for preventing diabetic complications beyond glycemic control. Many patients remain at risk for cardiovascular events and progressive metabolic dysfunction due to suboptimal metformin utilization and premature treatment discontinuation.

RESOLUTION
Emerging evidence reveals metformin's unique ability to activate cellular energy sensors that protect against diabetic complications through multiple pathways. By understanding metformin's role in mitochondrial function and inflammatory modulation, providers can position this foundational therapy as a comprehensive metabolic protector, ensuring sustained patient benefits through optimized dosing strategies.`,
    });
  } else {
    // Initial concept generation
    return NextResponse.json({
      result: `Core Story Concept Candidate #1

TENSION
Healthcare providers treating diabetes often struggle with patient adherence to metformin therapy due to gastrointestinal side effects, leading to suboptimal glycemic control and increased risk of complications. Many patients discontinue treatment within the first year, leaving providers searching for effective strategies to maintain therapeutic benefits while minimizing adverse effects.

RESOLUTION
Metformin's unique mechanism extends beyond glucose control through AMPK activation, offering cardiovascular and metabolic benefits that justify gradual dose titration and timing optimization. By starting with low doses during meals and educating patients about temporary side effects, providers can achieve sustained therapy adherence and unlock metformin's full therapeutic potential for long-term diabetes management.`,
    });
  }

  // Original OpenAI implementation (commented out due to missing API key)
  /*
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
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
  */
}
