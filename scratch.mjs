import { GoogleGenAI } from "@google/genai";

async function testGenerate() {
  const models = ["gemini-3.1-flash-image-preview", "nano-banana-pro-preview", "imagen-4.0-generate-001"];

  const ai = new GoogleGenAI({ 
    apiKey: "AIzaSyDDtdBftz-VcBZVEYONu3WdsJxBzUomoIQ",
  });
  
  for (const model of models) {
    try {
      console.log(`Testing ${model}...`);
      const response = await ai.models.generateImages({
        model: model,
        prompt: 'A beautiful cat',
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        }
      });
      console.log(`Success for ${model}!`);
      return;
    } catch (e) {
      console.error(`Failed: ${e.message}`);
    }
  }
}

testGenerate();
