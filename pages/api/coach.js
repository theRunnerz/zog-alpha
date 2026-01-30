// pages/api/coach.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchPortfolio } from '../../lib/wallet';
import { calculateScores } from '../../lib/scoring';
import { generatePrompt, CHARACTERS } from '../../data/characters';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { address, characterId, strategy } = req.body;

  if (!address) return res.status(400).json({ error: "Address required" });

  try {
    console.log(`🧠 AI Analysis | Wallet: ${address} | Coach: ${characterId}`);

    // 1. PHASE 1: GET DATA & MATH
    const portfolio = await fetchPortfolio(address);
    const scores = calculateScores(portfolio, strategy || 'balanced');

    // 2. PREPARE THE PROMPT
    const prompt = generatePrompt(characterId, {
      scores: scores,
      totalValue: portfolio.totalValueUsd,
      topHolding: portfolio.assets[0]?.symbol
    });

    // 3. CALL GEMINI (1.5 Flash is fast & cheap)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 4. RETURN THE COMBINED RESULT
    return res.status(200).json({
      character: CHARACTERS[characterId]?.name,
      score: scores.total, // The speedometer value
      feedback: text,      // The roast
      breakdown: scores.breakdown // For the cards
    });

  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ 
      error: "The Coach is holding out for a contract renegotiation (AI Error)." 
    });
  }
}