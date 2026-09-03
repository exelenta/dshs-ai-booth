import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { selectGenerationMode } from "@/lib/generation-mode";
import { getErrorMessage } from "@/lib/errors";

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { prompt, theme, userImage } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "프롬프트가 필요합니다." }, { status: 400 });
    }

    const mode = selectGenerationMode(prompt, Boolean(userImage));

    const contents: Array<
      string | { inlineData: { mimeType: string; data: string } }
    > = [];
    let enhancedPrompt = "";

    if (mode === "image-to-image") {
      // 1. Image-to-Image (Character Redraw & Art Style Transformation) Mode
      enhancedPrompt = `[TASK: ART STYLE TRANSFORMATION & CHARACTER RE-IMAGINATION]
You are a master illustrator.
Attached is the user's reference photograph.

1. CRITICAL INSTRUCTION - COMPLETE ARTISTIC INTEGRATION:
- Analyze the person's face shape, facial features, eyes, smile, hairstyle, and body pose from the attached reference photo.
- Completely REDRAW and TRANSFORM the person into the target art style specified in the prompt (e.g. Studio Ghibli watercolor, Disney Pixar 3D, Cyberpunk neon, Retro pixel art, etc.).
- The person MUST be drawn natively in the illustration as a genuine anime/painted character, NOT as a realistic photo cutout or collage.
- Unify the lighting, brushstrokes, shadows, and color palette across both the character and the background environment so there is zero artificial layering or dissonance.

2. SCENE DESCRIPTION & USER PROMPT:
${prompt}

3. THEME CONTEXT:
Theme: ${theme || "adventure"}.

4. STRICT NEGATIVE PROMPT (AVOID ALL OF THESE):
photorealistic face, real photo, raw camera cutout, unblended layers, sticker cutout, collage, bad composite, realistic human skin texture, mismatched lighting, realistic photography, text, watermarks, signature, extra fingers, distorted face.`;

      // Extract Base64 Image
      const match = userImage.match(/^data:(image\/\w+);base64,(.+)$/);
      const mimeType = match ? match[1] : "image/jpeg";
      const base64Data = match ? match[2] : userImage;

      contents.push({
        inlineData: {
          mimeType: mimeType === "image/png" ? "image/png" : "image/jpeg",
          data: base64Data,
        },
      });
    } else if (mode === "pure-landscape") {
      // 2. Explicit Pure Scenery Illustration Mode
      enhancedPrompt = `[TASK: HIGH-QUALITY SCENERY ILLUSTRATION]
Theme: ${theme || "fantasy"}.
User Idea: ${prompt}

IMPORTANT: Draw a pure landscape/environment with absolutely NO humans, NO people, NO characters, NO faces. Empty scenery only.

NEGATIVE PROMPT:
humans, people, person, faces, figures, silhouettes, crowd, characters, text, watermarks, logo.`;
    } else {
      // 3. Text-to-Image mode: no reference photo, but requested people or
      // characters must still be allowed to appear.
      enhancedPrompt = `[TASK: HIGH-QUALITY ILLUSTRATION]
Theme: ${theme || "fantasy"}.
User Idea: ${prompt}

Create a cohesive, polished illustration from the user's description. If the user asks for people, a family, a child, or a character, include them naturally in the scene. Do not invent extra people when the prompt does not request them.

NEGATIVE PROMPT:
text, watermarks, logo, signature, malformed hands, distorted faces, low resolution.`;
    }

    contents.push(enhancedPrompt);

    console.log(
      "Generating image with mode:",
      mode,
      enhancedPrompt.slice(0, 200) + "...",
    );

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: contents,
    });

    let base64Image: string | null = null;
    let imageMimeType = "image/jpeg";
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        base64Image = part.inlineData.data;
        imageMimeType = part.inlineData.mimeType || imageMimeType;
        break;
      }
    }

    if (!base64Image) {
      const textPart = parts.find((part) => part.text)?.text;
      console.warn("No inline image returned. Explanation text:", textPart);
      throw new Error(textPart || "AI가 이미지를 생성하지 못했습니다. 프롬프트를 확인하고 다시 시도해 주세요.");
    }

    return NextResponse.json({
      success: true,
      image: `data:${imageMimeType};base64,${base64Image}`,
    });

  } catch (error: unknown) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "이미지 생성 중 오류가 발생했습니다.") },
      { status: 500 }
    );
  }
}
