import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Function to clean AI response by removing commentary while preserving structure
function cleanAIResponse(response: string): string {
  if (!response) return response;
  
  let cleaned = response;
  
  // Remove "Assistant:" prefix
  cleaned = cleaned.replace(/^Assistant:\s*/i, '');
  
  // Extract content within quotes if present
  const quotedMatch = cleaned.match(/"([^"]*(?:\n[^"]*)*?)"/);
  if (quotedMatch) {
    const quotedContent = quotedMatch[1];
    // Find the follow-up question
    const followUpMatch = cleaned.match(/Would you like to[^?]*\?/);
    const followUp = followUpMatch ? followUpMatch[0] : '';
    
    return quotedContent + (followUp ? '\n\n' + followUp : '');
  }
  
  // Remove conversational lead-ins but preserve Attack Point structure
  const lines = cleaned.split('\n');
  let contentStartIndex = 0;
  
  // First pass: Look specifically for "Attack Point" lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^Attack Point/i)) {
      contentStartIndex = i;
      break;
    }
  }
  
  // If no "Attack Point" found, look for other content indicators
  if (contentStartIndex === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // If we find substantial content (long line), start from there
      if (line.length > 50) {
        contentStartIndex = i;
        break;
      }
      
      // If we find other content indicators, start from there
      if (line.includes('Tension') || line.includes('Resolution')) {
        contentStartIndex = i;
        break;
      }
    }
  }
  
  if (contentStartIndex > 0) {
    cleaned = lines.slice(contentStartIndex).join('\n');
  }
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n').trim();
  
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const { coreStoryConcept, audience, action, userMessage, conversationHistory } =
      await request.json();

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

CRITICAL FORMATTING RULES:
- NEVER include "Assistant:" at the beginning of your responses
- NEVER include follow-up questions within the Attack Point content itself
- The Attack Point content should end immediately after the narrative content
- Follow-up questions should be asked separately, not embedded in the Attack Point
- NEVER include conversational commentary like "Understood.", "Let's", "How about this:", etc.
- When modifying an Attack Point, provide ONLY the modified Attack Point content without any explanatory text
- Do NOT wrap the Attack Point content in quotes unless specifically requested

Return only the filledout template—no commentary.

After delivering any attack point ask: "Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?" 

CRITICAL: ALWAYS ask this question after every attack point generation, whether it's new or modified.

If answered 'modify', ask the user "What modifications would you like to make?" and use the answer to modify the existing Attack Point. In this case, keep the number of the Attack Point the same. Only uptick the Attack Point number if a new Attack Point is requested. 

IMPORTANT: When providing a modified Attack Point, return ONLY the Attack Point content with its header (e.g., "Attack Point #1") followed by the content. Do NOT include any conversational text like "Understood", "Here's the modified version", "How about this", etc.

If answered 'new', create a brand new Attack Point using the same and uptick its number. If answered "move on", move on to delivering tension-resolution points.

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
After the references are displayed, ask the user if they want the tension-resolution points put into a table. If the user responds "yes" or explicitly requests a table, create a markdown table with the following columns: number (do not show name of this column), tension, resolution. The first row should be the attack point text only in the tension column and "AP" in the number column and nothing in resolution column. The last row should be the conclusion text only in the resolution column and "CSC" in the number column and nothing in tension column.

IMPORTANT: When the user says "yes" to the table question, immediately provide the table format and then ask about the TED talk. Do NOT repeat the table question.

Then ask the user the following: "Would you like me to write a script based on the above story flow outline that would be suitable for a highly engaging TED talk?" If yes, ask how long the talk should be (in minutes). You are an extremely successful and accomplished TED presenter who has given 10 different TED talks each of which garnered over 10 million views. Deliver a script for a TED talk using the same approach you took for your previous talks and aim for a length of minutes.

PARAMETERS PROVIDED:
- Core Story Concept: ${coreStoryConcept}
- Audience: ${audience}

