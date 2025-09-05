import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// --- Segment config (Vercel reads these) ---
export const runtime = 'nodejs'; // avoid Edge’s shorter limits for long generations
export const dynamic = 'force-dynamic'; // no caching
export const maxDuration = 120; // raise to your plan’s max (e.g., 60s Pro, higher on Fluid Compute)
export const preferredRegion = ['iad1']; // your error shows iad1; pin close to reduce latency

export async function POST(req: NextRequest) {
  const { detailedPrompt } = await req.json();

  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      result: `# MEDSTORY® Presentation Outline

## Presentation Overview
**Target Audience:** Cardiologists  
**Duration:** 20 minutes  
**Maximum Slides:** 15  
**Tone:** Academic and professional  
**Visual Style:** Moderate visuals  
**Speaker Notes:** Included  

## Slide Structure

### Slide 1: Title Slide
**Content:** [Your Presentation Title]
**Speaker Notes:** Welcome the audience and introduce yourself. Set the stage for the presentation.

### Slide 2: Agenda
**Content:** Overview of key topics to be covered
**Speaker Notes:** Briefly outline what the audience can expect to learn.

### Slide 3: Problem Statement
**Content:** Current challenges in cardiology practice
**Speaker Notes:** Establish the tension - what problems are cardiologists facing today?

### Slide 4: Clinical Evidence
**Content:** Key research findings and data
**Speaker Notes:** Present compelling evidence that supports your narrative.

### Slide 5: Case Study Introduction
**Content:** Real-world patient scenario
**Speaker Notes:** Introduce a relatable case that resonates with your audience.

### Slide 6: Current Treatment Approach
**Content:** Standard of care limitations
**Speaker Notes:** Discuss current treatment limitations and unmet needs.

### Slide 7: The Solution
**Content:** Your proposed approach or intervention
**Speaker Notes:** Present the resolution to the tension established earlier.

### Slide 8: Mechanism of Action
**Content:** How the solution works
**Speaker Notes:** Explain the scientific rationale in terms cardiologists will appreciate.

### Slide 9: Clinical Trial Results
**Content:** Efficacy and safety data
**Speaker Notes:** Present key trial results with appropriate statistical context.

### Slide 10: Patient Outcomes
**Content:** Real-world impact on patient care
**Speaker Notes:** Connect the data to meaningful patient outcomes.

### Slide 11: Implementation Considerations
**Content:** Practical aspects of adoption
**Speaker Notes:** Address potential barriers and implementation strategies.

### Slide 12: Case Study Resolution
**Content:** How the solution helped the patient from Slide 5
**Speaker Notes:** Complete the narrative arc with a successful outcome.

### Slide 13: Future Directions
**Content:** What's next in this area
**Speaker Notes:** Discuss ongoing research and future possibilities.

### Slide 14: Key Takeaways
**Content:** 3-4 main points for the audience to remember
**Speaker Notes:** Reinforce the most important messages.

### Slide 15: Questions & Discussion
**Content:** Contact information and discussion prompt
**Speaker Notes:** Invite questions and facilitate discussion.

## Design Recommendations
- Use consistent color scheme throughout
- Include moderate visual elements (charts, diagrams, images)
- Maintain academic tone with professional typography
- Ensure all data visualizations are clear and impactful
- Use white space effectively to avoid clutter

## Timing Guide
- Introduction: 2 minutes
- Problem/Evidence: 5 minutes
- Solution/Mechanism: 6 minutes
- Results/Outcomes: 4 minutes
- Implementation/Future: 2 minutes
- Q&A: 1 minute

*Note: This is a demo outline. For full AI-powered generation, please configure your OpenAI API key.*`,
    });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // Keep overall request under your function ceiling
    timeout: 110_000, // 110s; below maxDuration to leave time to flush response
    maxRetries: 2,
  });

  try {
    // Stream the model output so the function stays active and returns data asap
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // faster + cheaper; good for outlines
      temperature: 0.7,
      // Increased token limit to accommodate complete presentation outlines with all sections (11+ slides)
      max_tokens: 8000,
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            'You are a world-class expert in generative AI prompting, PowerPoint design, live presentation coaching, TED Talk-style speaking, narrative storytelling structure, cognitive and behavioral psychology, persuasive science/business communication, visual data storytelling and infographic design, and stoic philosophy for clarity, simplicity, and purpose. Always provide complete, well-structured presentation outlines without markdown formatting symbols like **, ---, or ===. Use clear, clean text formatting. Generate the complete outline without stopping midway. NEVER end your response with dashes (---) or any separator symbols. Always complete the full requested number of slides.',
        },
        { role: 'user', content: detailedPrompt },
      ],
    });

    // Turn the OpenAI async iterator into a web ReadableStream for Next.js
    const encoder = new TextEncoder();
    let totalTokens = 0;
    let chunkCount = 0;
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting deck generation stream...');
          for await (const part of completion) {
            chunkCount++;
            const delta = part.choices?.[0]?.delta?.content;
            if (delta) {
              totalTokens += delta.length; // rough token estimate
              controller.enqueue(encoder.encode(delta));
            }
            
            // Log progress every 50 chunks
            if (chunkCount % 50 === 0) {
              console.log(`Deck generation progress: ${chunkCount} chunks, ~${totalTokens} characters`);
            }
            
            // Check for finish reason
            const finishReason = part.choices?.[0]?.finish_reason;
            if (finishReason) {
              console.log(`Deck generation finished with reason: ${finishReason}, total chunks: ${chunkCount}, total characters: ~${totalTokens}`);
            }
          }
          console.log('Deck generation stream completed successfully');
        } catch (err) {
          console.error('Error in deck generation stream:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    // Send as plain text; your client can accumulate into a single string
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    console.error('OpenAI Error in deck generation:', error);
    console.error('Error details:', {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack?.substring(0, 500), // truncate stack trace
    });

    let errorMessage = 'Failed to generate presentation outline';
    const msg = String((error as Error)?.message || '');

    if (msg.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again shortly.';
      console.log('Rate limit hit during deck generation');
    } else if (msg.includes('insufficient_quota')) {
      errorMessage = 'API quota exceeded. Please check your OpenAI account.';
      console.log('Quota exceeded during deck generation');
    } else if (msg.includes('invalid_api_key')) {
      errorMessage = 'Invalid API key. Please check your OpenAI configuration.';
      console.log('Invalid API key during deck generation');
    } else if (msg.includes('timeout') || msg.includes('APIConnectionTimeoutError')) {
      errorMessage = 'Generation timeout. The request took too long. Please try again.';
      console.log('Timeout during deck generation');
    } else if (msg.includes('max_tokens')) {
      errorMessage = 'Content too long. Please try with fewer slides or shorter content.';
      console.log('Max tokens exceeded during deck generation');
    } else {
      console.log('Unknown error during deck generation:', msg);
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
