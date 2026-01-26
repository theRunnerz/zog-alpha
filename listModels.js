import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config(); // loads GEMINI_API_KEY from .env.local

async function listModels() {
  const client = new GoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  try {
    // Gemini currently uses "getModel" to check info
    // Or you can hardcode known models: gemini-1.5, gemini-1.5-chat
    const availableModels = [
      "gemini-1.5",
      "gemini-1.5-chat",
      "gemini-1.5-large"
    ];

    console.log("Available Gemini models:", availableModels);
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
