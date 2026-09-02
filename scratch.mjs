import { GoogleGenAI } from "@google/genai";

async function testGenerate() {
  const models = ["gemini-3.1-flash-image-preview", "gemini-3-pro-image-preview"];

  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
  });
  
  for (const model of models) {
    try {
      console.log(`Testing ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: "A beautiful cat",
      });
      console.log(`Success for ${model}!`);
      return;
    } catch (e) {
      console.error(`Failed: ${e.message}`);
    }
  }
}

testGenerate();
