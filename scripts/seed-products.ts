import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import { POKEMON_CARDS } from '../src/data/pokemonCards';
import firebaseConfig from '../firebase-applet-config.json';

// Mock market data for seeding
const MOCK_MARKET_DATA: Record<string, any> = {
  "POK-JP-S151-205": { "snkrdunk_price": 10828, "ebay_price": 12500, "change_24h": "+15.4%", "status": "hot", "rank": 1 },
  "POK-JP-SM11B-068": { "snkrdunk_price": 75000, "ebay_price": 82000, "change_24h": "+9.7%", "status": "stable", "rank": 2 },
  "POK-JP-S11-115": { "snkrdunk_price": 8800, "ebay_price": 9500, "change_24h": "+6.3%", "status": "watching", "rank": 3 },
  "POK-JP-S151-201": { "snkrdunk_price": 1200, "ebay_price": 1150, "change_24h": "-1.8%", "status": "dip", "rank": 4 },
  "POK-JP-S12A-262": { "snkrdunk_price": 6800, "ebay_price": 7200, "change_24h": "+3.2%", "status": "stable", "rank": 5 },
  "POK-JP-S12A-210": { "snkrdunk_price": 5500, "ebay_price": 5800, "change_24h": "+1.5%", "status": "stable", "rank": 6 },
  "POK-JP-M2-134": { "snkrdunk_price": 15000, "ebay_price": 16500, "change_24h": "+12.1%", "status": "hot", "rank": 7 },
  "POK-JP-S6H-085": { "snkrdunk_price": 4200, "ebay_price": 4500, "change_24h": "+2.4%", "status": "stable", "rank": 8 },
  "POK-JP-S6K-083": { "snkrdunk_price": 4800, "ebay_price": 5100, "change_24h": "+3.1%", "status": "stable", "rank": 9 },
  "POK-JP-S8B-210": { "snkrdunk_price": 2500, "ebay_price": 2700, "change_24h": "+1.2%", "status": "stable", "rank": 10 },
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seedProducts() {
  console.log('Starting seeding products...');
  
  for (const card of POKEMON_CARDS) {
    const docRef = doc(db, 'products', card.card_id);
    const marketData = MOCK_MARKET_DATA[card.card_id] || {
      "snkrdunk_price": Math.floor(Math.random() * 5000) + 1000,
      "ebay_price": Math.floor(Math.random() * 5000) + 1000,
      "change_24h": (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 5).toFixed(1) + "%",
      "status": "stable",
      "rank": 99
    };

    const productData = {
      ...card,
      image_url: `https://placehold.co/400x560/1a1a1a/00ff00.webp?text=${encodeURIComponent(card.name_zh)}`,
      market_data: marketData,
      rank: marketData.rank,
      updatedAt: new Date().toISOString()
    };
    
    try {
      await setDoc(docRef, productData);
      console.log(`Imported: ${card.card_id}`);
    } catch (error) {
      console.error(`Error importing ${card.card_id}:`, error);
    }
  }
  console.log('Seeding completed!');
  process.exit(0);
}

seedProducts();
