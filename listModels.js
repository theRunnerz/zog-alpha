import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config(); // loads GEMINI_API_KEY from .env.local

async function listModels() {
  const client = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    // ✅ Use the models.list() method instead of client.listModels()
    const res = await client.models.list();
    console.log("Available models:", res.models.map(m => m.name));
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
