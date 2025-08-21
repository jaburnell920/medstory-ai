import OpenAI from 'openai';

async function testOpenAI() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('Testing OpenAI API...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a scientific research assistant. Respond with "API is working!" if you receive this message.',
        },
        {
          role: 'user',
          content: 'Test message',
        },
      ],
      max_tokens: 50,
    });

    console.log('OpenAI Response:', completion.choices[0].message.content);
    console.log('✅ OpenAI API is working correctly!');
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.status) {
      console.error('HTTP Status:', error.status);
    }
  }
}

testOpenAI();
