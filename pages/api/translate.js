import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { audio, targetLang } = req.body;

  if (!audio) return res.status(400).json({ error: "No audio data received" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const base64Data = audio.split(',')[1] || audio; 

    // MODIFIED PROMPT FOR AUTO-DETECTION
    const prompt = `
      Listen to the audio. 
      1. Detect the language being spoken.
      2. Translate the content directly into ${targetLang}.
      
      Rules:
      - If the audio is already in ${targetLang}, just transcribe it exactly as is.
      - Do not add preambles like "The user said:".
      - Return ONLY the final text in ${targetLang}.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "audio/webm",
          data: base64Data
        }
      }
    ]);

    const str = result.response.text();
    return res.status(200).json({ translation: str });

  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ error: "Translation Failed" });
  }
}