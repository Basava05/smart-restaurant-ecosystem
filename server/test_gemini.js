const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('No API key found in .env');
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: 'You are a test bot.' });

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: 'Hi' }] },
      ],
    });

    const result = await chat.sendMessage('what is this srs');
    console.log('Response:', result.response.text());
  } catch (error) {
    console.error('Error:', error.message || error);
  }
}

testGemini();
