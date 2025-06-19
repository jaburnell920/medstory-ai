import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { answers, detailedPrompt } = body;

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

*Note: This is a demo outline. For full AI-powered generation, please configure your OpenAI API key.*`
    });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a world-class expert in presentation design, medical storytelling, generative AI prompting, PowerPoint design, live presentation coaching, TED Talk-style speaking, narrative storytelling structure, cognitive and behavioral psychology, persuasive science/business communication, visual data storytelling and infographic design, and stoic philosophy for clarity, simplicity, and purpose.',
        },
        {
          role: 'user',
          content: detailedPrompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    return NextResponse.json({ result: chatCompletion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json({ error: 'Failed to generate presentation outline' }, { status: 500 });
  }
}