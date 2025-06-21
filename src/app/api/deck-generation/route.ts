import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { detailedPrompt, answers } = body;

  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    const demoResult = `# MEDSTORY® Presentation Outline

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

*Note: This is a demo outline. For full AI-powered generation, please configure your OpenAI API key.*`;

    const demoGammaFormatted = `MEDSTORY® Presentation: Advancing Cardiology Practice

# Introduction
Welcome to our presentation on advancing cardiology practice through innovative approaches and evidence-based solutions.

# Current Challenges in Cardiology
- Rising cardiovascular disease prevalence
- Treatment resistance in complex cases
- Need for personalized medicine approaches
- Healthcare cost considerations

# Clinical Evidence Overview
Recent studies demonstrate significant gaps in current treatment protocols, with up to 30% of patients not responding optimally to standard care approaches.

# Patient Case Study
Meet Sarah, a 58-year-old patient with complex cardiovascular conditions who represents the challenges we face in modern cardiology practice.

# Standard Treatment Limitations
- Limited efficacy in certain patient populations
- Side effect profiles affecting quality of life
- One-size-fits-all approach limitations
- Long-term sustainability concerns

# Our Innovative Solution
Introducing a comprehensive, personalized approach that addresses the root causes while maintaining safety and efficacy standards.

# Mechanism of Action
Our approach works through targeted intervention at the cellular level, optimizing cardiovascular function through precision medicine principles.

# Clinical Trial Results
- 45% improvement in patient outcomes
- 60% reduction in adverse events
- 80% patient satisfaction rate
- Significant cost-effectiveness benefits

# Real-World Patient Impact
Sarah's case demonstrates the transformative potential of our approach, with marked improvement in quality of life and clinical markers.

# Implementation Strategy
- Phased rollout approach
- Comprehensive training programs
- Ongoing support and monitoring
- Integration with existing workflows

# Case Study Resolution
Sarah's successful treatment outcome showcases the potential for improved patient care through innovative approaches.

# Future Directions
- Expanded clinical trials
- AI-powered personalization
- Global implementation strategies
- Continued research and development

# Key Takeaways
- Personalized medicine is the future of cardiology
- Evidence-based approaches improve outcomes
- Patient-centered care drives innovation
- Collaboration accelerates progress

# Questions & Discussion
Thank you for your attention. Let's discuss how we can implement these innovations in your practice.`;

    return NextResponse.json({
      result: demoResult,
      gammaFormatted: demoGammaFormatted,
    });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Generate the detailed outline
    const outlineCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a world-class expert in presentation design, medical storytelling, generative AI prompting, PowerPoint design, live presentation coaching, TED Talk-style speaking, narrative storytelling structure, cognitive and behavioral psychology, persuasive science/business communication, visual data storytelling and infographic design, and stoic philosophy for clarity, simplicity, and purpose.',
        },
        {
          role: 'user',
          content: detailedPrompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    // Generate Gamma-optimized format
    const gammaPrompt = `
Based on the following presentation answers, create a Gamma.app-optimized presentation outline that can be easily imported into Gamma:

Target Audience: ${answers[2]}
Presentation Length: ${answers[3]} minutes
Maximum Slides: ${answers[4]}
Desired Tone: ${answers[5]}
Visual Level: ${answers[6]}

Create a clean, structured outline using this format:
- Use # for slide titles (one per slide)
- Use simple bullet points with - for content
- Keep content concise and impactful
- Focus on key messages that work well with Gamma's AI design
- Make it easy for Gamma to understand and visualize
- Include a compelling title slide
- Structure the flow logically for the target audience

The outline should be ready to paste directly into Gamma.app's "Paste in text" feature.
Generate approximately ${answers[4] === 'none' ? '12-15' : answers[4]} slides.
    `;

    const gammaCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at creating presentation outlines optimized for Gamma.app. You understand how to structure content that Gamma\'s AI can easily transform into beautiful presentations.',
        },
        {
          role: 'user',
          content: gammaPrompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    return NextResponse.json({ 
      result: outlineCompletion.choices[0].message.content,
      gammaFormatted: gammaCompletion.choices[0].message.content
    });
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json({ error: 'Failed to generate presentation outline' }, { status: 500 });
  }
}
