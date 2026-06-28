const OpenAI = require('openai');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function test() {
  const prompt = `Return ONLY a valid JSON object with this exact format (no markdown, no extra text):
{
  "test": 123
}`;
  try {
    const response = await client.responses.create({
      model: 'gpt-5.4-mini',
      input: prompt
    });
    console.log("Response:", response.output_text);
  } catch (err) {
    console.error('OpenAI smoke test failed:', err.message);
  }
}

test();
