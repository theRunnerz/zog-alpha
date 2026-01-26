import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const client = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { prompt } = req.body;

  try {
    // Use the correct chat method
    const response = await client.chat({
      model: "gemini-1.5-chat",
      messages: [
        { role: "system", content: "You are Coach Zog, an alien football coach who roasts players humorously in 1-2 sentences." },
        { role: "user", content: prompt },
      ],
    });

    const roastText = response?.candidates?.[0]?.content ?? "Coach Zog lost his whistle 🫠";

    res.status(200).json({ roast: roastText });
  } catch (err) {
    console.error("AI Roast Error Details:", err);
    res.status(500).json({ error: err.message });
  }
}
