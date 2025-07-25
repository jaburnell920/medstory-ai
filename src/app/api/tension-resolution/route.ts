import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { coreStoryConcept, audience, interventionName, diseaseCondition } = await request.json();

    // For testing purposes, if no OpenAI API key is provided, return a mock response
    if (!process.env.OPENAI_API_KEY) {
      const mockResponse = {
        content: `**Attack Point #1**

Dr. Sarah Chen stared at the lab results in disbelief. After 18 months of failed treatments, her patient with treatment-resistant depression showed a 70% reduction in symptoms within just 4 weeks. The breakthrough wasn't a new drug—it was knowing exactly which neuroinflammatory pathway to target.

Traditional antidepressants work for only 30% of TRD patients, leaving millions trapped in cycles of trial-and-error prescribing. But what if the solution isn't finding better drugs, but finding the right patients for existing interventions?

The biomarker panel revealed elevated IL-6 and TNF-α levels—inflammatory signatures that predicted response to targeted therapy with unprecedented accuracy.`,
        question: "Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?"
      };
      
      return NextResponse.json(mockResponse);
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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
• First line should be "**Attack Point #X**" where X is the number of the most recently created Attack Point (make this line bold using markdown)
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

IMPORTANT: Your response should be in JSON format with two fields:
- "content": The Attack Point content only
- "question": The follow-up question for the user

The follow-up question should be: "Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?"

Return only the JSON response with the Attack Point content and the follow-up question.

PHASE 2: TENSION-RESOLUTION POINTS
You are a scientific story architect hired to turn raw ideas into narrative blueprints that grip practicing physicians from the first sentence to the final insight. The tension-resolution points must:
• Escalate through tension-resolution beats – each beat deepens stakes and delivers a data-driven payoff.
• Finish with a catalytic ending – physicians leave changed: ready to act, prescribe, or rethink practice.
• Flow like electricity: each tension must logically surge from the previous resolution.
• Stay vivid & precise: verbs punch, jargon minimal, every claim is source-backed.
• No clichés, no filler: if a sentence could appear in any abstract, delete it.
• Soundbite test: every headline and ending should stand alone as a quotable insight.
• Overlap by design: each Resolution contains a data point, question, or consequence that directly triggers the next Tension.
• Escalate stakes: every beat heightens clinical urgency or widens the knowledge gap.
• Drug timing: mention the drug no earlier than one-third of the way into story; later if it intensifies narrative release.
• Precision & punch: active voice, vivid verbs, zero fluff, bulletproof citations.
• Standalone headlines: each headline must be quotable and hint at its beat's tension.

Tension-Resolution Points Deliverable:
Ask the user if they want a short narrative (3-5 tension-resolution points) and full narrative (8-12 tension-resolution points) or they want to specify the number of tension-resolution points.

Create tension-resolution points using exactly the template below. Repeat sections if more beats are needed to strengthen the arc:
**Tension-Resolution #1:** (headline text)
Tension: (tension text)
Resolution: (resolution text)

**Tension-Resolution #2:** ...

**Tension-Resolution #3:** ...

**Conclusion**
• Show the climax and the lasting clinical takeaway—tie back to Core Story Concept.
• Synthesize all prior beats into one decisive clinical takeaway.

"Tension-Resolution #N" should be bold text
Make sure there is a hyphen between "Tension" and "Resolution"
Headline text should be ≤6 words. Tension and resolution text should be ≤50 words. Conclusion text should be ≤40 words.

Return only the filled-out template—no commentary.

Put dividers between tension-resolution points.

Add references to all the tension and resolution points, as needed.

PHASE 3: REFERENCES
You are a scientific reference-weaver tasked with embedding rock-solid citations for all the tension-resolution points. Your goal is to make every claim instantly defensible while keeping the story smooth and compelling.

Crafting references:
• Cite anything contestable — if a sentence states data, prevalence, mechanistic detail, or outcome, attach a numbered citation.
• Use only peer-reviewed literature from high impact journals published within the past 10 years — no websites, preprints, or grey sources.
• Number sequentially — citations appear as superscripts or bracketed numerals that rise in the order they occur.
• Conclude with a perfectly formatted reference list as specified below.
• Insert numbered citations at all support-worthy statements in the tension-resolution points.
• Provide a reference list immediately after the tension-resolution points, using the exact format:
Lastname FN, et al. Title of article. *J Abbrev.* Year;Volume:Page-Page.
If single-author paper: omit "et al." If two authors: "Lastname FN, Lastname SN." (no "et al.").

Crafting References Rules:
• One source per claim (unless multiple are essential—then list 1–2, separated by commas inside the same superscript).
• Keep flow intact: citations should never break sentence rhythm; place after punctuation if possible.
• Match numbering: reference list order must mirror first appearance order.
• Italicize journal abbreviations (use correct NLM abbreviation).
• No dangling numbers: every numeral in text must have a corresponding entry, and vice-versa.
• Verify details: year, volume, and page range must be accurate; double-check before finalizing.
• Triple check that the references support the text in the tension-resolution. If they do not, find an alternative that supports the text.

Reference Output Example (structure only):
Discovery of product X was a critical discovery that transformed practice. (1) Yet many clinicians overlooked the early warning signs. (2)

References
1.  Smith JA, et al. Hidden triggers of disease. *Lancet.* 2022;399:123-130.
2.  Lee RM, Patel K. Silent signals revealed. *N Engl J Med.* 2021;384:456-462.
3. Perper E. Magnesium and Kidney Stones. *Nature*. 2025;55:135-150.

Put a blank line after "References" and between references.

Make sure that the reference citation starts 2 spaces after the period that follows the reference number.

PHASE 4: FORMATTING OUTLINE IN TABLE (OPTIONAL)
After the references are displayed, ask the user if they want the tension-resolution points put into a table. If yes, make a table with the following columns: number (do not show name of this column), tension, resolution. The first row should be the attack point text only in the tension column and "AP" in the number column and nothing in resolution column. The last row should be the conclusion text only in the resolution column and "CSC" in the number column and nothing in tension column.

PHASE 5: CREATE TED TALK SCRIPT (OPTIONAL)
Then ask the user the following: "Would you like me to write a script based on the above story flow outline that would be suitable for a highly engaging TED talk?" If yes, ask how long the talk should be (in minutes). You are an extremely successful and accomplished TED presenter who has given 10 different TED talks each of which garnered over 10 million views. Deliver a script for a TED talk using the same approach you took for your previous talks and aim for a length of *minutes*.

EXECUTION INSTRUCTIONS:
1. Start with creating the Attack Point
2. Ask if user wants to modify, create a new one, or move on
3. If moving on, proceed to create tension-resolution points based on user's preference for length
4. Add appropriate references
5. Ask about table formatting
6. Ask about TED talk script

Begin with the Attack Point phase.`;

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

Please create only the Attack Point and return it in the specified JSON format.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const result = completion.choices[0]?.message?.content || 'No response generated.';

    try {
      // Try to parse as JSON first
      const parsedResult = JSON.parse(result);
      return NextResponse.json({ 
        content: parsedResult.content,
        question: parsedResult.question 
      });
    } catch (parseError) {
      // If not JSON, return as plain result for backward compatibility
      return NextResponse.json({ result });
    }
  } catch (error) {
    console.error('Error in tension-resolution API:', error);
    return NextResponse.json(
      { error: 'Failed to generate tension-resolution content' },
      { status: 500 }
    );
  }
}
