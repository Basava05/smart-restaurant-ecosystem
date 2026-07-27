const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const res = await model.generateContent('Hi');
    console.log('gemini-flash-latest worked:', res.response.text());
  } catch (e) {
    console.log('gemini-flash-latest failed:', e.message);
  }
}

testGemini();
