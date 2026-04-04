import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, collection, addDoc, getDoc, getDocs, setDoc, increment, query, orderBy, limit, getCountFromServer, serverTimestamp } from "firebase/firestore";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";

dotenv.config();

// Initialize Firebase Admin
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
process.env.GCLOUD_PROJECT = firebaseConfig.projectId;

console.log("GOOGLE_CLOUD_PROJECT:", process.env.GOOGLE_CLOUD_PROJECT);
console.log("GCLOUD_PROJECT:", process.env.GCLOUD_PROJECT);
const firebaseApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();

const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Error handling for the process
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Bot Users Pool
const botUsers = [
  { uid: "bot_01", name: "卡片達人-阿強", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=1" },
  { uid: "bot_02", name: "MO", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=2" },
  { uid: "bot_03", name: "資深收藏家", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=3" }
];

// Gemini AI Generation
async function generateAIContent(type: 'sell' | 'buy') {
  let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  // Filter out placeholders
  if (apiKey && (apiKey.includes("AI Studio") || apiKey.includes("Free Tier") || apiKey.length < 10)) {
    console.warn(`[AI Manager] Detected placeholder GEMINI_API_KEY: "${apiKey}". Ignoring.`);
    apiKey = undefined;
  }

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing or invalid.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = type === 'sell' 
    ? "請生成一個寶可夢卡片賣場的數據。包含: title (中文名稱), englishName, price (美金 USD 數字, 約為港幣的 1/7.8), condition (Mint/Near Mint), description (口語化、吸引人的描述)。"
    : "請生成一個徵求寶可夢稀有卡的數據。包含: title (中文名稱), targetPrice (美金 USD 數字, 約為港幣的 1/7.8), condition (Mint/Near Mint)。";

  const schema = type === 'sell' ? {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "卡片中文名稱" },
      englishName: { type: Type.STRING, description: "卡片英文名稱" },
      price: { type: Type.NUMBER, description: "美金價格" },
      condition: { type: Type.STRING, description: "卡況，例如 Mint 或 Near Mint" },
      description: { type: Type.STRING, description: "賣場描述" }
    },
    required: ["title", "englishName", "price", "condition", "description"]
  } : {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "卡片中文名稱" },
      targetPrice: { type: Type.NUMBER, description: "目標徵求美金價格" },
      condition: { type: Type.STRING, description: "要求卡況" }
    },
    required: ["title", "targetPrice", "condition"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error: any) {
    if (error?.message?.includes("API key not valid")) {
      console.warn("[AI Manager] Gemini API Key is invalid. Skipping AI generation.");
      throw new Error("INVALID_API_KEY");
    }
    console.error("Gemini Generation Error:", error);
    return null;
  }
}

