/* pages/api/referee.js */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHARACTERS } from "../../data/characters";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Destructure all possible inputs (Live Events vs Post-Game)
  const { 
    event, score, streak, // inputs for Live Commentary
    playerScore, opponentScore, playerCharId, opponentCharId, won // inputs for End Game
  } = req.body;

  try {
    // RECOMMENDATION: 'gemini-1.5-flash' is the fastest stable model for real-time gaming.
    // If you have access to 'gemini-2.0-flash-exp', you can use that too.
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    let prompt = "";

    // --- CASE A: LIVE IN-GAME COMMENTARY (Short & Snappy) ---
    if (event) {
        prompt = `
          You are a cynical, high-energy Alien Sports Announcer.
          Event just happened: ${event}
          Current Score: ${score || 0}
          Streak: ${streak || 0}

          Task: Provide a 1-sentence reaction (Maximum 10 words).
          Personality: Rude, electric, sci-fi slang.
          
          Examples:
          (GOAL_SCORED) -> "Boom! Lasers locked on target!"
          (MISS) -> "Embarrassing aim, human."
          (GAME_OVER) -> "Game over. Your wallet weeps."
          (START) -> "System initialized. Fight for your bags!"
        `;
    } 
    // --- CASE B: POST-GAME SUMMARY (Detailed) ---
    else {
        const pName = CHARACTERS[playerCharId]?.name || "The Challenger";
        const oName = CHARACTERS[opponentCharId]?.name || "The Defender";

        prompt = `
          You are an intense Alien Sportscaster narrating a 1v1 battle result.
          
          MATCHUP: ${pName} vs ${oName}.
          RESULTS: Player (${playerScore}) vs Opponent (${opponentScore}).
          OUTCOME: The Player ${won ? "WON" : "LOST"}.
          
          TASK: Write a 2-sentence commentary.
          - If Player won: Hype them up and trash talk ${oName}.
          - If Player lost: Mock the player for failing to beat ${oName}.
          - Use sci-fi slang.
        `;
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.status(200).json({ commentary: text });

  } catch (error) {
    console.error("Referee Error:", error);
    // Return safe fallback so game doesn't crash
    return res.status(200).json({ commentary: "..." });
  }
}