require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log("Testing connection with API Key:", process.env.GEMINI_API_KEY ? "Key Found" : "Key MISSING");
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const result = await model.generateContent("Return exactly this JSON: { \"status\": \"success\" }");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("Connection Failed:", error.message);
    }
}

testGemini();