import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Flame, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

export const PriceRankingBoard = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'surging' | 'plunging'>('surging');

  return (
    <div className="mb-12 sm:mb-16 bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-4 sm:p-8 border border-gray-200 dark:border-white/5 shadow-xl dark:shadow-2xl transition-colors duration-300">
      {/* Tabs */}
      <div className="flex justify-center gap-2 sm:gap-4 mb-8">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'active' ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-500" />
          十大活躍
        </button>
        <button
          onClick={() => setActiveTab('surging')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'surging' ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-red-500" />
          十大爆升
        </button>
        <button
          onClick={() => setActiveTab('plunging')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'plunging' ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <TrendingDown className="w-4 h-4 text-blue-500" />
          十大爆跌
        </button>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2 mb-2 transition-colors duration-300">
          [ <Trophy className="w-6 h-6 text-yellow-500" /> 價格磅排行榜 ]
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">頭三名顯示 (Top 3 Focus)</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* NO.1 Card */}
        <div className="sm:col-span-2 relative bg-gray-50 dark:bg-black rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-white/5 flex gap-4 sm:gap-6 items-center shadow-lg transition-colors duration-300">
          <div className="absolute -top-6 -left-4 text-5xl z-10 drop-shadow-lg">👑</div>
          <div className="w-28 h-40 sm:w-40 sm:h-56 shrink-0 rounded-xl overflow-hidden bg-gray-200 dark:bg-[#1c1c1e] shadow-lg relative z-0">
            <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=300" alt="Charizard" className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
          </div>
          <div className="flex-grow flex flex-col justify-between h-full py-1">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">NO.1</h3>
                <div className="flex gap-1.5">
                  <span className="text-[9px] sm:text-[10px] bg-gray-900 dark:bg-black text-white px-1.5 py-0.5 rounded font-bold leading-tight text-center">SNKR<br/>DUNK</span>
                  <span className="text-[9px] sm:text-[10px] bg-white text-gray-900 px-1.5 py-0.5 rounded font-bold flex items-center border border-gray-200 dark:border-transparent shadow-sm">ebay</span>
                </div>
              </div>
              <p className="text-base sm:text-xl text-gray-800 dark:text-gray-200 font-medium leading-tight mb-1">MEGA Charizard X ex SAR<br/>[M2 110/080]</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Dynamic indicator <span className="text-red-500">(LD†)</span></p>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-green-500 dark:text-green-400 font-bold text-xl sm:text-3xl">+15.4%</span>
              <span className="text-gray-900 dark:text-white font-bold text-xl sm:text-3xl">/ HK$ 10,828</span>
              <span className="text-[10px] sm:text-xs bg-white text-gray-900 px-2 py-0.5 rounded-full font-bold ml-auto border border-gray-200 dark:border-transparent shadow-sm">ebay</span>
            </div>
          </div>
        </div>

        {/* NO.2 Card */}
        <div className="bg-gray-50 dark:bg-black rounded-3xl p-4 border border-gray-200 dark:border-white/5 flex gap-4 items-center shadow-md transition-colors duration-300">
          <div className="w-20 h-28 sm:w-24 sm:h-36 shrink-0 rounded-xl overflow-hidden bg-gray-200 dark:bg-[#1c1c1e] shadow-lg">
            <img src="https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&q=80&w=200" alt="Giratina" className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
          </div>
          <div className="flex-grow flex flex-col justify-between h-full py-1">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">NO.2</h3>
                <span className="text-[8px] sm:text-[9px] bg-gray-900 dark:bg-black text-white px-1.5 py-0.5 rounded font-bold leading-tight text-center">SNKR<br/>DUNK</span>
              </div>
              <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 font-medium leading-tight">Giratina V SA</p>
            </div>
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <span className="text-green-500 dark:text-green-400 font-bold text-base sm:text-lg">+12.1%</span>
              <span className="text-gray-900 dark:text-white font-bold text-base sm:text-lg">/ HK$8,950</span>
              <span className="text-[9px] sm:text-[10px] bg-white text-gray-900 px-1.5 py-0.5 rounded-full font-bold ml-auto border border-gray-200 dark:border-transparent shadow-sm">ebay</span>
            </div>
          </div>
        </div>

        {/* NO.3 Card */}
        <div className="bg-gray-50 dark:bg-black rounded-3xl p-4 border border-gray-200 dark:border-white/5 flex gap-4 items-center shadow-md transition-colors duration-300">
          <div className="w-20 h-28 sm:w-24 sm:h-36 shrink-0 rounded-xl overflow-hidden bg-gray-200 dark:bg-[#1c1c1e] shadow-lg">
            <img src="https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&q=80&w=200" alt="Umbreon" className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
          </div>
          <div className="flex-grow flex flex-col justify-between h-full py-1">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">NO.3</h3>
                <span className="text-[8px] sm:text-[9px] bg-gray-900 dark:bg-black text-white px-1.5 py-0.5 rounded font-bold leading-tight text-center">SNKR<br/>DUNK</span>
              </div>
              <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 font-medium leading-tight">Umbreon<br/>VMAX SA</p>
            </div>
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <span className="text-green-500 dark:text-green-400 font-bold text-base sm:text-lg">+10.7%</span>
              <span className="text-gray-900 dark:text-white font-bold text-base sm:text-lg">/ HK$13,500</span>
              <span className="text-[9px] sm:text-[10px] bg-white text-gray-900 px-1.5 py-0.5 rounded-full font-bold ml-auto border border-gray-200 dark:border-transparent shadow-sm">ebay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
