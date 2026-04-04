import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Clock, ChevronRight, Loader2, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';

const ArticleCard = ({ article, index }: { article: any, index: number }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * (index + 1) }}
      className="group relative bg-white dark:bg-[#1c1c1e] rounded-[2rem] overflow-hidden shadow-sm dark:shadow-none hover:shadow-xl hover:border-gray-200 dark:border-white/10 transition-all duration-300 border border-gray-100 dark:border-white/5 flex flex-col h-full"
    >
      <Link to={`/article/${article.id}`} className="absolute inset-0 z-30" aria-label={`閱讀 ${article.title}`} />
      
      {isAdmin && (
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const newUrl = window.prompt("請輸入新的封面圖片 URL:", article.imageUrl);
            if (newUrl && newUrl !== article.imageUrl) {
              try {
                await setDoc(doc(db, 'articles', article.id), { imageUrl: newUrl }, { merge: true });
              } catch (error) {
                console.error("Error updating cover image:", error);
                alert("更新失敗，請稍後再試。");
              }
            }
          }}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white transition-colors"
          title="編輯封面"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}

      <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-black z-0">
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
         referrerPolicy="no-referrer" />
        <div className="absolute top-4 left-4 z-20">
          <span className="px-4 py-1.5 bg-gray-100 dark:bg-black/60 backdrop-blur-md text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider rounded-full border border-gray-200 dark:border-white/10">
            {article.category}
          </span>
        </div>
      </div>
      
      <div className="p-8 flex flex-col flex-grow relative z-20 pointer-events-none">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-400 transition-colors line-clamp-2">
          {article.title}
        </h2>
        
        <p className="text-gray-500 dark:text-gray-400 mb-8 line-clamp-3 flex-grow">
          {article.excerpt}
        </p>
        
        <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between mt-auto">
          <span className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Read Article</span>
          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </motion.article>
  );
};

const ArticleSkeleton = () => (
  <div className="bg-white dark:bg-white dark:bg-[#1c1c1e] rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 flex flex-col h-full animate-pulse">
    <div className="h-56 sm:h-48 w-full bg-gray-100 dark:bg-gray-100 dark:bg-black" />
    <div className="p-6 flex flex-col flex-grow space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-16" />
        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-16" />
      </div>
      <div className="h-6 bg-gray-100 dark:bg-white/5 rounded w-full" />
      <div className="h-6 bg-gray-100 dark:bg-white/5 rounded w-2/3" />
      <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-full mt-4" />
      <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-4/5" />
    </div>
  </div>
);

export const Articles: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArticles(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-16">
        <h1 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white tracking-tighter mb-6">
          投資洞察
          <span className="block text-xl sm:text-2xl text-blue-600 dark:text-blue-400 mt-2 font-bold tracking-normal">Market Insights & Guides</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
          深入了解 TCG 市場趨勢、收藏技巧與投資策略。由 AI 驅動的數據分析與專家見解。
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <ArticleSkeleton key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-200 dark:border-white/10">
          <BookOpen className="w-12 h-12 text-gray-600 dark:text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-bold">目前尚無文章，請稍後再回來查看。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <ArticleCard key={article.id} article={article} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

