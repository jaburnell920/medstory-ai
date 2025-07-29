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

In the cardiac catheterization lab, Dr. Sarah Chen stared at the angiogram of her 52-year-old patient—three stents, optimal medical therapy, LDL at 45 mg/dL, yet another acute coronary syndrome just eighteen months later. The culprit lesion showed no significant stenosis, but the intravascular ultrasound revealed something more sinister: a thin-cap fibroatheroma with intense inflammatory infiltration. Despite achieving every guideline target, the plaque remained a ticking time bomb. Traditional lipid-lowering had silenced cholesterol synthesis, but the inflammatory cascade within the arterial wall continued its relentless march toward the next event.

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
        } else if (userMessage.toLowerCase().trim() === 'modify') {
          mockResult = `What modifications would you like to make to the Attack Point?`;
        } else if (userMessage.toLowerCase().includes('young patient example')) {
          mockResult = `Attack Point #1

At 34 years old, Marcus Thompson should have been planning his daughter's birthday party, not lying unconscious in the cardiac ICU after a massive STEMI. No family history, marathon runner, plant-based diet, LDL cholesterol at 65 mg/dL—he defied every risk calculator. Yet the emergency angiogram revealed the unthinkable: a completely occluded LAD from a ruptured plaque that appeared stable just months earlier. As Dr. Chen performed the life-saving PCI, one question haunted her: how do you prevent the unpredictable when inflammation turns a "safe" plaque into a silent assassin? The answer would challenge everything she thought she knew about cardiovascular prevention.

Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?`;
        } else if (userMessage.toLowerCase().includes('create') && userMessage.toLowerCase().includes('new')) {
          mockResult = `**Attack Point:**
Hypertension, a silent killer, affects millions globally and often goes unnoticed until critical complications arise.

Would you like to move on to creating tension-resolution points? If so, do you want a short narrative (3-5 tension-resolution points), a full narrative (8-12 tension-resolution points), or would you like to specify the number?`;
        } else if (userMessage.toLowerCase().includes('new') && (userMessage.toLowerCase().includes('attack') || userMessage.toLowerCase().includes('one'))) {
          mockResult = `**Attack Point:**
Hypertension, a silent killer, affects millions globally and often goes unnoticed until critical complications arise.

Would you like to move on to creating tension-resolution points? If so, do you want a short narrative (3-5 tension-resolution points), a full narrative (8-12 tension-resolution points), or would you like to specify the number?`;
        } else if (userMessage.toLowerCase().includes('short')) {
          mockResult = `**Tension-Resolution #1:** Inflammation Beyond Lipids
Tension: Despite achieving LDL targets below 70 mg/dL, patients with established CAD continue experiencing recurrent events, suggesting lipid-lowering alone is insufficient.
Resolution: Emerging evidence reveals persistent plaque inflammation as the missing link, with macrophage activation driving plaque instability independent of cholesterol levels.

---

**Tension-Resolution #2:** The Macrophage Dilemma
Tension: Pro-inflammatory M1 macrophages within atherosclerotic plaques release cytokines and matrix metalloproteinases, promoting plaque rupture and thrombosis.
Resolution: Targeted anti-inflammatory approaches that specifically inhibit macrophage activation within plaques could address this residual inflammatory risk.

---

**Tension-Resolution #3:** Precision Anti-Inflammatory Therapy
Tension: Systemic anti-inflammatory drugs carry significant immunosuppressive risks, limiting their use in cardiovascular disease prevention.
Resolution: ${interventionName} represents a novel plaque-targeted approach, selectively inhibiting pro-inflammatory macrophages while preserving systemic immune function.

---

**Conclusion**
By directly targeting plaque inflammation through macrophage inhibition, ${interventionName} offers a precision approach to reduce cardiovascular risk beyond traditional lipid-lowering therapy, addressing the inflammatory component that drives residual risk in optimally treated patients.

References
1. Ridker PM, et al. Antiinflammatory therapy with canakinumab for atherosclerotic disease. *N Engl J Med.* 2017;377:1119-1131.
2. Libby P, et al. Inflammation in atherosclerosis: from pathophysiology to practice. *J Am Coll Cardiol.* 2018;72:2071-2081.
3. Swirski FK, Nahrendorf M. Cardioimmunology: the immune system in cardiac homeostasis and disease. *Nat Rev Immunol.* 2018;18:733-744.

Would you like the tension-resolution points put into a table format?`;
        } else if (userMessage.toLowerCase().includes('table') || (userMessage.toLowerCase().includes('yes') && conversationHistory.some(msg => msg.content.includes('table format')))) {
          mockResult = `| # | Tension | Resolution |
|---|---------|------------|
| AP | In the cardiac catheterization lab, Dr. Sarah Chen stared at the angiogram of her 52-year-old patient—three stents, optimal medical therapy, LDL at 45 mg/dL, yet another acute coronary syndrome just eighteen months later. The culprit lesion showed no significant stenosis, but the intravascular ultrasound revealed something more sinister: a thin-cap fibroatheroma with intense inflammatory infiltration. Despite achieving every guideline target, the plaque remained a ticking time bomb. Traditional lipid-lowering had silenced cholesterol synthesis, but the inflammatory cascade within the arterial wall continued its relentless march toward the next event. | |
| 1 | Despite achieving LDL targets below 70 mg/dL, patients with established CAD continue experiencing recurrent events, suggesting lipid-lowering alone is insufficient. | Emerging evidence reveals persistent plaque inflammation as the missing link, with macrophage activation driving plaque instability independent of cholesterol levels. |
| 2 | Pro-inflammatory M1 macrophages within atherosclerotic plaques release cytokines and matrix metalloproteinases, promoting plaque rupture and thrombosis. | Targeted anti-inflammatory approaches that specifically inhibit macrophage activation within plaques could address this residual inflammatory risk. |
| 3 | Systemic anti-inflammatory drugs carry significant immunosuppressive risks, limiting their use in cardiovascular disease prevention. | ${interventionName} represents a novel plaque-targeted approach, selectively inhibiting pro-inflammatory macrophages while preserving systemic immune function. |
| CSC | | By directly targeting plaque inflammation through macrophage inhibition, ${interventionName} offers a precision approach to reduce cardiovascular risk beyond traditional lipid-lowering therapy, addressing the inflammatory component that drives residual risk in optimally treated patients. |

Would you like me to write a script based on the above story flow outline that would be suitable for a highly engaging TED talk?`;
        } else if (userMessage.toLowerCase().includes('ted') || userMessage.toLowerCase().includes('script') || (userMessage.toLowerCase().includes('yes') && conversationHistory.some(msg => msg.content.includes('TED talk')))) {
          mockResult = `How long should the TED talk be (in minutes)?`;
        } else if (userMessage.match(/\d+/)) {
          const minutes = userMessage.match(/\d+/)[0];
          mockResult = `# TED Talk Script: "The Hidden Enemy in Your Arteries"
*Duration: ${minutes} minutes*

## Opening Hook (0:00-0:30)
[Walk to center stage, pause]

"Raise your hand if you know someone who's had a heart attack." [Pause for audience response] "Keep it up if they had another one, despite doing everything right—taking their medications, exercising, eating well." [Pause] "I see a lot of hands still up. That's because we've been fighting only half the battle."

## The Problem (0:30-2:00)
[Move to screen showing angiogram]

"This is Dr. Sarah Chen's patient—52 years old, three stents, LDL cholesterol at 45 mg/dL. Perfect by every guideline. Yet eighteen months later, he's back in the cath lab with another heart attack. The traditional approach says this shouldn't happen. But look closer..." [Point to ultrasound image] "This thin-cap fibroatheroma tells a different story. It's not about cholesterol anymore—it's about inflammation."

## The Science (2:00-4:00)
[Move to molecular animation]

"Inside every atherosclerotic plaque lives an army of inflammatory cells called macrophages. Think of them as your body's security guards gone rogue. Instead of protecting you, they're releasing inflammatory signals that make plaques unstable, ready to rupture and cause the next heart attack. We've been lowering cholesterol—the building blocks—but ignoring the construction crew that's still working."

## The Solution (4:00-6:00)
[Return to center stage]

"What if we could target these rogue security guards directly? What if we could calm the inflammation without suppressing your entire immune system? That's exactly what ${interventionName} does. It's like having a precision strike team that goes directly to the plaque, tells those inflammatory macrophages to stand down, while leaving the rest of your immune system intact."

## The Impact (6:00-7:30)
[Walk toward audience]

"This isn't just about one drug or one approach. This represents a fundamental shift in how we think about heart disease. We're moving from a one-size-fits-all approach to precision medicine—targeting the specific mechanisms that drive each patient's risk. For the first time, we can address both the cholesterol and the inflammation that drives cardiovascular events."

## Call to Action (7:30-8:00)
[Return to center, direct eye contact]

"The next time you or someone you love faces cardiovascular disease, remember this: it's not just about the cholesterol. It's about the inflammation. And now, for the first time, we have the tools to fight both. The future of cardiovascular medicine isn't just about preventing heart attacks—it's about precision prevention, tailored to each patient's unique inflammatory profile."

[Pause, smile]

"Thank you."

---

*Key speaking notes:*
- Maintain eye contact with different sections of audience
- Use hand gestures to emphasize key points
- Pause after rhetorical questions
- Speak with conviction during the solution section
- End with optimistic, forward-looking tone`;
        } else {
          // Check if this is a follow-up to "What modifications would you like to make?"
          // If user provided any substantial input (more than just "modify"), treat it as modification instructions
          if (userMessage.length > 10 && !userMessage.toLowerCase().includes('what modifications')) {
            // Create a modified attack point based on user input
            mockResult = `Attack Point #1

Dr. Elena Rodriguez had seen thousands of angiograms, but this one stopped her cold. Her patient—a 45-year-old triathlete with pristine lipid panels and zero traditional risk factors—lay before her with a completely occluded left main coronary artery. The emergency catheterization revealed not the expected calcified plaque of an older patient, but something far more sinister: a soft, lipid-rich lesion teeming with inflammatory cells. Despite achieving every prevention target modern medicine could offer, the patient's arterial wall had become a battlefield where immune cells turned against the very vessels they were meant to protect. As she deployed the life-saving stent, one question echoed in her mind: how do you fight an enemy that lives within the walls themselves?

Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?`;
          } else {
            mockResult = `What modifications would you like to make to the Attack Point?`;
          }
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

1. ATTACK POINT PHASE:
   - If user wants to modify an Attack Point, ask "What modifications would you like to make?" and then modify accordingly.
   - If user wants a new Attack Point, create a brand new one and uptick its number.
   - If user wants to move on to tension-resolution points, ask if they want a short narrative (3-5 tension-resolution points), full narrative (8-12 tension-resolution points), or they want to specify the number.

2. TENSION-RESOLUTION PHASE:
   When creating tension-resolution points, use this exact template:

   **Tension-Resolution #1:** (headline text)
   Tension: (tension text)
   Resolution: (resolution text)

   ---

   **Tension-Resolution #2:** (headline text)
   Tension: (tension text)
   Resolution: (resolution text)

   ---

   **Conclusion**
   (Show the climax and the lasting clinical takeaway—tie back to Core Story Concept. Synthesize all prior beats into one decisive clinical takeaway.)

   FORMATTING RULES:
   - "Tension-Resolution #N" should be bold text
   - Make sure there is a hyphen between "Tension" and "Resolution"
   - Headline text should be ≤6 words
   - Tension and resolution text should be ≤50 words
   - Conclusion text should be ≤40 words
   - Put dividers (---) between tension-resolution points
   - Add references to all tension and resolution points using peer-reviewed literature from high impact journals published within the past 10 years

3. REFERENCES:
   After tension-resolution points, add:
   
   References
   1. Lastname FN, et al. Title of article. *J Abbrev.* Year;Volume:PagePage.
   
   - Use numbered citations in superscript or brackets
   - Only peer-reviewed literature from high impact journals
   - Published within past 10 years
   - Italicize journal abbreviations

4. TABLE FORMAT:
   After references, ask if they want the points put into a table format with columns: number, tension, resolution
   - First row: "AP" in number column, attack point text in tension column, empty resolution
   - Last row: "CSC" in number column, conclusion text in resolution column, empty tension

5. TED TALK:
   Finally, ask if they want a TED talk script based on the story flow outline. If yes, ask for duration in minutes.

TENSION-RESOLUTION GUIDELINES:
• Escalate through tension-resolution beats – each beat deepens stakes and delivers a data-driven payoff
• Flow like electricity: each tension must logically surge from the previous resolution
• Stay vivid & precise: verbs punch, jargon minimal, every claim is source-backed
• No clichés, no filler
• Overlap by design: each Resolution contains a data point that triggers the next Tension
• Drug timing: mention the drug no earlier than one-third of the way into story

Respond appropriately to the user's latest message, following the conversation flow exactly as specified.`;

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
    console.error('Error in story-flow-outline API:', error);
    return NextResponse.json(
      { error: 'Failed to generate story flow outline content' },
      { status: 500 }
    );
  }
}