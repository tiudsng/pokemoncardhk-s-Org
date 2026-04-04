import { Article } from '../types';

/**
 * Generic AI generation via backend proxy (uses MiniMax for text)
 */
async function generateWithAI(prompt: string, systemInstruction?: string) {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction })
  });
  if (!response.ok) throw new Error('AI Generation failed via backend');
  const data = await response.json();
  return data.text;
}

/**
 * Card analysis via backend proxy (uses Gemini Vision)
 */
export async function analyzeCardImage(imageBase64: string, prompt?: string) {
  const response = await fetch('/api/ai/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, prompt })
  });
  if (!response.ok) throw new Error('Image analysis failed via backend');
  const data = await response.json();
  return data.text;
}

export async function getMarketInsights(cardName: string) {
  const prompt = `分析 Pokemon 卡片 "${cardName}" 的市場趨勢。
  請提供:
  1. 最近的成交價範圍 (HKD)
  2. 市場熱度 (1-10)
  3. 投資建議 (短期/長期)
  4. 收藏價值分析
  請用繁體中文回答，並以 JSON 格式返回。`;
  
  const text = await generateWithAI(prompt, "你是一位專業的 Pokemon TCG 市場分析師。請只返回 JSON 格式的數據。");
  try {
    return JSON.parse(text.replace(/```json|```/g, ''));
  } catch (e) {
    return { error: "解析失敗", raw: text };
  }
}

export async function getCardDetails(cardName: string) {
  const prompt = `提供 Pokemon 卡片 "${cardName}" 的詳細信息。
  包括: 屬性, 稀有度, 技能, 弱點, 抗性, 撤退成本。
  請用繁體中文回答，並以 JSON 格式返回。`;
  
  const text = await generateWithAI(prompt, "你是一位專業的 Pokemon TCG 專家。請只返回 JSON 格式的數據。");
  try {
    return JSON.parse(text.replace(/```json|```/g, ''));
  } catch (e) {
    return { error: "解析失敗", raw: text };
  }
}

export async function getCardDetailsByNumber(cardNumber: string, set: string) {
  const prompt = `提供 Pokemon 卡片 "${set}" 系列中編號為 "${cardNumber}" 的詳細信息。
  包括: 名稱, 屬性, 稀有度, 技能。
  請用繁體中文回答，並以 JSON 格式返回。`;
  
  const text = await generateWithAI(prompt, "你是一位專業的 Pokemon TCG 專家。請只返回 JSON 格式的數據。");
  try {
    return JSON.parse(text.replace(/```json|```/g, ''));
  } catch (e) {
    return { error: "解析失敗", raw: text };
  }
}

export async function generateArticle(topic: string) {
  const prompt = `撰寫一篇關於 "${topic}" 的 Pokemon TCG 專欄文章。
  要求:
  1. 標題要吸引人
  2. 內容要專業且有深度
  3. 包含市場分析或玩法建議
  4. 字數約 500-800 字
  請用繁體中文回答，並以 JSON 格式返回，包含 title, excerpt, content, category, readTime。`;
  
  const text = await generateWithAI(prompt, "你是一位資深的 Pokemon TCG 專欄作家。請只返回 JSON 格式的數據。");
  try {
    return JSON.parse(text.replace(/```json|```/g, ''));
  } catch (e) {
    return { error: "解析失敗", raw: text };
  }
}

export async function generateArticleImage(prompt: string): Promise<string> {
  // Image generation still needs a client-side key or a backend proxy for image generation
  // Since we don't have a MiniMax image API yet, we'll use a placeholder or keep Gemini if available
  // For now, let's just return a placeholder to avoid errors if the key is missing
  return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/800/450`;
}
