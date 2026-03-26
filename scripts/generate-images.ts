import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) {
  console.error("No API key found in environment variables.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function generateImage(prompt: string, filename: string) {
  console.log(`Generating image for: ${filename}...`);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      }
    });
    
    let saved = false;
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const buffer = Buffer.from(base64Data, 'base64');
          const filepath = path.join(process.cwd(), 'public', filename);
          fs.mkdirSync(path.dirname(filepath), { recursive: true });
          fs.writeFileSync(filepath, buffer);
          console.log(`Successfully saved ${filename}`);
          saved = true;
          break;
        }
      }
    }
    if (!saved) {
      console.log(`No image data found in response for ${filename}`);
    }
  } catch (e) {
    console.error(`Failed to generate ${filename}:`, e);
  }
}

async function main() {
  await generateImage("A highly detailed, professional photograph of a rare holographic dragon trading card in mint condition, resting on a dark velvet surface under dramatic spotlight. Trading card photography, 8k resolution, photorealistic.", "article-1.png");
  await generateImage("A professional photograph of three graded trading card slabs standing upright on a clean studio background, showing the grading labels and protective acrylic cases. Trading card grading concept, crisp focus, studio lighting.", "article-2.png");
  await generateImage("A close-up macro photograph of a person using a jeweler's loupe magnifying glass to inspect the printing dot pattern on a holographic trading card. Professional lighting, macro photography, authentication concept.", "article-3.png");
  await generateImage("A beautiful artistic trading card featuring a cute yellow electric mouse character painted in the style of Vincent van Gogh's Starry Night, displayed in a museum setting. Oil painting style, vibrant colors, masterpiece.", "article-4.png");
}

main();
