import React, { useState } from 'react';
import { Award, Zap, Star, Package, Heart, ShieldCheck, Lock, Info, ChevronRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

interface BadgeRequirement {
  type: 'transactions' | 'reviews' | 'listings' | 'rating' | 'followers';
  value: number;
  label: string;
}

interface BadgeLevel {
  level: number;
  name: string;
  requirement: BadgeRequirement;
  color: string;
  icon: React.ReactNode;
}

interface BadgeDefinition {
  id: string;
  title: string;
  levels: BadgeLevel[];
}

const badgeDefinitions: BadgeDefinition[] = [
  {
    id: 'transaction-master',
    title: '交易大師',
    levels: [
      { level: 1, name: '初級商人', requirement: { type: 'transactions', value: 5, label: '完成 5 次交易' }, color: 'from-blue-400 to-blue-600', icon: <Zap className="w-4 h-4" /> },
      { level: 2, name: '資深商人', requirement: { type: 'transactions', value: 20, label: '完成 20 次交易' }, color: 'from-purple-400 to-purple-600', icon: <Zap className="w-4 h-4" /> },
      { level: 3, name: '富甲天下', requirement: { type: 'transactions', value: 50, label: '完成 50 次交易' }, color: 'from-amber-400 to-amber-600', icon: <Zap className="w-4 h-4" /> },
    ]
  },
  {
    id: 'review-star',
    title: '口碑之星',
    levels: [
      { level: 1, name: '好評如潮', requirement: { type: 'reviews', value: 10, label: '獲得 10 則評價' }, color: 'from-green-400 to-green-600', icon: <Star className="w-4 h-4" /> },
      { level: 2, name: '信譽卓著', requirement: { type: 'reviews', value: 50, label: '獲得 50 則評價' }, color: 'from-emerald-400 to-emerald-600', icon: <Star className="w-4 h-4" /> },
    ]
  },
  {
    id: 'collector',
    title: '收藏專家',
    levels: [
      { level: 1, name: '收藏新手', requirement: { type: 'listings', value: 10, label: '上架 10 件商品' }, color: 'from-indigo-400 to-indigo-600', icon: <Package className="w-4 h-4" /> },
      { level: 2, name: '展示櫃專家', requirement: { type: 'listings', value: 50, label: '上架 50 件商品' }, color: 'from-rose-400 to-rose-600', icon: <Package className="w-4 h-4" /> },
    ]
  },
  {
    id: 'influencer',
    title: '社群領袖',
    levels: [
      { level: 1, name: '嶄露頭角', requirement: { type: 'followers', value: 50, label: '擁有 50 位追蹤者' }, color: 'from-pink-400 to-pink-600', icon: <Heart className="w-4 h-4" /> },
      { level: 2, name: '萬眾矚目', requirement: { type: 'followers', value: 200, label: '擁有 200 位追蹤者' }, color: 'from-red-400 to-red-600', icon: <Heart className="w-4 h-4" /> },
    ]
  }
];

interface UserBadgesProps {
  userData: User;
}

export const UserBadges: React.FC<UserBadgesProps> = ({ userData }) => {
  const [showAll, setShowAll] = useState(false);

  const getStatValue = (type: BadgeRequirement['type']) => {
    switch (type) {
      case 'transactions': return userData.completedTransactions || 0;
      case 'reviews': return userData.totalReviews || 0;
      case 'listings': return 0; // We don't have this in User type yet, but we could pass it or fetch it
      case 'rating': return userData.rating || 0;
      case 'followers': return userData.followersCount || 0;
      default: return 0;
    }
  };

  const getUnlockedLevels = (badge: BadgeDefinition) => {
    return badge.levels.filter(level => getStatValue(level.requirement.type) >= level.requirement.value);
  };

  const unlockedBadges = badgeDefinitions.map(badge => {
    const unlocked = getUnlockedLevels(badge);
    if (unlocked.length === 0) return null;
    return {
      ...badge,
      currentLevel: unlocked[unlocked.length - 1],
      nextLevel: badge.levels[unlocked.length]
    };
  }).filter(Boolean);

  return (
    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
      {unlockedBadges.map((badge: any) => (
        <motion.div
          key={badge.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r ${badge.currentLevel.color} shadow-lg shadow-black/20 cursor-help group relative`}
        >
          {badge.currentLevel.icon}
          {badge.currentLevel.name}
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="text-xs font-black text-gray-900 dark:text-white mb-1">{badge.title} - LV.{badge.currentLevel.level}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">{badge.currentLevel.requirement.label}</div>
            {badge.nextLevel && (
              <div className="pt-2 border-t border-white/5">
                <div className="text-[9px] font-black text-blue-400 uppercase mb-1">下一等級</div>
                <div className="text-[10px] text-gray-500">{badge.nextLevel.name}: {badge.nextLevel.requirement.label}</div>
                {/* Progress Bar */}
                <div className="mt-1.5 h-1 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${Math.min(100, (getStatValue(badge.nextLevel.requirement.type) / badge.nextLevel.requirement.value) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}

      <button 
        onClick={() => setShowAll(true)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white/10 transition-all"
      >
        <Trophy className="w-3.5 h-3.5" />
        勳章成就
      </button>

      {/* Badge Collection Modal */}
      <AnimatePresence>
        {showAll && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAll(false)}
              className="absolute inset-0 bg-gray-900/80 dark:bg-gray-100 dark:bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">成就與勳章</h2>
                  <p className="text-sm text-gray-500 font-medium">解鎖更多成就，提升您的收藏家等級</p>
                </div>
                <button 
                  onClick={() => setShowAll(false)}
                  className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6 rotate-90" />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {badgeDefinitions.map(badge => {
                    const unlocked = getUnlockedLevels(badge);
                    const currentLevel = unlocked.length > 0 ? badge.levels[unlocked.length - 1] : null;
                    const nextLevel = badge.levels[unlocked.length];

                    return (
                      <div key={badge.id} className="p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-white/5 relative overflow-hidden group">
                        <div className="flex items-start gap-4 relative z-10">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${currentLevel ? `bg-gradient-to-br ${currentLevel.color} text-white` : 'bg-gray-50 dark:bg-white/5 text-gray-700'}`}>
                            {currentLevel ? currentLevel.icon : <Lock className="w-6 h-6" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">{badge.title}</h3>
                            <div className="text-xs font-bold text-gray-500 mb-3">
                              {currentLevel ? `LV.${currentLevel.level} ${currentLevel.name}` : '尚未解鎖'}
                            </div>
                            
                            {nextLevel && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                  <span className="text-blue-400">下一級: {nextLevel.name}</span>
                                  <span className="text-gray-500">{getStatValue(nextLevel.requirement.type)} / {nextLevel.requirement.value}</span>
                                </div>
                                <div className="h-1.5 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (getStatValue(nextLevel.requirement.type) / nextLevel.requirement.value) * 100)}%` }}
                                    className="h-full bg-blue-500"
                                  />
                                </div>
                                <p className="text-[10px] text-gray-500 italic">條件: {nextLevel.requirement.label}</p>
                              </div>
                            )}
                            
                            {!nextLevel && currentLevel && (
                              <div className="flex items-center gap-2 text-amber-500">
                                <Trophy className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">已達成最高等級</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Background Decoration */}
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity ${currentLevel ? 'text-gray-900 dark:text-white' : 'text-gray-700'}`}>
                          {badge.levels[0].icon}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-8 bg-gray-50 dark:bg-white/5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Info className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium max-w-xs">
                    完成更多交易、獲得好評或上架商品來解鎖這些稀有勳章！
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
