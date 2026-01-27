import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHARACTERS } from "../../data/characters";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { score, won, characterId } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 1. Set the Personality
    let characterName = "Coach Zog";
    let instructions = `
      You are Coach Zog, a funny generic alien sports coach.
      You are aggressive but funny.
    `;

    // 2. Override if Player has NFT equipped
    if (characterId && CHARACTERS[characterId]) {
      const char = CHARACTERS[characterId];
      characterName = char.name;
      instructions = `
        You are ${char.name}.
        YOUR PERSONALITY: ${char.systemPrompt}.
        ROLE: You are coaching the player who owns your NFT.
      `;
    }

    const prompt = `
      ${instructions}
      
      EVENT: Game Ended.
      SCORE: ${score}.
      RESULT: ${won ? "They Won" : "They Lost (Ran out of time)"}.
      
      TASK: Give a 1-sentence reaction to the player's performance.
      Make it funny and match your personality.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ roast: text, name: characterName });

  } catch (error) {
    console.error("AI Roast Error:", error);
    return res.status(200).json({ roast: "Coach Zog lost signal. (Connection Error)" });
  }
}