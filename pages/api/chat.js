/* pages/api/chat.js - Strict History Cleaning */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHARACTERS } from '../../data/characters';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { characterId, messages, wallet } = req.body;
  const char = CHARACTERS[characterId] || CHARACTERS["WALL"];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // --- STEP 1: CLEAN HISTORY ---
    // Gemini CRASHES if history is not strictly User -> Model -> User -> Model.
    // We must filter out 'syste' messages and ensure correct order.
    
    // Get all messages except the very last one (which is the new input)
    const rawHistory = messages.slice(0, -1).filter(m => m.role !== 'system');
    
    // Validation Loop: Ensure logic alternates starting with User.
    const cleanHistory = [];
    let expectedRole = 'user'; // We must start with user

    for (const msg of rawHistory) {
      // Map 'assistant' to 'model' for Gemini
      const geminiRole = msg.role === 'user' ? 'user' : 'model';
      
      if (geminiRole === expectedRole) {
        cleanHistory.push({
          role: geminiRole,
          parts: [{ text: msg.content }]
        });
        // Flip expectation
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      }
    }

    // --- STEP 2: START CHAT ---
    const chat = model.startChat({
      history: cleanHistory,
      systemInstruction: { 
        role: "system", 
        parts: [{ text: `${char.systemPrompt} (User Wallet: ${wallet || "Guest"})` }] 
      }
    });

    // --- STEP 3: SEND MESSAGE ---
    const lastMsgContent = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMsgContent);
    const text = result.response.text();

    return res.status(200).json({ reply: text });

  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ reply: "Communications jammed. Try again." });
  }
}