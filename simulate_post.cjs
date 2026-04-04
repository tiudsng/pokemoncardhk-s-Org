const { GoogleGenAI } = require('@google/genai');

async function runSimulation() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY environment variable.");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });

  // 1. 模擬抽取用戶 (Gold 或 Silver)
  const isGold = Math.random() > 0.5;
  const user = isGold 
    ? { display_name: 'Kelvin_Lau', identity_tier: 'gold' }
    : { display_name: '肥仔', identity_tier: 'silver' };

  const cardName = "Lugia V SA (s12a 110/098)";
  const price = isGold ? 1550 : 1480;
  const tradeMethod = isGold ? "面交 (旺角/油麻地) 或 順豐到付" : "只限面交 (觀塘線)";

  // 2. 模擬抽取圖片
  let imageStyleDesc = "";
  if (isGold) {
    imageStyleDesc = "Premium 風格：一張帶有 PSA 10 鑑定盒的高清實拍圖，燈光充足，右下角帶有半透明的「Verified by TCG INVEST」金色浮水印。";
  } else {
    imageStyleDesc = "Raw 風格：一張放在卡墊上的素人實拍圖，可能稍微有點反光，沒有鑑定盒，也沒有浮水印，呈現最真實的卡況。";
  }

  // 3. 生成地道廣東話文案
  let prompt = "";
  if (isGold) {
    prompt = `
    你是一個香港專業的 Pokémon 卡牌投資者與認證賣家 (Gold Tier)。請寫一篇賣卡貼文。
    卡名：${cardName}
    價格：HKD $${price}
    卡況：PSA 10 完美品相
    交收方式：${tradeMethod}
    
    要求：
    1. 語氣專業、有說服力，強調卡片的保值潛力、品相完美。
    2. 提及自己是信譽賣家，包裝穩妥。
    3. 使用繁體中文（香港習慣用語），適量使用 emoji (🔥, 📈, 💎)。
    4. 字數約 80-120 字。直接輸出貼文內容，不要包含任何開場白。
    5. 禁忌：唔好寫得太似 AI，唔好用「親」或者太公信嘅字眼。
    `;
  } else {
    prompt = `
    你是一個香港普通的 Pokémon 卡牌玩家 (Silver Tier)。請寫一篇賣卡貼文。
    卡名：${cardName}
    價格：HKD $${price}
    卡況：99% New，入套即閃，無白邊
    交收方式：${tradeMethod}
    
    要求：
    1. 語氣地道、隨性，使用香港網上交易平台 (如 Carousell, 連登) 的常用語。
    2. 可以加入例如「退坑」、「急放」、「回血」、「執雞」、「靚相」、「可小議」等字眼。
    3. 使用繁體中文（廣東話口語），適量使用 emoji (🙏, 🙇‍♂️, 📦)。
    4. 字數約 50-100 字。直接輸出貼文內容，不要包含任何開場白。
    5. 禁忌：唔好寫得太似 AI，唔好用「親」或者太公信嘅字眼。
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-preview',
      contents: prompt,
    });
    
    const postContent = response.text;

    // 4. 輸出結果
    console.log("==========================================");
    console.log("TCG INVEST 自動上架功能測試 (Single Run)");
    console.log("==========================================\n");
    console.log(`【賣家資訊】：${user.display_name} / ${user.identity_tier.toUpperCase()}`);
    console.log(`【配圖風格】：${imageStyleDesc}\n`);
    console.log(`【Post 內容】：\n${postContent}`);
    console.log("\n==========================================");

  } catch (error) {
    console.error("Error generating content:", error);
  }
}

runSimulation();
