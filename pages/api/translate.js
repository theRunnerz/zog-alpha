/* pages/api/translate.js - Fixed for Hallucinations */
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { audio, text, targetLang } = req.body;

  try {
    // RECOMMENDATION: Use 'gemini-1.5-flash' for max speed/stability
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    let result;

    if (audio) {
      const base64Data = audio.split(',')[1] || audio; 
      // STRICT PROMPT TO STOP HALLUCINATIONS
      const prompt = `
        You are a translation tool. 
        1. Listen to the audio.
        2. If the audio is just silence, breathing, background noise, or unintelligible: Return exactly "SILENCE".
        3. If there is clear speech: Detect language and translate to ${targetLang}.
        4. Return ONLY the translation. No other text.
      `;
      
      result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: "audio/webm", data: base64Data } }
      ]);
    
    } else if (text) {
      const prompt = `Translate this to ${targetLang}: "${text}". Return only the translated text.`;
      result = await model.generateContent(prompt);
    }

    const translation = result.response.text().trim();

    // Check for our failure keyword
    if (translation.includes("SILENCE")) {
       return res.status(200).json({ translation: "..." }); // UI shows dots instead of weird text
    }

    return res.status(200).json({ translation });

  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ error: "Processing failed" });
  }
}