import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Calendar, Loader2, Pencil } from 'lucide-react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import ReactMarkdown from 'react-markdown';
import { useAuth } from './AuthContext';

const ArticleDetailSkeleton = () => (
  <div className="min-h-screen bg-[var(--bg)] transition-colors duration-300">
    <div className="h-[40vh] sm:h-[60vh] w-full bg-gray-100 dark:bg-black animate-pulse" />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-32 relative z-10 pb-20">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 shadow-xl border border-gray-100 dark:border-white/5 animate-pulse">
        <div className="h-6 bg-gray-100 dark:bg-white/5 rounded w-24 mb-6" />
        <div className="h-12 sm:h-16 bg-gray-100 dark:bg-white/5 rounded w-3/4 mb-6" />
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-12">
          <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-32" />
          <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-32" />
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-full" />
          <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-full" />
          <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-5/6" />
          <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-full mt-8" />
          <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-4/5" />
        </div>
      </div>
    </div>
  </div>
);

export const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchArticle = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'articles', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) {
    return <ArticleDetailSkeleton />;
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg)] transition-colors duration-300">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">找不到文章</h2>
        <button 
          onClick={() => navigate('/articles')}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回文章列表
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link 
          to="/articles"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回文章列表
        </Link>
        
        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 text-xs font-bold uppercase tracking-wider rounded-full border border-transparent dark:border-white/10">
            {article.category}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          {article.title}
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          {article.excerpt}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-3xl overflow-hidden shadow-lg dark:shadow-none mb-12 bg-gray-100 dark:bg-black min-h-[300px] flex items-center justify-center border border-transparent dark:border-white/5"
      >
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="w-full h-auto max-h-[600px] object-cover"
         referrerPolicy="no-referrer" />
        {isAdmin && (
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const newUrl = window.prompt("請輸入新的封面圖片 URL:", article.imageUrl);
              if (newUrl && newUrl !== article.imageUrl) {
                try {
                  await setDoc(doc(db, 'articles', article.id), { imageUrl: newUrl }, { merge: true });
                  setArticle({ ...article, imageUrl: newUrl });
                } catch (error) {
                  console.error("Error updating cover image:", error);
                  alert("更新失敗，請稍後再試。");
                }
              }
            }}
            className="absolute top-4 right-4 z-40 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white transition-colors"
            title="編輯封面"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="prose prose-lg dark:prose-invert prose-blue max-w-none prose-headings:font-bold prose-img:rounded-2xl prose-img:shadow-md prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500 dark:hover:prose-a:text-blue-300"
      >
        <ReactMarkdown>
          {article.content}
        </ReactMarkdown>
      </motion.div>
    </div>
  );
};

