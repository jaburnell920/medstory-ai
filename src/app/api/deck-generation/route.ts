import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { detailedPrompt } = body;

  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      result: `# MEDSTORY® Presentation Outline

## Presentation Overview
**Audience:** xxx  
**Core Story Concept:** xxx  
**Total Number of Slides:** XX  
**Target Length:** XX minutes  

## Slide Structure

### **SLIDE 1:** Title Slide
TEXT
**Content:** [Your Presentation Title]

VISUALS
[Visual description]

SPEAKER NOTES
Welcome the audience and introduce yourself. Set the stage for the presentation.

REFERENCES
1. Smith E, et al. N Eng J Med. 2024;345:50-61

### **SLIDE 2:** Agenda
TEXT
**Content:** Overview of key topics to be covered

VISUALS
[Visual description]

SPEAKER NOTES
Briefly outline what the audience can expect to learn.

REFERENCES
1. Johnson A, et al. JAMA. 2023;330:1245-1252

### **SLIDE 3:** Problem Statement
TEXT
**Content:** Current challenges in cardiology practice

VISUALS
[Visual description]

SPEAKER NOTES
Establish the tension - what problems are cardiologists facing today?

REFERENCES
1. Williams B, et al. Circulation. 2023;147:1123-1135

### **SLIDE 4:** Clinical Evidence
TEXT
**Content:** Key research findings and data

VISUALS
[Visual description]

SPEAKER NOTES
Present compelling evidence that supports your narrative.

REFERENCES
1. Chen H, et al. Lancet. 2024;403:789-801

### **SLIDE 5:** Case Study Introduction
TEXT
**Content:** Real-world patient scenario

VISUALS
[Visual description]

SPEAKER NOTES
Introduce a relatable case that resonates with your audience.

REFERENCES
1. Garcia R, et al. J Am Coll Cardiol. 2023;81:1567-1579

### **SLIDE 6:** Current Treatment Approach
TEXT
**Content:** Standard of care limitations

VISUALS
[Visual description]

SPEAKER NOTES
Discuss current treatment limitations and unmet needs.

REFERENCES
1. Taylor D, et al. Eur Heart J. 2024;45:234-246

### **SLIDE 7:** The Solution
TEXT
**Content:** Your proposed approach or intervention

VISUALS
[Visual description]

SPEAKER NOTES
Present the resolution to the tension established earlier.

REFERENCES
1. Kim J, et al. Nature Medicine. 2023;29:1890-1902

### **SLIDE 8:** Mechanism of Action
TEXT
**Content:** How the solution works

VISUALS
[Visual description]

SPEAKER NOTES
Explain the scientific rationale in terms cardiologists will appreciate.

REFERENCES
1. Patel V, et al. Science. 2024;383:456-468

### **SLIDE 9:** Clinical Trial Results
TEXT
**Content:** Efficacy and safety data

VISUALS
[Visual description]

SPEAKER NOTES
Present key trial results with appropriate statistical context.

REFERENCES
1. Brown M, et al. N Engl J Med. 2023;389:1234-1246

### **SLIDE 10:** Patient Outcomes
TEXT
**Content:** Real-world impact on patient care

VISUALS
[Visual description]

SPEAKER NOTES
Connect the data to meaningful patient outcomes.

REFERENCES
1. Wilson L, et al. JAMA Cardiol. 2024;9:345-357

### **SLIDE 11:** Implementation Considerations
TEXT
**Content:** Practical aspects of adoption

VISUALS
[Visual description]

SPEAKER NOTES
Address potential barriers and implementation strategies.

REFERENCES
1. Thompson S, et al. Health Affairs. 2023;42:1567-1578

### **SLIDE 12:** Case Study Resolution
TEXT
**Content:** How the solution helped the patient from Slide 5

VISUALS
[Visual description]

SPEAKER NOTES
Complete the narrative arc with a successful outcome.

REFERENCES
1. Martinez A, et al. BMJ. 2024;380:123-135

### **SLIDE 13:** Future Directions
TEXT
**Content:** What's next in this area

VISUALS
[Visual description]

SPEAKER NOTES
Discuss ongoing research and future possibilities.

REFERENCES
1. Lee K, et al. Trends Cardiovasc Med. 2024;34:78-89

### **SLIDE 14:** Key Takeaways
TEXT
**Content:** 3-4 main points for the audience to remember

VISUALS
[Visual description]

SPEAKER NOTES
Reinforce the most important messages.

REFERENCES
1. Roberts P, et al. Circulation. 2023;148:2345-2356

### **SLIDE 15:** Questions & Discussion
TEXT
**Content:** Contact information and discussion prompt

VISUALS
[Visual description]

SPEAKER NOTES
Invite questions and facilitate discussion.

REFERENCES
1. Anderson T, et al. J Med Ethics. 2023;49:567-578

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
  });

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a world-class expert in presentation design, medical storytelling, generative AI prompting, PowerPoint design, live presentation coaching, TED Talk-style speaking, narrative storytelling structure, cognitive and behavioral psychology, persuasive science/business communication, visual data storytelling and infographic design, and stoic philosophy for clarity, simplicity, and purpose. Format each slide with "### **SLIDE X:**" (with SLIDE in all caps and bold). Include sections for TEXT, VISUALS, SPEAKER NOTES, and REFERENCES with a blank line between each section. Ensure at least 1 reference per slide.',
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
