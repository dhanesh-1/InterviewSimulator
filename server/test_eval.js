const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  const prompt = `Return ONLY a valid JSON object with this exact format (no markdown, no extra text):
{
  "test": 123
}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: prompt
    });
    console.log("Response:", response.text);
  } catch (err) {
    if (err.status === 404) {
      console.log('gemini-1.5-flash-latest 404. trying gemini-2.0-flash-exp...');
      try {
        const r2 = await ai.models.generateContent({ model: 'gemini-2.0-flash-exp', contents: prompt });
        console.log('2.0:', r2.text);
      } catch (e) {
        console.log('2.0 failed:', e.message);
      }
    }
  }
}

test();
