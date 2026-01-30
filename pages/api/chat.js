/* pages/api/chat.js - Fixed for Gemini 2.0 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHARACTERS } from '../../data/characters';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { characterId, messages, wallet } = req.body;
  const char = CHARACTERS[characterId] || CHARACTERS["WALL"];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 1. Format History for Gemini (It expects 'user' and 'model' roles)
    // We remove the last message because that is the 'new' message we send via sendMessage
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // 2. Start Chat Session
    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 200 }, // Keep it short
      systemInstruction: { 
        role: "system", 
        parts: [{ text: `${char.systemPrompt}\nContext: User Wallet is ${wallet || "Unknown"}` }] 
      }
    });

    // 3. Send the NEW message
    const lastMsgContent = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMsgContent);
    
    // 4. Get Response
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return res.status(500).json({ reply: "Connection glitch. Try again." });
  }
}