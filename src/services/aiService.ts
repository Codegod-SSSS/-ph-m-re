import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateImageTags(base64Data: string, mimeType: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Generate 5 to 8 relevant descriptive tags for this image. Output only a JSON array of strings."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("AI Tagging Error:", error);
    return [];
  }
}
