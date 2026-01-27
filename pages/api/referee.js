import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHARACTERS } from "../../data/characters";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { playerScore, opponentScore, playerCharId, opponentCharId, won } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Identify the Aliens
    const pName = CHARACTERS[playerCharId]?.name || "The Challenger";
    const oName = CHARACTERS[opponentCharId]?.name || "The Defender";

    const prompt = `
      You are an intense Alien Sportscaster narrating a 1v1 battle.
      
      MATCHUP: ${pName} vs ${oName}.
      
      RESULTS:
      - ${pName} (Player): ${playerScore} points.
      - ${oName} (Opponent): ${opponentScore} points.
      
      OUTCOME: The Player ${won ? "WON" : "LOST"}.
      
      TASK: Write a 2-sentence commentary.
      - If Player won: Hype them up and trash talk ${oName}.
      - If Player lost: Mock the player for failing to beat ${oName}.
      - Use sci-fi slang.
    `;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    return res.status(200).json({ commentary: text });

  } catch (error) {
    return res.status(200).json({ commentary: "Referee signal lost." });
  }
}