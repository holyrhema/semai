import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
console.log("Checking Gemini Key:", key ? `${key.substring(0, 8)}...` : "MISSING!");

const genAI = new GoogleGenerativeAI(key);

async function list() {
  try {
    // Test with gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent("Hello, are you ready?");
    console.log("SUCCESS with gemini-1.5-flash:", res.response.text());
  } catch (e) {
    console.log("Error with gemini-1.5-flash:", e.message);
    try {
      // Fallback to gemini-pro / gemini-1.5-pro
      const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
      const res2 = await model2.generateContent("Hello?");
      console.log("SUCCESS with gemini-pro:", res2.response.text());
    } catch (e2) {
      console.log("Error with gemini-pro:", e2.message);
    }
  }
}
list();
