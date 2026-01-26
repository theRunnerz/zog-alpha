import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const client = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { prompt } = req.body;

  try {
    // 1. Get the model object
    const model = client.model("gemini-1.5-chat");

    // 2. Use the model object to chat
    const response = await model.chat({
      messages: [
        { role: "system", content: "You are Coach Zog, an alien football coach who roasts players humorously in 1-2 sentences." },
        { role: "user", content: prompt },
      ],
    });

    // 3. Extract the AI text
    const roastText = response?.candidates?.[0]?.content ?? "Coach Zog is speechless 🫠";

    res.status(200).json({ roast: roastText });
  } catch (err) {
    console.error("AI Roast Error Details:", err);
    res.status(500).json({ error: err.message });
  }
}
