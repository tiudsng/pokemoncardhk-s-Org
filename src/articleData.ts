import { TrendingUp, ShieldCheck, Search, BookOpen } from 'lucide-react';

export const ARTICLES = [
  {
    id: "1",
    title: "🔥 本週卡價升幅榜 (AI 監控)",
    excerpt: "透過 AI 大數據監控，分析本週市場波動最大的卡牌，助你精準掌握投資時機。",
    category: "AI 監控",
    readTime: "閱讀時間 5 分鐘",
    date: "2026年3月1日",
    imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1000",
    icon: TrendingUp,
    color: "from-orange-500 to-red-500",
    featured: true,
    content: `...`
  },
  {
    id: "2",
    title: "新卡包：吉利雅 (Clefairy) 預測價值",
    excerpt: "深度解析即將發售的新卡包，預測吉利雅系列卡牌的潛在增值空間。",
    category: "價值預測",
    readTime: "閱讀時間 4 分鐘",
    date: "2026年3月28日",
    imageUrl: "https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&q=80&w=1000",
    icon: Search,
    color: "from-pink-500 to-purple-500",
    content: `...`
  },
  {
    id: "3",
    title: "卡市趨勢分析：噴火龍",
    excerpt: "噴火龍系列卡牌近期市場表現回顧與未來走勢預測。",
    category: "趨勢分析",
    readTime: "閱讀時間 6 分鐘",
    date: "2026年3月25日",
    imageUrl: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&q=80&w=1000",
    icon: TrendingUp,
    color: "from-red-500 to-orange-500",
    content: `...`
  },
  {
    id: "4",
    title: "收藏家聖杯：為什麼初版噴火龍能賣出天價？",
    excerpt: "探索讓 1999 年初版噴火龍成為最經典、最有價值寶可夢卡牌的歷史、情懷與市場動態。",
    category: "市場分析",
    readTime: "閱讀時間 8 分鐘",
    date: "2026年3月15日",
    imageUrl: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80&w=1000",
    icon: BookOpen,
    color: "from-blue-500 to-indigo-500",
    isList: true,
    content: `...`
  }
];
