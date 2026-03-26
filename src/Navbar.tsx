import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Camera, MessageCircle, LogOut, User as UserIcon, X, BookOpen, Search, Heart, Sparkles, BadgeDollarSign, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { user, signInWithGoogle, logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleProtectedAction = (e: React.MouseEvent) => {
    if (user?.isGuest) {
      e.preventDefault();
      navigate(`/auth?from=${encodeURIComponent(location.pathname)}`);
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 bg-[var(--bg)]/70 backdrop-blur-xl border-b border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  {/* Card 1 (Bottom Left) */}
                  <rect x="2" y="9" width="10" height="13" rx="1.5" className="fill-gray-400/20 stroke-gray-400 dark:stroke-white/20" strokeWidth="1" />
                  {/* Card 2 (Middle) */}
                  <rect x="6" y="5.5" width="10" height="13" rx="1.5" className="fill-gray-500/30 stroke-gray-500 dark:stroke-white/30" strokeWidth="1" />
                  {/* Card 3 (Top Right) */}
                  <rect x="10" y="2" width="10" height="13" rx="1.5" className="fill-red-600 stroke-white" strokeWidth="1.2" />
                  {/* Twinkling Star */}
                  <path 
                    d="M18.5 3.5L19 5L20.5 5.5L19 6L18.5 7.5L18 6L16.5 5.5L18 5L18.5 3.5Z" 
                    fill="white" 
                    className="animate-pulse origin-center"
                  />
                </svg>
              </div>
              <span className="font-black text-xl tracking-tighter text-gray-900 dark:text-white italic">TCG INVEST</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <Link to="/create" onClick={handleProtectedAction} className={`transition-colors flex items-center gap-1 text-sm font-medium ${isActive('/create') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}>
                <Camera className="w-5 h-5" />
                <span>賣卡區</span>
              </Link>
              <Link to="/create-want" onClick={handleProtectedAction} className={`transition-colors flex items-center gap-1 text-sm font-medium ${isActive('/create-want') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}>
                <Search className="w-5 h-5" />
                <span>徵卡區</span>
              </Link>
              <Link to="/articles" className={`transition-colors flex items-center gap-1 text-sm font-medium ${isActive('/article') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}>
                <BookOpen className="w-5 h-5" />
                <span>資訊</span>
              </Link>
              <Link to="/search" className={`transition-colors flex items-center gap-1 text-sm font-medium ${isActive('/search') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}>
                <Sparkles className="w-5 h-5" />
                <span>AI 助手</span>
              </Link>
              <Link to="/portfolio" className={`transition-colors flex items-center gap-1 text-sm font-medium ${isActive('/portfolio') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}>
                <BadgeDollarSign className="w-5 h-5" />
                <span>投資組合</span>
              </Link>
              <Link to="/chats" onClick={handleProtectedAction} className={`transition-colors flex items-center gap-1 text-sm font-medium ${isActive('/chat') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}>
                <MessageCircle className="w-5 h-5" />
                <span>訊息</span>
              </Link>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>
              
              {user && !user.isGuest ? (
                <div className="flex items-center gap-4">
                  <Link to="/profile" className="flex items-center gap-2 group">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 group-hover:border-blue-500 transition-colors" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 group-hover:border-blue-500 transition-colors">
                        <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors hidden lg:block">{user.displayName}</span>
                  </Link>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
                  <button 
                    onClick={logOut}
                    className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 text-sm font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden md:block">登出</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all active:scale-95"
                >
                  登入
                </Link>
              )}
            </div>

            {/* Mobile Top Right (Avatar / Login) */}
            <div className="flex sm:hidden items-center gap-3">
              {user && !user.isGuest ? (
                <div className="flex items-center gap-3">
                  <Link to="/profile" className="flex items-center">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </Link>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all active:scale-95"
                >
                  登入
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#050505]/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 pb-safe">
        <div className="flex justify-around items-center h-16 px-2 relative">
          <Link to="/search" className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive('/search') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
            <Search className={`w-6 h-6 mb-1 ${isActive('/search') ? 'fill-blue-50 dark:fill-blue-900/30' : ''}`} />
            <span className="text-[10px] font-medium">搜尋</span>
          </Link>
          <Link to="/favorites" onClick={handleProtectedAction} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive('/favorites') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
            <Heart className={`w-6 h-6 mb-1 ${isActive('/favorites') ? 'fill-blue-50 dark:fill-blue-900/30' : ''}`} />
            <span className="text-[10px] font-medium">最愛</span>
          </Link>
          
          {/* Center Pokeball Button */}
          <div className="w-full h-full flex justify-center items-center relative">
            <button 
              onClick={() => setShowCreateMenu(true)}
              className="absolute -top-5 w-14 h-14 bg-white dark:bg-[#0d0d0d] rounded-full border-4 border-gray-50 dark:border-[#050505] flex items-center justify-center shadow-lg text-red-500 hover:scale-105 transition-transform z-50"
            >
              <Plus className="w-8 h-8 stroke-[3]" />
            </button>
          </div>

          <Link to="/chats" onClick={handleProtectedAction} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive('/chats') || isActive('/chat') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
            <MessageCircle className={`w-6 h-6 mb-1 ${isActive('/chats') || isActive('/chat') ? 'fill-blue-50 dark:fill-blue-900/30' : ''}`} />
            <span className="text-[10px] font-medium">訊息</span>
          </Link>
          <Link to="/profile" onClick={handleProtectedAction} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive('/profile') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
            <UserIcon className={`w-6 h-6 mb-1 ${isActive('/profile') ? 'fill-blue-50 dark:fill-blue-900/30' : ''}`} />
            <span className="text-[10px] font-medium">我的</span>
          </Link>
        </div>
      </div>

      {/* Create Menu Popup */}
      <AnimatePresence>
        {showCreateMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateMenu(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 sm:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-24 left-4 right-4 z-50 sm:hidden"
            >
              <div className="bg-white dark:bg-[#0d0d0d] rounded-[2rem] p-6 shadow-2xl border border-gray-100 dark:border-white/10 relative overflow-hidden">
                <button 
                  onClick={() => setShowCreateMenu(false)}
                  className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">選擇發佈類型</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Link 
                    to="/create-want" 
                    onClick={(e) => { handleProtectedAction(e); setShowCreateMenu(false); }}
                    className="flex flex-col items-center justify-center p-6 bg-blue-500 dark:bg-blue-600 rounded-3xl text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-bold text-lg mb-1">徵卡區</span>
                    <span className="text-xs text-blue-100">發佈您的徵求</span>
                  </Link>
                  
                  <Link 
                    to="/create" 
                    onClick={(e) => { handleProtectedAction(e); setShowCreateMenu(false); }}
                    className="flex flex-col items-center justify-center p-6 bg-red-500 dark:bg-red-600 rounded-3xl text-white hover:bg-red-600 dark:hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-bold text-lg mb-1">上架賣卡</span>
                    <span className="text-xs text-red-100">拍下您的收藏</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
