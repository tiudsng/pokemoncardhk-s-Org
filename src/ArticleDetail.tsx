import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { ARTICLES } from './articleData';
import ReactMarkdown from 'react-markdown';

export const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const article = ARTICLES.find(a => a.id === Number(id));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-[#030303] transition-colors duration-300">
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

  const Icon = article.icon;

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
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {article.readTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {article.date}
            </span>
          </div>
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
        className="rounded-3xl overflow-hidden shadow-lg dark:shadow-none mb-12 bg-gray-100 dark:bg-[#050505] min-h-[300px] flex items-center justify-center border border-transparent dark:border-white/5"
      >
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="w-full h-auto max-h-[600px] object-cover"
        />
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
