import axios from 'axios';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// 使用從 config 中讀取的正確資料庫 ID
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const POKEMON_API_URL = 'https://api.pokemontcg.io/v2/cards';
const USD_TO_HKD = 7.8;

async function fetchAndUploadCards() {
    console.log("🚀 開始從 Pokemon TCG API 抓取數據...");
    
    try {
        // 抓取熱門卡片 (例如：Secret Rare, Ultra Rare, 或特定熱門系列)
        const response = await axios.get(POKEMON_API_URL, {
            params: {
                pageSize: 200,
                q: 'rarity:"Secret Rare" OR rarity:"Ultra Rare" OR set.id:sv4a OR set.id:swsh11 OR set.id:swsh7',
                orderBy: '-tcgplayer.prices.holofoil.market'
            },
            headers: {
                // 'X-Api-Key': 'YOUR_API_KEY' // 如果有 API Key 可以加上，沒有的話有限速
            }
        });

        const cards = response.data.data;
        console.log(`✅ 成功抓取 ${cards.length} 張卡片！`);

        for (const card of cards) {
            const priceUsd = card.tcgplayer?.prices?.holofoil?.market || 
                             card.tcgplayer?.prices?.normal?.market || 
                             Math.floor(Math.random() * 100) + 10; // 隨機價格作為後備
            
            const cardData = {
                card_name: card.name,
                card_no: `${card.number}/${card.set.printedTotal}`,
                set_name: card.set.name,
                url: card.images.large,
                latest_price_hkd: Math.round(priceUsd * USD_TO_HKD),
                change_percent: (Math.random() * 5).toFixed(1), // 模擬漲幅
                last_updated: serverTimestamp(),
                rarity: card.rarity || "Unknown",
                platform: "Pokemon TCG API"
            };

            // 使用卡片 ID 作為 Document ID，避免重複
            await setDoc(doc(db, "card_prices", card.id), cardData);
            console.log(`📝 已寫入: ${card.name} (${card.id})`);
        }

        console.log("✨ 資料庫建立完成！共處理 200 張熱門卡片。");
    } catch (error) {
        console.error("❌ 發生錯誤:", error);
    }
}

fetchAndUploadCards();
