import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const { coreStoryConcept, audience, interventionName, diseaseCondition, action, userMessage, conversationHistory } = await request.json();

    if (action === 'start') {
      // Mock response for testing when no OpenAI API key is available
      if (!openai) {
        const mockResult = `Attack Point #1

In the pediatric ICU, 8-year-old Emma's leukemia cells had survived every conventional treatment—chemotherapy, radiation, even a bone marrow transplant. Her CD19+ B-cells, once targets for therapy, had become invisible to traditional treatments. As her parents watched her condition deteriorate, her oncologist prepared to discuss palliative care. But hidden within Emma's own immune system lay engineered T-cells, reprogrammed with chimeric antigen receptors, waiting to launch a precision strike that would redefine the boundaries between life and death in pediatric oncology.

Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?`;
        return NextResponse.json({ result: mockResult });
      }

      const systemPrompt = `You are a cinematic scientific storyteller hired to craft compelling clinical narratives for practicing physicians. You will create both an Attack Point and Tension-Resolution Points based on the provided parameters.

PARAMETERS PROVIDED:
- Core Story Concept: ${coreStoryConcept}
- Audience: ${audience}
- Intervention Name: ${interventionName}
- Disease or Condition: ${diseaseCondition}

PHASE 1: ATTACK POINT
You are a cinematic scientific storyteller hired to craft one Attack Point—the opening scene of a clinical narrative that hooks practicing physicians and compels them to keep reading. An Attack Point must:
• Jolt attention within one breath: an arresting fact, anecdote, or paradox.
• Connect to the Core Story Concept—the seed of the therapeutic insight is visible, even if the intervention is not yet named.
• Leaves a cliffedge question that demands resolution.

Structure of Attack Point:
Produce Attack Points using the template below for each Attack Point:
• First line should be "Attack Point #X" where X is the number of the most recently created Attack Point
• Open with a vivid moment or revelation.
• Pose or imply the clinical problem.
• Hint at why traditional thinking is about to be challenged.

How to Craft Attack Point:
• One snapshot, zero exposition—drop the reader into the scene; explain later.
• Open with a vivid moment or revelation.
• Pose or imply the clinical problem.
• Hint at why traditional thinking is about to be challenged.
• Tieback thread—embed a detail (enzyme, biomarker, patient quote) that will resurface in later beats.
• Physiciansafe hype—sensational but factually precise; no drug claims yet unless historically crucial.
• Soundbite test—the headline should be repeatable in a conference hallway.
• No clichés—replace "gamechanger" with concrete imagery or data.
• Attack point text should be ≤100 words.

Return only the filled-out template—no commentary.

IMPORTANT: After delivering the attack point, you MUST ask: "Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?"

Begin with creating the Attack Point.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Please create an Attack Point for the following:

Core Story Concept: ${coreStoryConcept}
Audience: ${audience}
Intervention Name: ${interventionName}
Disease or Condition: ${diseaseCondition}

Please start with the Attack Point phase.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const result = completion.choices[0]?.message?.content || 'No response generated.';
      return NextResponse.json({ result });

    } else if (action === 'continue') {
      // Mock response for testing when no OpenAI API key is available
      if (!openai) {
        let mockResult = '';
        
        if (userMessage.toLowerCase().includes('move on') || userMessage.toLowerCase().includes('tension')) {
          mockResult = `Would you like a short narrative (3-5 tension-resolution points), full narrative (8-12 tension-resolution points), or would you like to specify the number of tension-resolution points?`;
        } else if (userMessage.toLowerCase().includes('short')) {
          mockResult = `**Tension-Resolution #1:** Immune System Failure
Tension: Traditional chemotherapy had failed Emma repeatedly, with each relapse more aggressive than the last, leaving her immune system devastated and her family desperate.
Resolution: CAR-T cell therapy offered a revolutionary approach—reprogramming her own T-cells to recognize and destroy the CD19+ leukemia cells that had evaded conventional treatment.

**Tension-Resolution #2:** Engineering Hope
Tension: The complex manufacturing process required extracting Emma's T-cells, genetically modifying them in specialized laboratories, and expanding them over weeks while her condition deteriorated.
Resolution: Advanced viral vectors successfully delivered the chimeric antigen receptor genes, creating millions of engineered cells capable of sustained anti-leukemia activity.

**Tension-Resolution #3:** The Cellular Storm
Tension: Within days of infusion, Emma developed severe cytokine release syndrome as her modified T-cells launched an unprecedented immune assault against her cancer.
Resolution: Careful management with tocilizumab and supportive care controlled the inflammatory response while preserving the therapeutic effect of the CAR-T cells.

**Conclusion**
Emma achieved complete remission within 30 days, demonstrating how personalized cellular immunotherapy can transform outcomes in relapsed/refractory B-cell ALL, offering hope where conventional treatments have failed.

References
1. Maude SL, et al. Tisagenlecleucel in children and young adults with B-cell lymphoblastic leukemia. *N Engl J Med.* 2018;378:439-448.
2. Lee DW, et al. T cells expressing CD19 chimeric antigen receptors for acute lymphoblastic leukaemia in children and young adults. *Lancet.* 2015;385:517-528.

Would you like the tension-resolution points put into a table format?`;
        } else if (userMessage.toLowerCase().includes('table')) {
          mockResult = `| # | Tension | Resolution |
|---|---------|------------|
| AP | In the pediatric ICU, 8-year-old Emma's leukemia cells had survived every conventional treatment—chemotherapy, radiation, even a bone marrow transplant. Her CD19+ B-cells, once targets for therapy, had become invisible to traditional treatments. As her parents watched her condition deteriorate, her oncologist prepared to discuss palliative care. But hidden within Emma's own immune system lay engineered T-cells, reprogrammed with chimeric antigen receptors, waiting to launch a precision strike that would redefine the boundaries between life and death in pediatric oncology. | |
| 1 | Traditional chemotherapy had failed Emma repeatedly, with each relapse more aggressive than the last, leaving her immune system devastated and her family desperate. | CAR-T cell therapy offered a revolutionary approach—reprogramming her own T-cells to recognize and destroy the CD19+ leukemia cells that had evaded conventional treatment. |
| 2 | The complex manufacturing process required extracting Emma's T-cells, genetically modifying them in specialized laboratories, and expanding them over weeks while her condition deteriorated. | Advanced viral vectors successfully delivered the chimeric antigen receptor genes, creating millions of engineered cells capable of sustained anti-leukemia activity. |
| 3 | Within days of infusion, Emma developed severe cytokine release syndrome as her modified T-cells launched an unprecedented immune assault against her cancer. | Careful management with tocilizumab and supportive care controlled the inflammatory response while preserving the therapeutic effect of the CAR-T cells. |
| CSC | | Emma achieved complete remission within 30 days, demonstrating how personalized cellular immunotherapy can transform outcomes in relapsed/refractory B-cell ALL, offering hope where conventional treatments have failed. |

Would you like me to write a script based on the above story flow outline that would be suitable for a highly engaging TED talk?`;
        } else {
          mockResult = `What modifications would you like to make to the Attack Point?`;
        }
        
        return NextResponse.json({ result: mockResult });
      }

      // Build conversation context
      const conversationContext = conversationHistory
        .map((msg: { role: 'user' | 'assistant'; content: string }) =>
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        )
        .join('\n\n');

      const continuePrompt = `You are continuing to help create a Story Flow Outline with Attack Point and Tension-Resolution Points.

PARAMETERS:
- Core Story Concept: ${coreStoryConcept}
- Audience: ${audience}
- Intervention Name: ${interventionName}
- Disease or Condition: ${diseaseCondition}

CONVERSATION SO FAR:
${conversationContext}

LATEST USER MESSAGE: ${userMessage}

GUIDELINES FOR RESPONSES:
1. If user wants to modify an Attack Point, ask "What modifications would you like to make?" and then modify accordingly.
2. If user wants a new Attack Point, create a brand new one using the same guidelines.
3. If user wants to move on to tension-resolution points, ask if they want a short narrative (3-5 tension-resolution points), full narrative (8-12 tension-resolution points), or they want to specify the number.
4. When creating tension-resolution points, use this template:

**Tension-Resolution #1:** (headline text)
Tension: (tension text)
Resolution: (resolution text)

5. After tension-resolution points, add references using peer-reviewed literature.
6. After references, ask if they want the points put into a table format.
7. Finally, ask if they want a TED talk script based on the story flow outline.

TENSION-RESOLUTION GUIDELINES:
• Escalate through tension-resolution beats – each beat deepens stakes and delivers a data-driven payoff.
• Flow like electricity: each tension must logically surge from the previous resolution.
• Stay vivid & precise: verbs punch, jargon minimal, every claim is source-backed.
• Headline text should be ≤6 words. Tension and resolution text should be ≤50 words.

Respond appropriately to the user's latest message, following the conversation flow.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a cinematic scientific storyteller helping create compelling clinical narratives. Follow the guidelines exactly as specified and maintain conversation flow.',
          },
          { role: 'user', content: continuePrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const result = completion.choices[0]?.message?.content || 'No response generated.';
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in tension-resolution API:', error);
    return NextResponse.json(
      { error: 'Failed to generate tension-resolution content' },
      { status: 500 }
    );
  }
}
