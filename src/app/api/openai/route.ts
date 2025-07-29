import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
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
      // Mock response for testing - comment out when using real OpenAI
      return NextResponse.json({
        result: `Core Story Concept Candidate #2

**TENSION**
Healthcare professionals treating diabetes often encounter patients who experience gastrointestinal side effects with metformin, leading to poor adherence and suboptimal outcomes. The challenge lies in balancing therapeutic efficacy with patient tolerability, as discontinuation rates remain high despite metformin's proven benefits in diabetes management.

**RESOLUTION**
The key to optimizing metformin therapy lies in understanding its dose-dependent pharmacokinetics and implementing strategic dosing protocols. Extended-release formulations and gradual dose titration can significantly reduce GI intolerance while maintaining therapeutic effectiveness. This approach allows healthcare professionals to maximize patient adherence and long-term glycemic control, ensuring that more patients can benefit from metformin's comprehensive metabolic advantages.`,
      });

      // Uncomment below when using real OpenAI API
      /*
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4',
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

2. Use the following title: "Core Story Concept Candidate #X" where X is the number of the current core story concept, then add a blank line after this. 
3. Following the title, distill each truth into a memorable mini-narrative that is structured in the form of a tension section which is ${length} and a resolution section which is ${length}. The resolution pays off the tension in hand-in-glove fashion that makes perfect sense. Do not display the number of words in the tension and resolution section – just use the words "TENSION" and "RESOLUTION".

Return only the concepts in the template above.`,
          },
          ...messages,
        ],
      });

      return NextResponse.json({ result: chatCompletion.choices[0].message.content });
      */
    } catch (error) {
      console.error('OpenAI Error:', error);
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }
  }

  // Initial core story concept generation
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
3. Following the title, distill each truth into a memorable mini-narrative that is structured in the form of a tension section which is ${length} and a resolution section which is ${length}. The resolution pays off the tension in hand-in-glove fashion that makes perfect sense. Do not display the number of words in the tension and resolution section – just use the words "TENSION" and "RESOLUTION".

Return only the concepts in the template above.

Your deliverable
Create a Core Story Concept using the guidelines above.
        `;

  try {
    // Mock response for testing - comment out when using real OpenAI
    return NextResponse.json({
      result: `Core Story Concept Candidate #1

**TENSION**
Healthcare professionals treating diabetes face a persistent challenge: despite metformin's established role as first-line therapy, many patients still struggle with suboptimal glycemic control and progressive disease complications. The traditional approach of simply prescribing metformin often overlooks the complex interplay between insulin resistance, hepatic glucose production, and cellular energy metabolism that drives diabetes progression.

**RESOLUTION**
Metformin's true power lies not just in lowering blood glucose, but in its unique ability to activate AMPK (AMP-activated protein kinase) - the body's master metabolic switch. This activation simultaneously reduces hepatic glucose production, enhances insulin sensitivity, and improves cellular energy efficiency, creating a comprehensive metabolic reset that addresses diabetes at its fundamental level. For healthcare professionals, this means metformin offers a mechanistic advantage that goes beyond glucose control, providing patients with a foundation for long-term metabolic health.`,
    });

    // Uncomment below when using real OpenAI API
    /*
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
    */
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
