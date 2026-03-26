import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ARTICLES } from './articleData';

const ArticleCard = ({ article, index }: { article: any, index: number }) => {
  const Icon = article.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * (index + 1) }}
      className="group relative bg-white dark:bg-[#0d0d0d] rounded-[2rem] overflow-hidden shadow-sm dark:shadow-none hover:shadow-xl hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 border border-gray-100 dark:border-white/5 flex flex-col h-full"
    >
      <Link to={`/article/${article.id}`} className="absolute inset-0 z-30" aria-label={`閱讀 ${article.title}`} />
      <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-[#050505]">
        <div className="absolute inset-0 bg-gray-900/20 group-hover:bg-transparent transition-colors z-10" />
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4 z-20">
          <span className="px-4 py-1.5 bg-white/90 dark:bg-black/60 backdrop-blur-md text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider rounded-full border border-transparent dark:border-white/10">
            {article.category}
          </span>
        </div>
      </div>
      
      <div className="p-8 flex flex-col flex-grow relative z-20 pointer-events-none">
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {article.readTime}
          </span>
          <span>•</span>
          <span>{article.date}</span>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {article.title}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8 line-clamp-3 flex-grow">
          {article.excerpt}
        </p>
        
        <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between mt-auto">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${article.color} flex items-center justify-center text-white shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            閱讀文章 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </motion.article>
  );
};

export const Articles: React.FC = () => {
  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium text-sm mb-6"
        >
          <BookOpen className="w-4 h-4" />
          收藏家知識庫
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight"
        >
          TCG 卡牌分析與指南
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-600 dark:text-gray-400"
        >
          掌握最新市場趨勢、鑑定建議以及您最愛卡牌的歷史深度解析。
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {ARTICLES.map((article, index) => (
          <ArticleCard key={article.id} article={article} index={index} />
        ))}
      </div>
    </div>
  );
};