Begin with creating the Attack Point.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
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

      const rawResult = completion.choices[0]?.message?.content || 'No response generated.';
      const result = cleanAIResponse(rawResult);
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
        } else if (userMessage.toLowerCase().includes('modify')) {
          // Check if this is the initial "modify" request or the actual modification details
          if (userMessage.toLowerCase().trim() === 'modify') {
            mockResult = `What modifications would you like to make to the Attack Point?`;
          } else {
            // User is providing modification details - generate modified attack point (keep same number)
            mockResult = `Attack Point #1

In the pediatric ICU, time was running out for 8-year-old Emma. Her leukemia had become a relentless predator, devouring every conventional weapon in the oncologist's arsenal—chemotherapy, radiation, even a bone marrow transplant—all had failed. Her CD19+ B-cells, once vulnerable targets, had evolved into invisible phantoms, slipping past traditional treatments like shadows in the night. As her parents held vigil, watching their daughter's life force ebb away, her oncologist reluctantly prepared the palliative care conversation. But in the depths of Emma's failing immune system, a revolutionary army of engineered T-cells lay dormant, reprogrammed with chimeric antigen receptors, poised to launch the most precise and devastating counterattack that would either save her life or mark the final chapter in pediatric oncology's fight against the impossible.

Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?`;
          }
        } else if (
          userMessage.toLowerCase().includes('diuretics') ||
          userMessage.toLowerCase().includes('medication') ||
          userMessage.toLowerCase().includes('mention')
        ) {
          // User is asking to mention diuretics or other medications
          mockResult = `Attack Point #1

In the relentless race against hypertension, cardiologists frequently grapple with the resistance or intolerance to first-line medications including diuretics. The pursuit for a more effective, well-tolerated, and long-lasting treatment continues. Frequently overlooked in this battle is a humble yet potential-packed tool - Lisinopril.

Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?`;
        } else if (
          userMessage.toLowerCase().includes('dramatic') ||
          userMessage.toLowerCase().includes('urgent') ||
          userMessage.toLowerCase().includes('more') ||
          (userMessage.toLowerCase().includes('make') && userMessage.toLowerCase().includes('it'))
        ) {
          // User is providing modification details without using the word "modify"
          mockResult = `Attack Point #1

In the pediatric ICU, time was running out for 8-year-old Emma. Her leukemia had become a relentless predator, devouring every conventional weapon in the oncologist's arsenal—chemotherapy, radiation, even a bone marrow transplant—all had failed. Her CD19+ B-cells, once vulnerable targets, had evolved into invisible phantoms, slipping past traditional treatments like shadows in the night. As her parents held vigil, watching their daughter's life force ebb away, her oncologist reluctantly prepared the palliative care conversation. But in the depths of Emma's failing immune system, a revolutionary army of engineered T-cells lay dormant, reprogrammed with chimeric antigen receptors, poised to launch the most precise and devastating counterattack that would either save her life or mark the final chapter in pediatric oncology's fight against the impossible.

Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?`;
        } else if (
          userMessage.toLowerCase().includes('new') ||
          userMessage.toLowerCase().includes('create')
        ) {
          mockResult = `Attack Point #2

In the cardiac catheterization lab, Dr. Sarah Chen stared at the angiogram of her 52-year-old patient with three stents, optimal medical therapy, yet another acute coronary syndrome just six months later. The culprit lesion showed no significant stenosis, but the plaque was angry, inflamed, and primed to rupture again. Traditional lipid-lowering had failed to silence the inflammatory cascade driving his recurrent events. But targeting the macrophages within the plaque itself, the very cells orchestrating this inflammatory storm, represented an entirely new battlefield in the war against cardiovascular death.

Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?`;
        } else if (userMessage.toLowerCase().includes('short')) {
          mockResult = `**Tension-Resolution #1: The Silent Epidemic**  
**Tension:** High blood pressure often goes unnoticed until it manifests as life-threatening events like strokes or heart attacks, putting patients at critical risk without warning.  
**Resolution:** Lisinopril provides a proactive approach, effectively managing blood pressure before such catastrophic events occur by targeting the root cause in the renin-angiotensin system.

---

**Tension-Resolution #2: Unyielding Control Challenges**  
**Tension:** Despite numerous antihypertensive drugs, achieving consistent blood pressure control remains elusive for many patients, leading to persistent cardiovascular risks.  
**Resolution:** Lisinopril offers a reliable solution by directly inhibiting ACE, thereby reducing the formation of Angiotensin II and ensuring stable blood pressure management.

---

**Tension-Resolution #3: The Mechanism of Elegance**  
**Tension:** Complex mechanisms of hypertension often complicate treatment, overwhelming patients with choices and uncertainty.  
**Resolution:** Lisinopril simplifies treatment with its straightforward yet powerful mechanism, providing clear and effective intervention by directly disrupting the hypertension pathway.

---

**Conclusion:** Lisinopril transforms hypertension management into a proactive and reliable journey, not just reducing blood pressure but altering cardiovascular destinies, aligning with the Core Story Concept of redefining patient outcomes.

**References**  

1. Brown MJ, et al. Clinical benefits of ACE inhibitors in managing hypertension. Lancet. 2019;393:1038-1050.

2. Williams B, et al. The role of ACE inhibitors in hypertension treatment. J Hypertens. 2020;38:1234-1243.

3. Smith SM, et al. Efficacy of lisinopril in cardiovascular risk reduction. JAMA Cardiol. 2021;6:456-465.

Would you like the tension-resolution points put into a table?`;
        } else if (
          userMessage.toLowerCase().includes('table') ||
          userMessage.toLowerCase().includes('yes')
        ) {
          // Check if this is a response to a table question or TED talk question
          const lastAssistantMessage =
            conversationHistory
              .filter(
                (msg: { role: 'user' | 'assistant'; content: string }) => msg.role === 'assistant'
              )
              .pop()?.content || '';

          // Check if user is responding to TED talk question
          if (
            userMessage.toLowerCase().includes('yes') &&
            lastAssistantMessage.toLowerCase().includes('ted talk')
          ) {
            mockResult = `How long should the TED talk be (in minutes)?`;
          }
          // If user said "yes" and the last assistant message was about tables, show table
          // OR if user explicitly requested table
          else if (
            (userMessage.toLowerCase().includes('yes') &&
              lastAssistantMessage.toLowerCase().includes('table') &&
              !lastAssistantMessage.toLowerCase().includes('ted')) ||
            userMessage.toLowerCase().includes('table')
          ) {
            mockResult = `| # | Tension | Resolution |
|---|---------|------------|
| AP | A dangerous fusion of high blood pressure with a string of catastrophes in its wake: stroke, heart attack, kidney dysfunction. The modern cardiology still scuffles with suboptimal systolic and diastolic pressure control, leaving many patients dancing on the precipice of severe cardiovascular events, despite a landscape brimming with antihypertensive agents. The struggle isn't around the lack of medicines, but the right weapon that directly challenges the renin-angiotensin system's tyranny on blood pressure control. | |
| 1 | High blood pressure often goes unnoticed until it manifests as life-threatening events like strokes or heart attacks, putting patients at critical risk without warning. | Lisinopril provides a proactive approach, effectively managing blood pressure before such catastrophic events occur by targeting the root cause in the renin-angiotensin system. |
| 2 | Despite numerous antihypertensive drugs, achieving consistent blood pressure control remains elusive for many patients, leading to persistent cardiovascular risks. | Lisinopril offers a reliable solution by directly inhibiting ACE, thereby reducing the formation of Angiotensin II and ensuring stable blood pressure management. |
| 3 | Complex mechanisms of hypertension often complicate treatment, overwhelming patients with choices and uncertainty. | Lisinopril simplifies treatment with its straightforward yet powerful mechanism, providing clear and effective intervention by directly disrupting the hypertension pathway. |
| CSC | | Lisinopril transforms hypertension management into a proactive and reliable journey, not just reducing blood pressure but altering cardiovascular destinies, aligning with the Core Story Concept of redefining patient outcomes. |

Would you like me to write a script based on the above story flow outline that would be suitable for a highly engaging TED talk?`;
          } else {
            // User said "yes" but not to a table question, handle other cases
            mockResult = `What modifications would you like to make to the Attack Point?`;
          }
        } else if (
          // Check if user is providing TED talk duration in mock mode
          userMessage.match(/\d+/) &&
          (userMessage.toLowerCase().includes('minute') ||
            userMessage.toLowerCase().includes('min'))
        ) {
          const duration = userMessage.match(/\d+/)?.[0] || '15';
          mockResult = `# TED Talk Script: "The Silent Revolution in Medicine"
## Duration: ${duration} minutes

[Walk to center stage, pause, make eye contact with audience]

**Opening Hook (0:00-1:30)**

In the pediatric ICU, 8-year-old Emma's leukemia cells had survived every conventional treatment. [Pause] Chemotherapy, radiation, even a bone marrow transplant. Her CD19+ B-cells had become invisible to traditional treatments. As her parents watched her condition deteriorate, her oncologist prepared to discuss palliative care.

[Move closer to audience]

But hidden within Emma's own immune system lay engineered T-cells, reprogrammed with chimeric antigen receptors, waiting to launch a precision strike that would redefine the boundaries between life and death in pediatric oncology.

**The Problem (1:30-3:00)**

[Gesture to audience]

How many of you have felt that moment? When conventional medicine reaches its limits? When the textbooks fall silent and hope seems to slip away?

This is the story of how we're not just treating disease anymore—we're rewriting the very code of life itself.

**Journey Through Discovery (3:00-${Math.floor(parseInt(duration) * 0.8)}:00)**

[Share personal anecdotes and build tension through each resolution point]

The first breakthrough came when we realized that the problem wasn't our weapons—it was our targeting system...

[Continue with tension-resolution narrative structure]

**The Revelation (${Math.floor(parseInt(duration) * 0.8)}:00-${Math.floor(parseInt(duration) * 0.95)}:00)**

[Build to climactic moment]

What we discovered wasn't just a new treatment. We discovered that we could turn the patient's own immune system into the most sophisticated, personalized medicine ever created.

**Call to Action (${Math.floor(parseInt(duration) * 0.95)}:00-${duration}:00)**

[Return to center stage, direct eye contact]

Emma is now cancer-free. But her story is just the beginning. The question isn't whether we can revolutionize medicine—it's whether we have the courage to embrace that revolution.

[Final pause]

The future of medicine isn't in our hospitals. It's in our cells. And that future starts now.

[End with confident stance, hold for applause]

---

**Speaker Notes:**
- Total word count: approximately ${parseInt(duration) * 160} words
- Key timing markers included
- Emphasize emotional connection points
- Use strategic pauses for impact
- Maintain eye contact during key moments`;
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

      console.log('User message:', userMessage);
      console.log('Conversation context:', conversationContext);

      // Check if user is responding "yes" to a table question or TED talk question
      const lastAssistantMessage =
        conversationHistory
          .filter(
            (msg: { role: 'user' | 'assistant'; content: string }) => msg.role === 'assistant'
          )
          .pop()?.content || '';

      const isTableRequest =
        userMessage.toLowerCase().includes('yes') &&
        lastAssistantMessage.toLowerCase().includes('table') &&
        !lastAssistantMessage.toLowerCase().includes('ted');

      const isTedTalkRequest =
        userMessage.toLowerCase().includes('yes') &&
        lastAssistantMessage.toLowerCase().includes('ted talk');

      let continuePrompt = '';

      if (isTedTalkRequest) {
        // Special handling for TED talk script generation
        continuePrompt = `You are helping create a TED talk script based on a Story Flow Outline. The user has confirmed they want a TED talk script.

PARAMETERS:
- Core Story Concept: ${coreStoryConcept}
- Audience: ${audience}

CONVERSATION CONTEXT:
${conversationContext}

CRITICAL INSTRUCTIONS:
The user has said "yes" to creating a TED talk script. You must now ask how long the talk should be (in minutes) and then generate a complete TED talk script.

First ask: "How long should the TED talk be (in minutes)?"

If the user provides a duration, then generate a complete TED talk script using this guidance:
You are an extremely successful and accomplished TED presenter who has given 10 different TED talks each of which garnered over 10 million views. Deliver a script for a TED talk using the same approach you took for your previous talks.

The script should:
- Use the attack point as the opening hook
- Incorporate the tension-resolution points as the main narrative structure
- Build to the core story concept as the climactic insight
- Include speaker directions in [brackets]
- Be engaging, personal, and transformative
- Follow TED talk best practices with storytelling, data, and emotional connection
- Aim for the specified length in minutes

Extract all the story elements (attack point, tension-resolution points, conclusion) from the previous conversation and weave them into a compelling TED talk narrative.`;
      } else if (isTableRequest) {
        // Special handling for table creation
        continuePrompt = `You are helping create a Story Flow Outline. The user has requested that the tension-resolution points be put into a table format.

PARAMETERS:
- Core Story Concept: ${coreStoryConcept}
- Audience: ${audience}

CONVERSATION CONTEXT:
${conversationContext}

CRITICAL INSTRUCTIONS:
The user has said "yes" to creating a table. You must now create a markdown table with the tension-resolution points from the previous response.

Create a markdown table with the following format:
- Columns: number (do not show column header), tension, resolution
- First row: "AP" in number column, attack point text in tension column, empty resolution column
- Middle rows: "1", "2", "3" etc. in number column, tension text in tension column, resolution text in resolution column
- Last row: "CSC" in number column, empty tension column, conclusion text in resolution column

Extract the attack point, tension-resolution points, and conclusion from the previous conversation and format them into this table structure.

After creating the table, ask: "Would you like me to write a script based on the above story flow outline that would be suitable for a highly engaging TED talk?"

DO NOT ask about the table again. The user has already confirmed they want the table.`;
      } else if (
        // Check if user is providing TED talk duration
        (userMessage.match(/\d+/) &&
          (userMessage.toLowerCase().includes('minute') ||
            userMessage.toLowerCase().includes('min') ||
            lastAssistantMessage.toLowerCase().includes('how long should the ted talk be'))) ||
        // Or if previous message asked for duration and user provided a number
        (lastAssistantMessage.toLowerCase().includes('how long should the ted talk be') &&
          userMessage.match(/\d+/))
      ) {
        // Generate TED talk script with specified duration
        const duration = userMessage.match(/\d+/)?.[0] || '15';

        continuePrompt = `You are an extremely successful and accomplished TED presenter who has given 10 different TED talks each of which garnered over 10 million views. 

The user wants a ${duration}-minute TED talk script based on the story flow outline from the conversation.

PARAMETERS:
- Core Story Concept: ${coreStoryConcept}
- Audience: ${audience}
- Duration: ${duration} minutes

CONVERSATION CONTEXT:
${conversationContext}

CRITICAL INSTRUCTIONS:
Generate a complete TED talk script for ${duration} minutes using the story flow outline from the conversation.

The script should:
- Use the attack point as the opening hook
- Incorporate the tension-resolution points as the main narrative structure  
- Build to the core story concept as the climactic insight
- Include speaker directions in [brackets]
- Be engaging, personal, and transformative
- Follow TED talk best practices with storytelling, data, and emotional connection
- Aim for approximately ${duration} minutes (roughly 150-180 words per minute)

Extract all the story elements (attack point, tension-resolution points, conclusion) from the previous conversation and weave them into a compelling TED talk narrative.

Structure the script with:
1. Opening hook (attack point)
2. Problem setup and tension building
3. Journey through tension-resolution points
4. Climactic revelation (core story concept)
5. Call to action/transformation

Include timing cues and speaker directions throughout.`;
      } else {
        // Regular conversation flow
        continuePrompt = `You are continuing to help create a Story Flow Outline with Attack Point and Tension-Resolution Points using the comprehensive AI Prompt for Creating Story Flow Outline.

PARAMETERS:
- Core Story Concept: ${coreStoryConcept}
- Audience: ${audience}

CONVERSATION SO FAR:
${conversationContext}

LATEST USER MESSAGE: ${userMessage}

FOLLOW THE COMPLETE PROMPT GUIDELINES:

Training: Attack Point
After delivering any attack point ask: "Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?" 

CRITICAL: ALWAYS ask this question after every attack point generation, whether it's new or modified.

IMPORTANT RESPONSE HANDLING:
- If user says 'modify' or asks for modifications: ask "What modifications would you like to make?" and use the answer to modify the existing Attack Point keeping the same number. After modification, ALWAYS ask the follow-up question again.
- If user says 'new', 'create', 'create a new one', 'new attack point', or similar: create a brand new Attack Point with the next sequential number (e.g., Attack Point #2, #3, etc.). After creation, ALWAYS ask the follow-up question.
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

After the references are displayed, ask the user if they want the tension-resolution points put into a table. If the user responds "yes" or explicitly requests a table, create a markdown table with the following columns: number (do not show name of this column), tension, resolution. The first row should be the attack point text only in the tension column and "AP" in the number column and nothing in resolution column. The last row should be the conclusion text only in the resolution column and "CSC" in the number column and nothing in tension column.

CRITICAL: When the user says "yes" to the table question, immediately provide the table format and then ask about the TED talk. Do NOT repeat the table question.

Then ask the user the following: "Would you like me to write a script based on the above story flow outline that would be suitable for a highly engaging TED talk?" If yes, ask how long the talk should be (in minutes). You are an extremely successful and accomplished TED presenter who has given 10 different TED talks each of which garnered over 10 million views. Deliver a script for a TED talk using the same approach you took for your previous talks and aim for a length of minutes.

Respond appropriately to the user's latest message, following the conversation flow and complete prompt guidelines.`;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
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

      const rawResult = completion.choices[0]?.message?.content || 'No response generated.';
      const result = cleanAIResponse(rawResult);
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
