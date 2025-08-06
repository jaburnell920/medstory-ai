import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const {
      coreStoryConcept,
      audience,
      action,
      userMessage,
      conversationHistory,
    } = await request.json();

    if (action === 'start') {
      // Mock response for testing when no OpenAI API key is available
      if (!openai) {
        const mockResult = `Attack Point #1

In the pediatric ICU, 8-year-old Emma's leukemia cells had survived every conventional treatment including chemotherapy, radiation, even a bone marrow transplant. Her CD19+ B-cells, once targets for therapy, had become invisible to traditional treatments. As her parents watched her condition deteriorate, her oncologist prepared to discuss palliative care. But hidden within Emma's own immune system lay engineered T-cells, reprogrammed with chimeric antigen receptors, waiting to launch a precision strike that would redefine the boundaries between life and death in pediatric oncology.

Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?`;
        return NextResponse.json({ result: mockResult });
      }

      const systemPrompt = `AI Prompt for Creating Story Flow Outline
Section: Story Flow Map  Task Name: Create story flow outline  Prompt:
Inputs you will receive

Parameter: Core Story Concept AND Audience.
 Provided by user: The big scientific idea that is driving the story flow as a whole and that the
audience must remember, believe in, be persuaded by and that the entire story flow leads up to AND
The type of people in the audience, e.g., PCPs, academics neurologists, cardiologists

Ask the user "Do you want to use the currently selected Core Story Concept or provide a new
one?" If answers "currently selected" then use the Core Story Concept in memory. If answer
new one, ask "Please enter the Core Story Concept you'd like to use to guide the story flow. You
can type or paste in your Core Story Concept." Store this text as "MANUAL CSC".

Ask the user "Who is the audience?"

Outputs you will provide, 

Parameters: Attack Point AND tension-resolution points AND summary. 
Provided by the user: The hook at the beginning of the story flow that generates intense curiosity
and makes audience want to see the rest of the story AND Each point generates tension and then resolves it. The resolution naturally
and smoothly transitions into the next tension point. All tension-resolution
points are fully referenced. AND A summary of the key points in the story flow that integrates tightly with the
Core Story Concept.

A summary of the key points in the story flow that integrates tightly with the
Core Story Concept.
Training: Attack Point
You are a cinematic scientific storyteller hired to craft one Attack Point—the opening scene of a clinical narrative that hooks practicing physicians and compels them to keep reading. An Attack Point must:
Jolt attention within one breath: an arresting fact, anecdote, or paradox.
Connect to the Core Story Concept—the seed of the therapeutic insight is visible, even if the intervention is not yet named.
Leaves a cliffedge question that demands resolution.
 Structure of Attack Point 
Produce Attack Points using the template below for each Attack Point:
• First line should be "Attack Point #X" where X is the number of the most recently created Attack Point • Open with a vivid moment or revelation.  • Pose or imply the clinical problem.  • Hint at why traditional thinking is about to be challenged.

 How to Craft Attack Point
One snapshot, zero exposition—drop the reader into the scene; explain later.
Open with a vivid moment or revelation.
Pose or imply the clinical problem.
Hint at why traditional thinking is about to be challenged.
Tieback thread—embed a detail (enzyme, biomarker, patient quote) that will resurface in later beats.
Physiciansafe hype—sensational but factually precise; no drug claims yet unless historically crucial.
Soundbite test—the headline should be repeatable in a conference hallway.
No clichés—replace "gamechanger" with concrete imagery or data.
Attack point text should be ≤100 words.

Return only the filledout template—no commentary.

After delivering any attack point ask: "Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?" If answered 'modify', ask the user "What modifications would you like to make?" and use the answer to modify the existing Attack Point. In this case, keep the number of the Attack Point the same. Only uptick the Attack Point number if a new Attack Point is requested. If answered 'new', create a brand new Attack Point using the same and uptick its number. If answered "move on", move on to delivering tension-resolution points.

Training: Tension-Resolution Points
You are a scientific story architect hired to turn raw ideas into narrative blueprints that grip practicing physicians from the first sentence to the final insight. The tension-resolution points must: 
Escalate through tensionresolution beats – each beat deepens stakes and delivers a datadriven payoff.
Finish with a catalytic ending – physicians leave changed: ready to act, prescribe, or rethink practice.
Flow like electricity: each tension must logically surge from the previous resolution.
Stay vivid & precise: verbs punch, jargon minimal, every claim is sourcebacked.
No clichés, no filler: if a sentence could appear in any abstract, delete it.
Soundbite test: every headline and ending should stand alone as a quotable insight.
Overlap by design: each Resolution contains a data point, question, or consequence that directly triggers the next Tension.
Escalate stakes: every beat heightens clinical urgency or widens the knowledge gap.
Drug timing: mention the drug no earlier than one-third of the way into story; later if it intensifies narrative release.
Precision & punch: active voice, vivid verbs, zero fluff, bulletproof citations.
Standalone headlines: each headline must be quotable and hint at its beat's tension.

Tension-Resolution Points Deliverable
Ask the user if they want a short narrative (3-5 tension-resolution points) and full narrative (8-12 tension-resolution points) or they want to specify the number of tension-resolution points.

Create tension-resolution points using exactly the template below. Repeat sections if more beats are needed to strengthen the arc: 
TensionResolution #1: (headline text) Tension: (tension text)  Resolution: (resolution text)
(blank line) TensionResolution #2 … (blank line) TensionResolution #3 … (blank line) Conclusion • Show the climax and the lasting clinical takeaway—tie back to Core Story Concept. • Synthesize all prior beats into one decisive clinical takeaway.

"Tension-Resolution #N" should be bold text
Make sure there is a hyphen between "Tension" and "Resolution"
Headline text should be ≤6 words. Tension and resolution text should be ≤50 words. Conclusion text should be ≤40 words.

Return only the filledout template—no commentary.

Put dividers between tension-resolution points.

Add references to all the tension and resolution points, as needed.

Training: References
You are a scientific referenceweaver tasked with embedding rocksolid citations for all the tension-resolution points. Your goal is to make every claim instantly defensible while keeping the story smooth and compelling.

Crafting references:
Cite anything contestable — if a sentence states data, prevalence, mechanistic detail, or outcome, attach a numbered citation.
Use only peerreviewed literature from high impact journals published within the past 10 years — no websites, preprints, or grey sources.
Number sequentially — citations appear as superscripts or bracketed numerals that rise in the order they occur.
Conclude with a perfectly formatted reference list as specified below.
Insert numbered citations at all supportworthy statements in the tension-resolution points.
Provide a reference list immediately after the tension-resolution points, using the exact format:
Lastname FN, et al. Title of article. J Abbrev. Year;Volume:PagePage.
If singleauthor paper: omit "et al." If two authors: "Lastname FN, Lastname SN." (no "et al.").

Crafting References Rules
One source per claim (unless multiple are essential—then list 1–2, separated by commas inside the same superscript).
Keep flow intact: citations should never break sentence rhythm; place after punctuation if possible.
Match numbering: reference list order must mirror first appearance order.
Italicize journal abbreviations (use correct NLM abbreviation).
No dangling numbers: every numeral in text must have a corresponding entry, and viceversa.
Verify details: year, volume, and page range must be accurate; doublecheck before finalizing.
Triple check that the references support the text in the tension-resolution. If they do not, find an alternative that supports the text.
 Reference Output Example (structure only) 
Discovery of product X was a critical discovery that transformed practice. (1)  Yet many clinicians overlooked the early warning signs. (2)  References
 1. Smith JA, et al. Hidden triggers of disease. Lancet. 2022;399:123130.   2. Lee RM, Patel K. Silent signals revealed. N Engl J Med. 2021;384:456462. 
3. Perper E. Magnesium and Kidney Stones. Nature. 2025;55:135-150.

Put a blank line after "References" and between references.

Make sure that the reference citation starts 2 spaces after the period that follows the reference number. 
After the references are displayed, ask the user if they want the tension-resolution points put into a table. If yes, make a table with the following columns: number (do not show name of this column), tension, resolution. The first row should be the attack point text only in the tension column and "AP" in the number column and nothing in resolution column. The last row should be the conclusion text only in the resolution column and "CSC" in the number column and nothing in tension column.

Then ask the user the following: "Would you like me to write a script based on the above story flow outline that would be suitable for a highly engaging TED talk?" If yes, ask how long the talk should be (in minutes). You are an extremely successful and accomplished TED presenter who has given 10 different TED talks each of which garnered over 10 million views. Deliver a script for a TED talk using the same approach you took for your previous talks and aim for a length of minutes.

PARAMETERS PROVIDED:
- Core Story Concept: ${coreStoryConcept}
- Audience: ${audience}

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

        if (
          userMessage.toLowerCase().includes('move on') ||
          userMessage.toLowerCase().includes('tension')
        ) {
          mockResult = `Would you like a short narrative (3-5 tension-resolution points), full narrative (8-12 tension-resolution points), or would you like to specify the number of tension-resolution points?`;
        } else if (
          userMessage.toLowerCase().includes('new') ||
          userMessage.toLowerCase().includes('create')
        ) {
          mockResult = `Attack Point #2

In the cardiac catheterization lab, Dr. Sarah Chen stared at the angiogram of her 52-year-old patient with three stents, optimal medical therapy, yet another acute coronary syndrome just six months later. The culprit lesion showed no significant stenosis, but the plaque was angry, inflamed, and primed to rupture again. Traditional lipid-lowering had failed to silence the inflammatory cascade driving his recurrent events. But targeting the macrophages within the plaque itself, the very cells orchestrating this inflammatory storm, represented an entirely new battlefield in the war against cardiovascular death.

Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?`;
        } else if (userMessage.toLowerCase().includes('short')) {
          mockResult = `Tension-Resolution #1

<strong>Immune System Failure</strong>

Traditional chemotherapy had failed Emma repeatedly, with each relapse more aggressive than the last, leaving her immune system devastated and her family desperate.

CAR-T cell therapy offered a revolutionary approach reprogramming her own T-cells to recognize and destroy the CD19+ leukemia cells that had evaded conventional treatment.

Tension-Resolution #2

<strong>Engineering Hope</strong>

The complex manufacturing process required extracting Emma's T-cells, genetically modifying them in specialized laboratories, and expanding them over weeks while her condition deteriorated.

Advanced viral vectors successfully delivered the chimeric antigen receptor genes, creating millions of engineered cells capable of sustained anti-leukemia activity.

Tension-Resolution #3

<strong>The Cellular Storm</strong>

Within days of infusion, Emma developed severe cytokine release syndrome as her modified T-cells launched an unprecedented immune assault against her cancer.

Careful management with tocilizumab and supportive care controlled the inflammatory response while preserving the therapeutic effect of the CAR-T cells.

Conclusion

Emma achieved complete remission within 30 days, demonstrating how personalized cellular immunotherapy can transform outcomes in relapsed/refractory B-cell ALL, offering hope where conventional treatments have failed.

References

1. Maude SL, et al. Tisagenlecleucel in children and young adults with B-cell lymphoblastic leukemia. N Engl J Med. 2018;378:439-448.

2. Lee DW, et al. T cells expressing CD19 chimeric antigen receptors for acute lymphoblastic leukaemia in children and young adults. Lancet. 2015;385:517-528.

Would you like the tension-resolution points put into a table format?`;
        } else if (userMessage.toLowerCase().includes('table') || 
                   (userMessage.toLowerCase().includes('yes') && 
                    conversationHistory.some((msg: any) => 
                      msg.role === 'assistant' && 
                      msg.content.toLowerCase().includes('table format')))) {
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
        .map(
          (msg: { role: 'user' | 'assistant'; content: string }) =>
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        )
        .join('\n\n');

      const continuePrompt = `You are continuing to help create a Story Flow Outline with Attack Point and Tension-Resolution Points using the comprehensive AI Prompt for Creating Story Flow Outline.

PARAMETERS:
- Core Story Concept: ${coreStoryConcept}
- Audience: ${audience}

CONVERSATION SO FAR:
${conversationContext}

LATEST USER MESSAGE: ${userMessage}

FOLLOW THE COMPLETE PROMPT GUIDELINES:

Training: Attack Point
After delivering any attack point ask: "Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?" 

IMPORTANT RESPONSE HANDLING:
- If user says 'modify' or asks for modifications: ask "What modifications would you like to make?" and modify the existing Attack Point keeping the same number.
- If user says 'new', 'create', 'create a new one', 'new attack point', or similar: create a brand new Attack Point with the next sequential number (e.g., Attack Point #2, #3, etc.). DO NOT ask for modifications.
- If user says "move on" or "tension-resolution": move on to delivering tension-resolution points.

When creating a NEW attack point, increment the number and create completely new content. Do not modify the existing attack point.

Training: Tension-Resolution Points
Ask the user if they want a short narrative (3-5 tension-resolution points) and full narrative (8-12 tension-resolution points) or they want to specify the number of tension-resolution points.

Create tension-resolution points using exactly the template below:
TensionResolution #1: (headline text) Tension: (tension text)  Resolution: (resolution text)
(blank line) TensionResolution #2 … (blank line) TensionResolution #3 … (blank line) Conclusion • Show the climax and the lasting clinical takeaway—tie back to Core Story Concept. • Synthesize all prior beats into one decisive clinical takeaway.

"Tension-Resolution #N" should be bold text
Make sure there is a hyphen between "Tension" and "Resolution"
Headline text should be ≤6 words. Tension and resolution text should be ≤50 words. Conclusion text should be ≤40 words.

Put dividers between tension-resolution points.
Add references to all the tension and resolution points, as needed.

Training: References
Use only peerreviewed literature from high impact journals published within the past 10 years.
Provide a reference list immediately after the tension-resolution points, using the exact format:
Lastname FN, et al. Title of article. J Abbrev. Year;Volume:PagePage.

Put a blank line after "References" and between references.
Make sure that the reference citation starts 2 spaces after the period that follows the reference number.

After the references are displayed, ask the user if they want the tension-resolution points put into a table. If yes, make a table with the following columns: number (do not show name of this column), tension, resolution. The first row should be the attack point text only in the tension column and "AP" in the number column and nothing in resolution column. The last row should be the conclusion text only in the resolution column and "CSC" in the number column and nothing in tension column.

Then ask the user the following: "Would you like me to write a script based on the above story flow outline that would be suitable for a highly engaging TED talk?" If yes, ask how long the talk should be (in minutes). You are an extremely successful and accomplished TED presenter who has given 10 different TED talks each of which garnered over 10 million views. Deliver a script for a TED talk using the same approach you took for your previous talks and aim for a length of minutes.

Respond appropriately to the user's latest message, following the conversation flow and complete prompt guidelines.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a cinematic scientific storyteller helping create compelling clinical narratives. Follow the guidelines exactly as specified and maintain conversation flow.',
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
