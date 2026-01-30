/* pages/api/translate.js - FULL UPDATE */
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { audio, text, targetLang } = req.body; // Accept 'text' too

  if (!audio && !text) return res.status(400).json({ error: "No input received" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    let prompt = "";
    let parts = [];

    // --- CASE 1: AUDIO ---
    if (audio) {
      const base64Data = audio.split(',')[1] || audio; 
      prompt = `
        Listen to the audio. 
        Detect the language.
        Translate it directly into ${targetLang || "English"}.
        Rules: Return ONLY the final text in ${targetLang}. No quotes.
      `;
      parts = [
        prompt,
        { inlineData: { mimeType: "audio/webm", data: base64Data } }
      ];
    } 
    // --- CASE 2: TEXT (Fallback) ---
    else if (text) {
      prompt = `
        Translate the following text into ${targetLang || "English"}: "${text}".
        Rules: Return ONLY the final translation. No quotes.
      `;
      parts = [  prompt ];
    }

    const result = await model.generateContent(parts);
    const str = result.response.text();

    return res.status(200).json({ translation: str });

  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ error: "Translation Failed" });
  }
}