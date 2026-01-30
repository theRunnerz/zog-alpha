/* pages/api/chat.js */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHARACTERS } from '../../data/characters';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { characterId, messages, wallet } = req.body;
  const char = CHARACTERS[characterId] || CHARACTERS["WALL"];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 1. Prepare history (Change 'user'/'assistant' to 'user'/'model')
    // We EXCLUDE the very last message, because we send that in step 3
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // 2. Start Chat
    const chat = model.startChat({
      history: history,
      systemInstruction: { 
        role: "system", 
        parts: [{ text: `${char.systemPrompt}. You are talking to wallet: ${wallet || "Guest"}` }] 
      }
    });

    // 3. Send the newest message
    const lastMsg = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMsg);
    const text = result.response.text();

    return res.status(200).json({ reply: text });

  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ reply: "My brain is buffering... try again." });
  }
}