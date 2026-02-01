/* pages/api/translate.js */
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { audio, text, targetLang } = req.body;

  try {
    // 1. Keep your working model
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); // Or whatever string is working currently

    let result;

    // 2. SPEED CONFIGURATION
    // - maxOutputTokens: 60 (Stops it from generating long paragraphs)
    // - temperature: 0.3 (Makes it decided faster, less "creative" thinking)
    const speedConfig = {
      maxOutputTokens: 60, 
      temperature: 0.3,
    };

    if (audio) {
      const base64Data = audio.split(',')[1] || audio; 
      
      const prompt = `
        Role: Translator.
        Input: Audio.
        Target: ${targetLang}.
        
        Rules:
        1. If silence/noise -> Return "..."
        2. If speech -> Translate immediately.
        3. NO preamble. NO notes. Match the tone.
      `;
      
      result = await model.generateContent({
        contents: [
          { role: 'user', parts: [
              { text: prompt },
              { inlineData: { mimeType: "audio/webm", data: base64Data } }
            ]
          }
        ],
        generationConfig: speedConfig // <--- APPLY SPEED HACK
      });
    
    } else if (text) {
      const prompt = `Translate to ${targetLang}. Text: "${text}". Return ONLY result.`;
      
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: speedConfig
      });
    }

    const translation = result.response.text().trim();

    return res.status(200).json({ translation });

  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ error: "Translation Failed" });
  }
}