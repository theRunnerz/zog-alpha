/* pages/api/translate.js */
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') return res.status(405).end();

  const { audio, targetLang } = req.body;

  if (!audio) {
    return res.status(400).json({ error: "No audio data received" });
  }

  try {
    // 1. Initialize Model
    // We use 'gemini-1.5-flash' because it is FAST and supports Audio inputs well.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. Prepare Audio Data
    // The client sends data like "data:audio/webm;base64,GkX..."
    // We need to strip the "data:audio/..." header to get just the raw base64 string.
    const base64Data = audio.split(',')[1] || audio; 

    // 3. Define the Prompt
    // We instruct Gemini to be a strict translator with no extra chatter.
    const prompt = `
      Listen to this audio. 
      Transcribe the speech and translate it directly into ${targetLang}.
      Do not add any preamble like "Here is the translation". 
      Do not add quotes. 
      Just return the translated text.
    `;

    // 4. Send Payload to Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "audio/webm", // This mimeType is generally safe for webm/mp4 uploads
          data: base64Data
        }
      }
    ]);

    const response = await result.response;
    const translation = response.text();

    // 5. Return the result
    return res.status(200).json({ translation });

  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return res.status(500).json({ error: "Translation Failed." });
  }
}