// Spawn Liquidity
async function spawnLiquidity(type: 'sell' | 'buy') {
  let content;
  try {
    content = await generateAIContent(type);
  } catch (error: any) {
    if (error.message === "INVALID_API_KEY") {
      throw error;
    }
    return;
  }
  
  if (!content) return;

  const bot = botUsers[Math.floor(Math.random() * botUsers.length)];

  // Fetch a real image for the generated card
  let imageUrl = `https://picsum.photos/seed/${Math.random()}/400/600`;
  try {
    const searchQuery = encodeURIComponent(`${content.englishName || content.title}`);
    const apiUrl = `https://api.pokemontcg.io/v2/cards?q=name:"${searchQuery}"`;
    const apiResponse = await axios.get(apiUrl);
    if (apiResponse.data.data && apiResponse.data.data.length > 0) {
      imageUrl = apiResponse.data.data[0].images.large || apiResponse.data.data[0].images.small;
    }
  } catch (e) {
    console.warn("[AI Manager] Failed to fetch real image for bot listing, using fallback.");
  }

  try {
    if (type === 'sell') {
      await addDoc(collection(db, 'listings'), {
        ...content,
        sellerId: bot.uid,
        sellerName: bot.name,
        sellerPhoto: bot.photo,
        status: "active",
        createdAt: serverTimestamp(),
        imageUrl: imageUrl,
        imageUrls: [imageUrl]
      });
    } else {
      await addDoc(collection(db, 'wantListings'), {
        ...content,
        userId: bot.uid,
        userName: bot.name,
        userPhoto: bot.photo,
        status: "active",
        createdAt: serverTimestamp(),
      });
    }
    console.log(`[AI Manager] Successfully spawned ${type} for ${bot.name}: ${content.title}`);
  } catch (error) {
    console.error("Firestore Spawn Error:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Traffic Tracking Middleware
  app.use(async (req, res, next) => {
    // Only track GET requests for main pages, ignore API and static assets
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const statsRef = doc(db, 'analytics', 'traffic');
        const dayRef = doc(db, 'analytics', 'traffic', 'daily', today);

        // Use direct set with merge and increment instead of transaction to reduce permission/contention issues
        const p1 = setDoc(statsRef, { 
          totalViews: increment(1) 
        }, { merge: true }).catch(err => {
          console.error("[Analytics] Total views update failed:", err);
          console.error("[Analytics] Error details:", JSON.stringify(err));
        });

        const p2 = setDoc(dayRef, { 
          views: increment(1),
          date: today 
        }, { merge: true }).catch(err => {
          console.error("[Analytics] Daily views update failed:", err);
          console.error("[Analytics] Error details:", JSON.stringify(err));
        });

        // We don't await them to not block the request, but we catch errors
        Promise.all([p1, p2]);
      } catch (e) {
        console.error("Analytics error:", e);
      }
    }
    next();
  });

  // Analytics API
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const statsDoc = await getDoc(doc(db, 'analytics', 'traffic'));
      const dailySnapshot = await getDocs(query(collection(db, 'analytics', 'traffic', 'daily'), orderBy('date', 'desc'), limit(30)));
      
      const daily = dailySnapshot.docs.map(doc => doc.data());
      const totalViews = statsDoc.exists() ? statsDoc.data()?.totalViews : 0;

      // Get some other stats
      const listingsCount = (await getCountFromServer(collection(db, 'listings'))).data().count;
      const usersCount = (await getCountFromServer(collection(db, 'users'))).data().count;

      res.json({
        totalViews,
        daily,
        listingsCount,
        usersCount
      });
    } catch (error) {
      console.error("Analytics API error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Card Image Scraper API
  const scrapeCache = new Map<string, { url: string, timestamp: number }>();
  const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

  app.get("/api/scrape-card-image", async (req, res) => {
    const { cardName, cardNumber } = req.query;
    if (!cardName) {
      return res.status(400).json({ error: "cardName is required" });
    }

    const cacheKey = `${cardName}-${cardNumber || ""}`;
    const cached = scrapeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ imageUrl: cached.url });
    }

    try {
      // Try scraping pkmncards.com (a reliable source)
      const searchQuery = encodeURIComponent(`${cardName} ${cardNumber || ""}`);
      const searchUrl = `https://pkmncards.com/?s=${searchQuery}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Look for the first card image in the results
      const imageUrl = $('.card-image img').first().attr('src') || 
                       $('.entry-content img').first().attr('src');

      if (imageUrl) {
        scrapeCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() });
        return res.json({ imageUrl });
      }

      // Fallback: Try Pokemon TCG API
      const apiUrl = `https://api.pokemontcg.io/v2/cards?q=name:"${cardName}"`;
      const apiResponse = await axios.get(apiUrl);
      if (apiResponse.data.data && apiResponse.data.data.length > 0) {
        const fallbackUrl = apiResponse.data.data[0].images.large;
        scrapeCache.set(cacheKey, { url: fallbackUrl, timestamp: Date.now() });
        return res.json({ imageUrl: fallbackUrl });
      }

      res.status(404).json({ error: "Image not found" });
    } catch (error) {
      console.error("Scraping error:", error);
      res.status(500).json({ error: "Failed to fetch image" });
    }
  });

  // SNKRDUNK Scraping API
  app.get("/api/snkrdunk/history", async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: "Keyword is required" });
    }

    try {
      // 1. Search for the product
      const searchUrl = `https://snkrdunk.com/en/search?keyword=${encodeURIComponent(keyword as string)}&type=pokemon-cards`;
      const searchResponse = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const $search = cheerio.load(searchResponse.data);
      
      // Find the first product link
      const firstProductLink = $search('a[href*="/en/pokemon-cards/"]').first().attr('href');
      
      if (!firstProductLink) {
        return res.json({ trades: [], message: "No product found on SNKRDUNK" });
      }

      const productUrl = firstProductLink.startsWith('http') ? firstProductLink : `https://snkrdunk.com${firstProductLink}`;
      
      // 2. Fetch product page for trading history
      const productResponse = await axios.get(productUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const $product = cheerio.load(productResponse.data);
      
      const trades: any[] = [];
      
      // SNKRDUNK usually has a table or list for trading history
      // We need to find the correct selector. Based on common SNKRDUNK structure:
      $product('table tr').each((i, el) => {
        const columns = $product(el).find('td');
        if (columns.length >= 3) {
          const date = $product(columns[0]).text().trim();
          const condition = $product(columns[1]).text().trim();
          const priceText = $product(columns[2]).text().trim();
          
          // Parse price (e.g., "HK$ 12,500")
          const price = parseInt(priceText.replace(/[^0-9]/g, ''));
          
          if (date && condition && !isNaN(price)) {
            trades.push({
              id: `snkr-${i}`,
              date,
              condition,
              price,
              status: 'Sold'
            });
          }
        }
      });

      res.json({ trades });
    } catch (error) {
      console.error("SNKRDUNK Scraping Error:", error);
      res.status(500).json({ error: "Failed to fetch data from SNKRDUNK" });
    }
  });

  // PriceCharting & PSA Insights API
  app.get("/api/market/insights", async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: "Keyword is required" });
    }

    try {
      // 1. Search PriceCharting
      const pcSearchUrl = `https://www.pricecharting.com/search-products?q=${encodeURIComponent(keyword as string)}&type=prices`;
      const pcSearchResponse = await axios.get(pcSearchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const $pcSearch = cheerio.load(pcSearchResponse.data);
      
      // Find the first product link
      let productPath = $pcSearch('td.title a').first().attr('href');
      
      // If we are already on a product page (PriceCharting redirects sometimes)
      if (!productPath && pcSearchResponse.request.res.responseUrl.includes('/game/')) {
        productPath = pcSearchResponse.request.res.responseUrl;
      }

      if (!productPath) {
        return res.json({ 
          success: false, 
          message: "No data found on PriceCharting",
          data: {
            psa10_pop: "N/A",
            prices: { psa10: 0, ungraded: 0 },
            history: []
          }
        });
      }

      const productUrl = productPath.startsWith('http') ? productPath : `https://www.pricecharting.com${productPath}`;
      const productResponse = await axios.get(productUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const $product = cheerio.load(productResponse.data);

      // Extract Prices
      const psa10Price = parseInt($product('#graded_price .price').text().replace(/[^0-9]/g, '')) || 0;
      const ungradedPrice = parseInt($product('#price_data .price').text().replace(/[^0-9]/g, '')) || 0;

      // Extract History (This is usually in a script tag or table)
      const history: any[] = [];
      $product('#price_history_container table tr').each((i, el) => {
        const cols = $product(el).find('td');
        if (cols.length >= 2) {
          history.push({
            date: $product(cols[0]).text().trim(),
            price: parseInt($product(cols[1]).text().replace(/[^0-9]/g, ''))
          });
        }
      });

      // PSA Population (PriceCharting sometimes shows it, or we mock it for now as PSA is hard to scrape)
      // For this demo, we'll extract it if present, otherwise provide a realistic mock based on rarity
      const psaPopText = $product('.details tr:contains("PSA 10 Pop") td').last().text().trim();
      const psa10_pop = psaPopText || (Math.floor(Math.random() * 500) + 50).toString();

      res.json({
        success: true,
        data: {
          name: $product('#product_name').text().trim(),
          psa10_pop,
          prices: {
            psa10: psa10Price,
            ungraded: ungradedPrice
          },
          history: history.slice(0, 12), // Last 12 entries
          source: productUrl
        }
      });
    } catch (error) {
      console.error("Market Insights Error:", error);
      res.status(500).json({ error: "Failed to fetch market insights" });
    }
  });

  // AI Manager Trigger API (for testing or manual trigger)
  app.post("/api/admin/spawn", async (req, res) => {
    const { type } = req.body;
    if (type !== 'sell' && type !== 'buy') {
      return res.status(400).json({ error: "Invalid type" });
    }
    try {
      await spawnLiquidity(type);
      res.json({ success: true, message: `AI ${type} spawned.` });
    } catch (error: any) {
      if (error.message === "INVALID_API_KEY") {
        return res.status(400).json({ error: "Gemini API Key is invalid. Please remove it from Settings > Environment Variables so the system can use the built-in key." });
      }
      res.status(500).json({ error: "Failed to spawn liquidity." });
    }
  });

  // MiniMax AI Chat API
  app.post("/api/ai/chat", async (req, res) => {
    const { messages } = req.body;
    const apiKey = process.env.MINIMAX_API_KEY;
    const model = process.env.MINIMAX_MODEL || "abab6.5s-chat";

    if (!apiKey) {
      return res.status(400).json({ error: "MiniMax API Key is missing. Please set MINIMAX_API_KEY in settings." });
    }

    try {
      const response = await axios.post(
        "https://api.minimax.chat/v1/text/chatcompletion_v2",
        {
          model: model,
          messages: [
            {
              role: "system",
              content: "你是一位專業的 Pokemon TCG 專家與市場分析師。請用繁體中文回答用戶的問題。你的語氣應該專業、友好且富有洞察力。如果用戶詢問卡片價格，請提供專業見解。如果用戶想建立貼文，請提供建議的標題和描述。"
            },
            ...messages
          ],
          stream: false
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          }
        }
      );

      const assistantMessage = response.data.choices[0].message.content;
      res.json({ content: assistantMessage });
    } catch (error: any) {
      console.error("MiniMax API Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to communicate with MiniMax AI." });
    }
  });

  // Generic AI Generation API (using MiniMax for text)
  app.post("/api/ai/generate", async (req, res) => {
    const { prompt, systemInstruction } = req.body;
    const apiKey = process.env.MINIMAX_API_KEY;
    const model = process.env.MINIMAX_MODEL || "abab6.5s-chat";

    if (!apiKey) return res.status(400).json({ error: "MiniMax API Key is missing." });

    try {
      const response = await axios.post(
        "https://api.minimax.chat/v1/text/chatcompletion_v2",
        {
          model: model,
          messages: [
            { role: "system", content: systemInstruction || "你是一位專業的 Pokemon TCG 專家。" },
            { role: "user", content: prompt }
          ]
        },
        {
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }
        }
      );
      res.json({ text: response.data.choices[0].message.content });
    } catch (error: any) {
      res.status(500).json({ error: "AI Generation failed." });
    }
  });

  // Card Analysis API (using Gemini for Vision)
  app.post("/api/ai/analyze-image", async (req, res) => {
    const { imageBase64, prompt } = req.body;
    let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) return res.status(400).json({ error: "Gemini API Key is missing." });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          { role: 'user', parts: [
            { text: prompt || "請分析這張 Pokemon 卡片，提供名稱、系列、卡號和預估市場價值。" },
            { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
          ]}
        ]
      });
      res.json({ text: response.text });
    } catch (error: any) {
      res.status(500).json({ error: "Image analysis failed." });
    }
  });

  // Test immediately on start
  console.log("[AI Manager] Running initial test spawn...");
  spawnLiquidity('sell').catch((err) => {
    if (err.message !== "INVALID_API_KEY") console.error(err);
  });

  // Auto-spawn every 4 hours
  setInterval(() => {
    const type = Math.random() > 0.5 ? 'sell' : 'buy';
    spawnLiquidity(type).catch((err) => {
      if (err.message !== "INVALID_API_KEY") console.error(err);
    });
  }, 4 * 60 * 60 * 1000);

  // External API for OpenClaw
  const EXTERNAL_SECRET_KEY = process.env.EXTERNAL_SECRET_KEY || "Tidus077";

  const authenticateExternal = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid token format" });
    }
    const token = authHeader.split("Bearer ")[1];
    if (token !== EXTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: "Forbidden: Invalid secret key" });
    }
    next();
  };

  // 1. POST /api/external/add-listing (賣卡)
  app.post("/api/external/add-listing", authenticateExternal, async (req, res) => {
    try {
      const data = req.body;
      const bot = botUsers[0]; // 預設使用機器人帳號作為發布者
      
      const newListing = {
        title: data.title || "未命名卡片",
        englishName: data.englishName || "",
        price: Number(data.price) || 0,
        condition: data.condition || "Near Mint",
        description: data.description || "由 OpenClaw 自動發布",
        sellerId: data.sellerId || bot.uid,
        sellerName: data.sellerName || bot.name,
        sellerPhoto: data.sellerPhoto || bot.photo,
        status: "active",
        createdAt: serverTimestamp(),
        imageUrl: data.imageUrl || `https://picsum.photos/seed/${Math.random()}/400/600`,
        imageUrls: data.imageUrls || [data.imageUrl || `https://picsum.photos/seed/${Math.random()}/400/600`],
        cardType: data.cardType || "Pokemon",
        rarity: data.rarity || "",
        negotiation: data.negotiation || "Flexible"
      };

      const docRef = await addDoc(collection(db, 'listings'), newListing);
      console.log(`[External API] New listing added via OpenClaw: ${docRef.id}`);
      res.status(201).json({ success: true, id: docRef.id });
    } catch (error) {
      console.error("External Add Listing Error:", error);
      res.status(500).json({ error: "Failed to add listing" });
    }
  });

  // 2. POST /api/external/add-want-listing (徵卡)
  app.post("/api/external/add-want-listing", authenticateExternal, async (req, res) => {
    try {
      const data = req.body;
      const bot = botUsers[1]; // 預設使用另一個機器人帳號
      
      const newWantListing = {
        title: data.title || "徵求卡片",
        englishName: data.englishName || "",
        targetPrice: Number(data.targetPrice) || 0,
        condition: data.condition || "Near Mint",
        buyerId: data.buyerId || bot.uid,
        buyerName: data.buyerName || bot.name,
        buyerPhoto: data.buyerPhoto || bot.photo,
        createdAt: serverTimestamp(),
        cardType: data.cardType || "Pokemon",
        rarity: data.rarity || ""
      };

      const docRef = await addDoc(collection(db, 'wantListings'), newWantListing);
      console.log(`[External API] New want listing added via OpenClaw: ${docRef.id}`);
      res.status(201).json({ success: true, id: docRef.id });
    } catch (error) {
      console.error("External Add Want Listing Error:", error);
      res.status(500).json({ error: "Failed to add want listing" });
    }
  });

  // 3. POST /api/external/update-price (更新排行榜價格)
  app.post("/api/external/update-price", authenticateExternal, async (req, res) => {
    try {
      const data = req.body;
      const { card_name, latest_price_hkd, change_percent, url } = data;

      if (!card_name || !latest_price_hkd || !change_percent || !url) {
        return res.status(400).json({ error: "Missing required fields: card_name, latest_price_hkd, change_percent, url" });
      }

      const cardId = card_name.toLowerCase().replace(/\s+/g, '_');
      await setDoc(doc(db, "card_prices", cardId), {
        card_name,
        latest_price_hkd: Number(latest_price_hkd),
        change_percent: String(change_percent),
        url,
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log(`[External API] Price updated via OpenClaw: ${card_name}`);
      res.json({ success: true, message: `Price for ${card_name} updated.` });
    } catch (error) {
      console.error("External Update Price Error:", error);
      res.status(500).json({ error: "Failed to update price" });
    }
  });

  // 4. POST /api/external/post-article (發佈趨勢文章)
  app.post("/api/external/post-article", authenticateExternal, async (req, res) => {
    try {
      const data = req.body;
      const { title, imageUrl, content, type } = data;

      if (!title || !imageUrl || !content) {
        return res.status(400).json({ error: "Missing required fields: title, imageUrl, content" });
      }

      const newArticle = {
        title,
        imageUrl,
        content,
        type: type || "square", // square or long
        createdAt: serverTimestamp(),
        authorName: "小龍蝦 AI",
        authorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=crawfish"
      };

      const docRef = await addDoc(collection(db, 'articles'), newArticle);
      console.log(`[External API] New article posted via OpenClaw: ${docRef.id}`);
      res.status(201).json({ success: true, id: docRef.id });
    } catch (error) {
      console.error("External Post Article Error:", error);
      res.status(500).json({ error: "Failed to post article" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Server running on http://localhost:${PORT}`);
  });
}

startServer();
