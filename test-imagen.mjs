import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1alpha' });

async function testModel(modelName) {
  try {
    console.log(`Testing generateContent with ${modelName}...`);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "A beautiful scenery",
    });
    
    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData) {
      console.log(`Success! Image bytes length:`, inlineData.data.length);
      console.log(`MimeType:`, inlineData.mimeType);
    } else {
      console.log(`No image returned. Parts:`, JSON.stringify(response.candidates?.[0]?.content?.parts, null, 2));
    }
  } catch (error) {
    console.error(`Failed with ${modelName}:`, error.message);
  }
}

async function run() {
  await testModel("gemini-3-pro-image-preview");
}

run();
