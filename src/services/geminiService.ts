import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const getMarketInsights = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a Pokemon TCG market expert. Provide a brief, professional insight about: ${query}. Focus on recent price trends and collector value. Keep it under 100 words.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error getting market insights:", error);
    return "無法取得 AI 分析，請稍後再試。";
  }
};
