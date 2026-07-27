const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const res = await model.generateContent('Hi');
    console.log('gemini-pro worked:', res.response.text());
  } catch (e) {
    console.log('gemini-pro failed:', e.message);
  }
}

testGemini();
