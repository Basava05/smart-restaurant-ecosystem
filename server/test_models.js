const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return console.log('No key');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    data.models.forEach(m => console.log(m.name));
  } catch (e) {
    console.log('failed:', e.message);
  }
}

testGemini();
