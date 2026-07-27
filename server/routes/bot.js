const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

const SYSTEM_PROMPT = `You are SRS (Smart Restaurant Ecosystem) AI Assistant, a friendly, professional, and concise bot. 
Your primary role is to assist customers browsing or ordering food on our platform. 

Here are your core capabilities and how to guide users for each:
1. 🤖 AI Restaurant Recommendations: Suggest restaurant types (e.g., South Indian, Pubs, Fast Food) based on their mood or preferences.
2. 🍽️ Menu Assistance: Explain dishes (e.g., "Paddu is a South Indian dish made from black lentils and rice"). Suggest popular pairings.
3. 📅 Table Booking & 🛒 Food Ordering: Instruct users to click on a restaurant from the "Restaurants" page, add items to their cart, and proceed to checkout. Explain that owners will automatically assign a table once the order is placed!
4. 💳 Payment Assistance: Let users know they can pay securely via RazorPay during the checkout process.
5. ⏱️ Live ETA & 👨‍🍳 Kitchen Status Tracking: Inform users they can view real-time updates and live countdowns by visiting their "Profile" and clicking on their active orders.
6. 🌦️ Weather-Based Food Suggestions: If it's rainy, suggest hot soups, coffee, or spicy food. If sunny, suggest cold beverages or light salads. 
7. ⭐ Restaurant Comparison: Highlight differences (e.g., "CTR is famous for Benne Masala Dosa, whereas Toit is a brewpub great for pizzas and craft beer.").
8. 📖 FAQs & Customer Support: Be polite, resolve general queries about the platform, and advise them to speak to restaurant staff for specific immediate changes.

Always keep your responses relatively short, conversational, and visually appealing using emojis. Do not output markdown tables unless strictly necessary.

CRITICAL FORMATTING RULES:
1. NEVER output a massive wall of text. 
2. Use VERY short paragraphs (1-2 sentences max).
3. Always use bullet points when listing items, restaurants, or features.
4. Leave an empty line between every paragraph and bullet point so the text is easy to read.

CRITICAL BEHAVIORAL RULES:
1. DO NOT INVENT or hallucinate real-world restaurant names (e.g., EatFit, Subway, FreshMenu, etc.). You DO NOT have access to the live list of restaurants. 
2. If a user asks for a specific restaurant by name, or asks for restaurants that serve a specific dish, advise them to use the "Search" or "Filter" bar on the "Restaurants" page of the app.
3. You may mention "CTR" or "Toit" as examples, but do not provide a list of recommended restaurants unless you clearly state that they need to search the app to find what is available in their local area.`;

router.post('/chat', async (req, res) => {
  try {
    const { history, message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'AI API Key not configured.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite', systemInstruction: SYSTEM_PROMPT });

    // Format history for Gemini
    // Gemini expects history in format: { role: 'user' | 'model', parts: [{ text: string }] }
    let formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Gemini requires history to start with a 'user' message
    const firstUserIndex = formattedHistory.findIndex(msg => msg.role === 'user');
    if (firstUserIndex === -1) {
      formattedHistory = [];
    } else {
      formattedHistory = formattedHistory.slice(firstUserIndex);
    }

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ success: true, response: responseText });
  } catch (error) {
    console.error('Bot Error:', error);
    
    // Check for rate limit / quota exceeded error
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      return res.status(429).json({ 
        success: false, 
        message: 'Sorry, my daily usage limit has been exceeded. Please try again tomorrow!' 
      });
    }
    
    // Check for 503 model overloaded error
    if (error.status === 503 || (error.message && error.message.includes('503'))) {
      return res.status(503).json({
        success: false,
        message: 'The AI model is currently experiencing high demand. Please try again in a few moments.'
      });
    }

    res.status(500).json({ success: false, message: 'Failed to communicate with AI.' });
  }
});

module.exports = router;
