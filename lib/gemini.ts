import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

// ✅ Create AI client with API key
const ai = new GoogleGenAI({ apiKey });

export async function generateAnswer(
  question: string,
  context: string[]
): Promise<string> {
  const contextText = context.join("\n\n");

  const prompt = `
Based on the following knowledge base articles, please answer the user's question.
If the information is not available in the provided context, politely say so and suggest they contact support.

Context Articles:
${contextText}

User Question: ${question}
`;

  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // ✅ Safely access the response
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("AI response:", text);

    if (!text) {
      throw new Error("Gemini returned an empty or unexpected response");
    }

    return text.trim();
  } catch (error) {
    console.error("Error generating answer:", error);
    throw new Error("Failed to generate answer from Gemini");
  }
}

export async function generateTags(content: string): Promise<string[]> {
  const prompt = `
Analyze the following article content and generate 3-5 relevant tags.
Return only the tags as a comma-separated list, no other text.

Content: ${content}
`;

  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-1.5-pro-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini returned an empty tag response");
    }

    return text
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 5);
  } catch (error) {
    console.error("Error generating tags:", error);
    return [];
  }
}

export async function generateSummary(content: string): Promise<string> {
  const prompt = `
Create a concise summary (2-3 sentences) of the following article content:

${content}
`;

  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-1.5-pro-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini returned an empty summary response");
    }

    return text.trim();
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate summary from Gemini");
  }
}

