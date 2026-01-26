import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { score, won } = req.body;

  try {
    // FIX: Switched to 'gemini-pro' which is widely available and stable
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      You are Coach Zog, an aggressive funny alien sports coach.
      A player just finished a game.
      Score: ${score}.
      Outcome: ${won ? "They won!" : "They lost."}
      
      Give them a funny, ruthless 1-2 sentence roast. Use sci-fi slang.
      Do not use emojis in your response, just text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ roast: text });

  } catch (error) {
    console.error("AI Roast Error Details:", error);
    // Fallback if AI fails so the game doesn't crash
    return res.status(200).json({ roast: "Coach Zog is eating lunch. (AI connection failed)" });
  }
}