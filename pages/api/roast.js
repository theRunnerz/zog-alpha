import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { score, won } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // The Persona
    const prompt = `
      You are an alien sports coach named Coach Zog. 
      The player just finished a round of "Alien Flick".
      Score: ${score}.
      Result: ${won ? "They beat the challenge target." : "They failed the challenge or just played for fun."}
      
      Output ONE sentence (max 15 words).
      If score < 200: ROAST them ruthlessly. Call them a "earthling noob".
      If score > 500: Praise them, but sound surprised a human could do it.
      Tone: Funny, aggressive, sci-fi slang.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.status(200).json({ roast: text });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ roast: "Coach Zog is on a coffee break. (AI Error)" });
  }
}