const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  // Just testing a different model string
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const res = await model.generateContent('Hi');
    console.log('gemini-1.5-flash-latest worked:', res.response.text());
  } catch (e) {
    console.log('gemini-1.5-flash-latest failed:', e.message);
  }
}

testGemini();
