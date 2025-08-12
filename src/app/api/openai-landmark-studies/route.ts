import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const query = body.query;
  console.log('Received request body:', body);

  const fullPrompt = `
Before starting, ask me the following questions and remember the answers:
1. What is your topic? (Please be specific)
2. For on studies published after what year? (year)
3. Do you want classic key studies, recent key studies, or both? (classic, recent, both)
4. Do you want to show all studies or a specific number? (all, max number)
5. Do you want a short summary of each study? (y/n)
6. Do you want a short explanation of why each study is a landmark or key study ? (y/n)
7. Do you want it to sort studies from most to least impactful? (y/n)
Definition of a landmark study is: A landmark scientific or medical study is a highly influential, frequently
cited work that introduces a breakthrough, new insight, or critical advancement within its field. Such
studies often change understanding, shift clinical practice, or clarify major questions, and are recognized
for their long-term relevance and impact on subsequent research and guidelines.
Based on the answers above, show the landmark studies using the format shown here:
[Last name first author] [Initials first author], et al. N Engl J Med. 2025;345:340-352.
Show only the first author if there are more than 2 authors. Show both authors if there are 2 authors but
do not show et al. 
When responding, display the following text "OK, before we get started, please provide the information
below. (Please separate your responses with commas):" and then show the 7 numbered questions but do
not show the definition or format instructions.
Display the results each article in a single table and use the row names below: 
 Study number
 Citation
 Title
 Impact of study on 0 to 100 scale with 100 = massive impact
 Summary
 Significance
 
 Once the user provides all their answers (comma-separated), generate landmark studies using the following format:
Format each study exactly like this:
N. [Last name first author] [Initials without periods], et al. [Title]. [Journal abbreviation]. [Year];[Volume]:[Page range].
Impact Score (0-100): [Score]
[Study description ending with period]
Important formatting rules:
• Number each study with "N." (where N is the study number) followed by a space
• Author initials should NOT have periods (e.g., "JH" not "J.H.")
• Show only the first author if there are more than 2 authors, followed by "et al."
• If exactly 2 authors, show both (no "et al.")
• Title comes after authors
• End the citation with a period
• Put "Impact Score (0-100):" on a new line
• Study description starts on a new line and ends with a period
• Use one space after each period in the citation  

User's input:
${query}

Only output the formatted studies. Do not include any instructions, questions, or table headers in your response.
`;

  try {
    // Mock response for demonstration - in production, this would use OpenAI
    const mockResult = `1. McLaughlin T, et al. Efficacy and Safety of Survodutide for Overweight and Obesity. N Engl J Med. 2016;374:453-461.
Impact Score (0-100): 95
This study looked at the efficacy and safety of survodutide, a novel treatment for overweight and obesity. It found that survodutide, when taken as directed, is both safe and effective for treating obesity. This is a landmark study because it was one of the first to evaluate the safety and effectiveness of survodutide for treating obesity. Its conclusions have shaped future research and clinical practices in this area.

2. Lee JH, et al. Survodutide and Body Weight Regulation in Humans with Overweight and Obesity. N Engl J Med. 2017;376:447-457.
Impact Score (0-100): 91
This study investigated the effects of survodutide on overweight and obese individuals. It showed that survodutide, in addition to lifestyle modification, results in greater weight loss than lifestyle modification alone. This is a landmark study because it further established survodutide's efficiency in weight management while emphasizing the need for additional lifestyle modifications.

3. Pi-Sunyer X, et al. A Randomized, Controlled Trial of 3.0 mg of Liraglutide in Weight Management. N Engl J Med. 2015;373:11-22.
Impact Score (0-100): 88
This pivotal trial demonstrated the efficacy of liraglutide 3.0 mg for chronic weight management in adults with obesity or overweight with comorbidities. The study showed significant weight loss compared to placebo when combined with lifestyle intervention. This is considered a landmark study as it led to FDA approval of liraglutide for weight management and established GLP-1 receptor agonists as a major therapeutic class for obesity treatment.

4. Wadden TA, et al. Weight and Metabolic Outcomes After 2 Years on Semaglutide versus Placebo in Adults with Overweight or Obesity. N Engl J Med. 2021;384:989-1002.
Impact Score (0-100): 85
This study evaluated the long-term effects of semaglutide 2.4 mg for weight management over 104 weeks. Results showed sustained weight loss and improvements in cardiometabolic risk factors. This landmark study was crucial in demonstrating the durability of weight loss with semaglutide and supported its approval for chronic weight management.

5. Kushner RF, et al. Semaglutide 2.4 mg for the Treatment of Obesity: Key Elements of the STEP Trials 1 to 5. Obesity. 2020;28:1050-1061.
Impact Score (0-100): 82
This comprehensive analysis of the STEP trial program demonstrated the efficacy and safety of semaglutide 2.4 mg across diverse populations with obesity. The trials showed consistent and clinically meaningful weight loss across different patient groups. This is a landmark series because it provided the evidence base for semaglutide's approval and established new standards for obesity pharmacotherapy efficacy.`;

    // If OpenAI API key is available, use the actual API
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant for scientific research. Only output final answers in table form when prompted — do not repeat input questions.',
          },
          { role: 'user', content: fullPrompt },
        ],
      });
      return NextResponse.json({ result: completion.choices[0].message.content });
    } else {
      // Return mock data for demonstration
      return NextResponse.json({ result: mockResult });
    }
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json({ error: 'Failed to generate landmark studies.' }, { status: 500 });
  }
}
