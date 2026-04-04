import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Camera, AlignLeft, RefreshCw, ChevronLeft, Lock, Trophy, Star, Zap, Package, Heart, ShieldCheck } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User as UserType } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserType;
}

interface SpecialAvatar {
  id: string;
  name: string;
  style: string;
  seed: string;
  requirement: {
    type: 'transactions' | 'reviews' | 'rating' | 'followers';
    value: number;
    label: string;
  };
}

const specialAvatars: SpecialAvatar[] = [
  { id: 'rookie', name: '新手收藏家', style: 'avataaars', seed: 'Rookie', requirement: { type: 'transactions', value: 1, label: '完成 1 次交易' } },
  { id: 'trader', name: '交易達人', style: 'bottts', seed: 'Trader', requirement: { type: 'transactions', value: 10, label: '完成 10 次交易' } },
  { id: 'star', name: '人氣之星', style: 'lorelei', seed: 'Star', requirement: { type: 'followers', value: 20, label: '擁有 20 位追蹤者' } },
  { id: 'expert', name: '評鑑專家', style: 'pixel-art', seed: 'Expert', requirement: { type: 'reviews', value: 15, label: '獲得 15 則評價' } },
  { id: 'legend', name: '傳奇收藏家', style: 'notionists', seed: 'Legend', requirement: { type: 'transactions', value: 50, label: '完成 50 次交易' } },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, userData }) => {
  const [displayName, setDisplayName] = useState(userData.displayName || '');
  const [photoURL, setPhotoURL] = useState(userData.photoURL || '');
  const [bio, setBio] = useState(userData.bio || '');
  const [loading, setLoading] = useState(false);
  const [nameChanged, setNameChanged] = useState(!!userData.displayNameChanged);
  const [activeTab, setActiveTab] = useState<'basic' | 'avatars'>('basic');

  const avatarStyles = [
    'avataaars', 'bottts', 'pixel-art', 'adventurer', 'big-smile', 'lorelei', 'notionists', 'open-peeps'
  ];

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
    const newUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
    setPhotoURL(newUrl);
  };

  const predefinedAvatars = [
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=Milo`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Luna`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver`,
    `https://api.dicebear.com/7.x/big-smile/svg?seed=Zoe`,
    `https://api.dicebear.com/7.x/lorelei/svg?seed=Leo`,
    `https://api.dicebear.com/7.x/notionists/svg?seed=Maya`,
    `https://api.dicebear.com/7.x/open-peeps/svg?seed=Max`
  ];

  const getStatValue = (type: SpecialAvatar['requirement']['type']) => {
    switch (type) {
      case 'transactions': return userData.completedTransactions || 0;
      case 'reviews': return userData.totalReviews || 0;
      case 'rating': return userData.rating || 0;
      case 'followers': return userData.followersCount || 0;
      default: return 0;
    }
  };

  const isUnlocked = (avatar: SpecialAvatar) => {
    return getStatValue(avatar.requirement.type) >= avatar.requirement.value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName !== userData.displayName && nameChanged) {
      alert("顯示名稱只能修改一次。");
      return;
    }
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userData.uid);
      const updateData: any = {
        photoURL,
        bio
      };
      if (displayName !== userData.displayName) {
        updateData.displayName = displayName;
        updateData.displayNameChanged = true;
      }
      await updateDoc(userRef, updateData);
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("更新失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-100 dark:bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">個人化設定</h2>
                  <p className="text-sm text-gray-500 font-medium">打造您的專屬收藏家形象</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-8 pt-6 gap-4">
              <button 
                onClick={() => setActiveTab('basic')}
                className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'basic' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                基本資料
                {activeTab === 'basic' && <motion.div layoutId="tabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('avatars')}
                className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'avatars' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                解鎖頭像
                {activeTab === 'avatars' && <motion.div layoutId="tabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />}
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-8">
                {activeTab === 'basic' ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                      <div className="relative group/avatar">
                        <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white dark:border-black shadow-2xl bg-white dark:bg-[#1c1c1e] relative z-10">
                          <img 
                            src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.uid}`} 
                            alt="Avatar Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRandomAvatar}
                          className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-90 z-20"
                          title="隨機生成頭像"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex-1 w-full space-y-6">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">顯示名稱</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                              placeholder="您的暱稱"
                              required
                            />
                          </div>
                          {nameChanged && (
                            <p className="mt-2 text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              顯示名稱只能修改一次
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">個人簡介</label>
                          <div className="relative">
                            <AlignLeft className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                            <textarea
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium min-h-[120px] resize-none"
                              placeholder="向大家介紹一下你自己吧..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">快速選擇頭像</label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                        {predefinedAvatars.map((url, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setPhotoURL(url)}
                            className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 ${
                              photoURL === url 
                                ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                                : 'border-transparent bg-gray-50 dark:bg-white/5'
                            }`}
                          >
                            <img src={url} alt={`Avatar ${index}`} className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {specialAvatars.map((avatar) => {
                        const unlocked = isUnlocked(avatar);
                        const avatarUrl = `https://api.dicebear.com/7.x/${avatar.style}/svg?seed=${avatar.seed}`;
                        const progress = Math.min(100, (getStatValue(avatar.requirement.type) / avatar.requirement.value) * 100);

                        return (
                          <div 
                            key={avatar.id}
                            className={`p-4 rounded-3xl border transition-all relative overflow-hidden group ${
                              unlocked 
                                ? 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-blue-500/50 cursor-pointer' 
                                : 'bg-gray-100 dark:bg-gray-100 dark:bg-black/20 border-white/5 opacity-60'
                            }`}
                            onClick={() => unlocked && setPhotoURL(avatarUrl)}
                          >
                            <div className="flex items-center gap-4 relative z-10">
                              <div className="relative">
                                <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 ${photoURL === avatarUrl ? 'border-blue-500' : 'border-gray-200 dark:border-white/10'}`}>
                                  <img src={avatarUrl} alt={avatar.name} className={`w-full h-full object-cover ${!unlocked && 'grayscale blur-[2px]'}`}  referrerPolicy="no-referrer" />
                                </div>
                                {!unlocked && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 dark:bg-gray-100 dark:bg-black/40 rounded-2xl">
                                    <Lock className="w-6 h-6 text-gray-900 dark:text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white mb-1">{avatar.name}</h3>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                  {avatar.requirement.label}
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[8px] font-black text-gray-600">
                                    <span>進度</span>
                                    <span>{Math.floor(progress)}%</span>
                                  </div>
                                  <div className="h-1 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-1000 ${unlocked ? 'bg-green-500' : 'bg-blue-500'}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              {unlocked && photoURL === avatarUrl && (
                                <div className="p-2 rounded-full bg-blue-500 text-white">
                                  <Star className="w-3 h-3 fill-white" />
                                </div>
                              )}
                            </div>
                            
                            {/* Background Glow */}
                            {unlocked && (
                              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/10 blur-2xl rounded-full group-hover:bg-blue-500/20 transition-all" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">如何解鎖更多？</h4>
                        <p className="text-xs text-gray-500 font-medium">
                          持續在平台上交易、獲得好評或吸引追蹤者，即可解鎖這些稀有的動態頭像！
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-5 rounded-[1.5rem] font-black text-sm hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 shadow-2xl shadow-gray-900/10 dark:shadow-white/10 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        儲存並更新形象
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
