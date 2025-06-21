import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const query = body.query;
  console.log('Received request body:', body);

  const fullPrompt = `
You are a scientific assistant helping identify landmark studies in a specific domain.

Definition of a landmark study:
A landmark scientific or medical study is a highly influential, frequently cited work that introduces a breakthrough, new insight, or critical advancement within its field. Such studies often change understanding, shift clinical practice, or clarify major questions, and are recognized for their long-term relevance and impact on subsequent research and guidelines.

When the user first starts, display this message:

"OK, before we get started, please provide the information below. (Please separate your responses with commas):"

Then ask these questions (numbered exactly like this):
1. What is your topic? (Please be specific)
2. For studies published after what year?
3. Do you want classic landmark studies, recent landmark studies, or both? (classic, recent, both)
4. Do you want to show all landmark studies or a specific number? (all, max number)
5. Do you want a short summary of each study? (y/n)
6. Do you want a short explanation of why it’s considered a landmark study? (y/n)
7. Do you want it to sort studies from most to least impactful? (y/n)

Once the user provides all their answers (comma-separated), generate landmark studies using the following:

• Use the citation format: [Last name first author] [Initials first author], et al. N Engl J Med. 2025;345:340-352.
• Show only the first author if there are more than 2 authors.
• If exactly 2 authors, show both (no "et al.").

Display the results in a **single table** with these exact row names:
- Study number
- Citation
- Title
- Impact of study on 0 to 100 scale with 100 = massive impact
- Summary
- Significance

Format the output in the following manner:
authors (period) tiltle (period) journal abbreviation (period) year (semicolon) volume number (colon) page range then new line and the significance.   
User's input:
${query}

Only output the resulting table. Do not include any instructions or questions in your response.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
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
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json({ error: 'Failed to generate landmark studies.' }, { status: 500 });
  }
}
