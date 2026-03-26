import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, Command, ArrowRight, Infinity } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const AuthPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(false);

  const from = searchParams.get('from') || '/';

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate(from);
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FFFFFF] dark:bg-[#050505] relative overflow-hidden transition-colors duration-500">
      {/* Atmospheric Background (Recipe 7) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-[440px] px-6"
      >
        <div className="flex flex-col items-center">
          {/* Logo Icon - Styled like the image */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-[#5850EC] rounded-2xl flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(88,80,236,0.4)] mb-10"
          >
            <Infinity className="w-9 h-9 text-white" strokeWidth={2.5} />
          </motion.div>

          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-10"
          >
            <h1 className="text-[32px] font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
              {isLogin ? '歡迎回來' : '建立帳號'}
            </h1>
            <p className="text-[16px] text-gray-500 dark:text-gray-400 font-medium tracking-tight">
              {isLogin ? '歡迎回來，繼續您的收藏之旅。' : '開啟您的寶可夢卡牌收藏傳奇。'}
            </p>
          </motion.div>

          {/* Form with Staggered Entrance */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full space-y-4 mb-8"
          >
            {!isLogin && (
              <motion.div variants={itemVariants} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#5850EC] transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="全名"
                  className="block w-full pl-14 pr-5 py-[18px] bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-[#5850EC]/10 focus:border-[#5850EC] focus:bg-white dark:focus:bg-gray-900 transition-all outline-none font-medium text-[15px]"
                />
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#5850EC] transition-colors" />
              </div>
              <input
                type="email"
                placeholder="name@example.com"
                className="block w-full pl-14 pr-5 py-[18px] bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-[#5850EC]/10 focus:border-[#5850EC] focus:bg-white dark:focus:bg-gray-900 transition-all outline-none font-medium text-[15px]"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#5850EC] transition-colors" />
              </div>
              <input
                type="password"
                placeholder={isLogin ? '密碼' : '建立密碼'}
                className="block w-full pl-14 pr-5 py-[18px] bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-[#5850EC]/10 focus:border-[#5850EC] focus:bg-white dark:focus:bg-gray-900 transition-all outline-none font-medium text-[15px]"
              />
            </motion.div>
          </motion.div>

          {/* Submit Button */}
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.01, backgroundColor: '#4F46E5' }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-[18px] px-6 bg-[#5850EC] text-white rounded-2xl font-bold shadow-[0_15px_30px_-5px_rgba(88,80,236,0.3)] hover:shadow-[0_20px_40px_-5px_rgba(88,80,236,0.4)] transition-all mb-8 flex items-center justify-center gap-2 text-[16px]"
          >
            {isLogin ? '登入' : '建立帳號'}
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* Separator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="w-full flex items-center gap-4 mb-8"
          >
            <div className="h-px bg-gray-100 dark:bg-white/5 flex-grow" />
            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">OR</span>
            <div className="h-px bg-gray-100 dark:bg-white/5 flex-grow" />
          </motion.div>

          {/* Google Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={handleGoogleSignIn}
            whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-[16px] px-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300 rounded-2xl font-bold shadow-sm transition-all mb-10 flex items-center justify-center gap-3 text-[15px]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            使用 Google 帳號繼續
          </motion.button>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium text-[15px]">
              {isLogin ? "還沒有帳號嗎？ " : "已經有帳號了？ "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#5850EC] dark:text-indigo-400 font-bold hover:underline underline-offset-4 transition-all"
              >
                {isLogin ? '立即註冊' : '立即登入'}
              </button>
            </p>

            <p className="text-[12px] text-gray-400 dark:text-gray-600 text-center max-w-[280px] leading-relaxed">
              繼續操作即代表您同意我們的{' '}
              <a href="#" className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">服務條款</a> 與{' '}
              <a href="#" className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">隱私權政策</a>。
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
