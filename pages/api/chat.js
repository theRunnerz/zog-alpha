import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHARACTERS } from "../../data/characters";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store chat history in memory (TEMPORARY for Hackathon demo)
// In production, this would go in a database like Redis/Mongo
let historyStore = {}; 

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, characterId, sessionId } = req.body;
  const character = CHARACTERS[characterId];

  if (!character) return res.status(400).json({ error: "Unknown Character" });

  try {
    // 1. Initialize Model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 2. Retrieve History
    if (!historyStore[sessionId]) historyStore[sessionId] = [];
    const history = historyStore[sessionId];

    // 3. Construct Chat (Note: we inject personality as the first message role)
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `System Instruction: ${character.systemPrompt}. Stay in character.` }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am ready." }],
        },
        ...history // Append previous convo
      ],
    });

    // 4. Send Message
    const result = await chat.sendMessage(message);
    const text = result.response.text();

    // 5. Update History
    history.push({ role: "user", parts: [{ text: message }] });
    history.push({ role: "model", parts: [{ text: text }] });

    // Cap history at last 10 turns to save tokens
    if (history.length > 20) historyStore[sessionId] = history.slice(-20);

    res.status(200).json({ reply: text });

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ reply: "..." });
  }
}