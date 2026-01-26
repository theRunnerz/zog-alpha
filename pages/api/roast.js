import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { score } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    });

    const prompt = `
You are Coach Zog, an alien football coach.
Roast the player in 1–2 funny sentences.
Score: ${score}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.status(200).json({ roast: text });
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({
      roast: "Coach Zog lost his voice yelling at aliens 🫠",
    });
  }
}
