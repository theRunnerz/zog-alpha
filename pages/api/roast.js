import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { score, won } = req.body;

  try {
    const prompt = `
You are Coach Zog, an alien football coach. Give a funny, 1-2 sentence roast after a game.
Player scored ${score} points.
${won ? "They won the game!" : "They lost the game."}
Write ONLY the roast text. Do not include placeholder text.
`;

    // ✅ Correct way to call chat-bison
    const response = await ai.chat({
      model: "chat-bison-001",
      messages: [
        { role: "system", content: "You are Coach Zog, an alien football coach who roasts players humorously in 1-2 sentences." },
        { role: "user", content: prompt }
      ],
    });

    // Gemini chat responses are in candidates[0].content
    const roast = response.candidates?.[0]?.content || "Coach Zog lost his whistle 🫠";

    res.status(200).json({ roast });

  } catch (err) {
    console.error("AI Roast Error:", err);
    res.status(500).json({ roast: "Coach Zog is on a coffee break ☕" });
  }
}
