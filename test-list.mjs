import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    const response = await ai.models.list({ pageSize: 50 });
    for (const model of response) {
      if (model.name.includes("imagen") || model.supportedGenerationMethods?.includes("generateImages") || model.name.includes("image")) {
        console.log(`Model: ${model.name}`);
        console.log(`Methods: ${model.supportedGenerationMethods?.join(", ")}`);
        console.log(`Description: ${model.description}\n`);
      }
    }
  } catch (error) {
    console.error("Failed:", error.message);
  }
}

listModels();
