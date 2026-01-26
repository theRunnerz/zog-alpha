// pages/api/roast.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { score, won } = req.body;

  // Create a fun prompt for Coach Zog
  const prompt = `
You are Coach Zog, an alien football coach. You speak in 1-2 sentence humorous, slightly sarcastic roasts for players after a game. 
Do NOT use placeholder text. Be funny, creative, and encouraging.

Player scored ${score} points.
${won ? "They won the game!" : "They lost the game."}

Write ONLY the roast text. Do not say anything else.
`;


  try {
    const model = ai.model("models/chat-bison-001");

    const response = await model.chat({
      messages: [
        { role: "system", content: "You are Coach Zog, an alien football coach." },
        { role: "user", content: prompt }
      ]
    });

    // Extract text
    const roastText = response?.candidates?.[0]?.content || "Coach Zog lost his whistle 🫠";

    return res.status(200).json({ roast: roastText });
  } catch (err) {
    console.error("AI Roast Error:", err);
    return res.status(200).json({ roast: "Coach Zog is on a coffee break ☕" });
  }
}
