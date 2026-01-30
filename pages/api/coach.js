/* pages/api/coach.js - Fixed Import Name */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchPortfolio } from '../../lib/wallet';
import { calculateScores } from '../../lib/scoring';
// FIXED IMPORT BELOW:
import { getCharacterPrompt, CHARACTERS } from '../../data/characters';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { address, characterId, strategy } = req.body;

  if (!address) return res.status(400).json({ error: "Address required" });

  try {
    console.log(`🧠 AI Analysis | Address: ${address} | Coach: ${characterId}`);

    // 1. GET DATA
    const portfolio = await fetchPortfolio(address);
    // Safety check
    const safePortfolio = portfolio || { totalValueUsd: 0, assets: [] };
    
    // 2. MATH
    const scores = calculateScores(safePortfolio, strategy || 'balanced');

    // 3. BUILD PROMPT (Using the fixed function name)
    const prompt = getCharacterPrompt(characterId, {
      scores: scores,
      totalValue: safePortfolio.totalValueUsd,
      topHolding: safePortfolio.assets[0]?.symbol
    });

    // 4. CALL GEMINI
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. RETURN
    return res.status(200).json({
      character: CHARACTERS[characterId]?.name || "Alien",
      score: scores.total, 
      feedback: text,
      breakdown: scores.breakdown,
      metrics: {
          totalValue: safePortfolio.totalValueUsd,
          topAsset: safePortfolio.assets[0]?.symbol || "None"
      }
    });

  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ 
      error: "The Alien is recharging (Server Error).",
      details: error.message
    });
  }
}