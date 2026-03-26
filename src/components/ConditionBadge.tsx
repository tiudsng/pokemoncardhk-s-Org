import React from 'react';

interface ConditionBadgeProps {
  condition: string;
  cardType?: string;
  title: string;
  className?: string;
}

export const ConditionBadge: React.FC<ConditionBadgeProps> = ({ condition, cardType, title, className = "" }) => {
  const isPSA10 = cardType === 'PSA 10';
  const isPSA9 = cardType === 'PSA 9';
  const isPSA8 = cardType === 'PSA 8';
  const isBGS = cardType === 'BGS';
  const isCGC = cardType === 'CGC';
  const isRAW = cardType === 'RAW';
  
  if (isPSA10 || isPSA9 || isPSA8) {
    const grade = isPSA10 ? '10' : isPSA9 ? '9' : '8';
    return (
      <div className={`flex items-center overflow-hidden rounded-full border border-red-500/30 shadow-[0_2px_8px_-2px_rgba(223,30,38,0.3)] h-7 sm:h-8 bg-white dark:bg-[#0d0d0d] ${className}`}>
        <div className="bg-[#df1e26] px-2.5 sm:px-3 h-full flex items-center">
          <span className="text-[9px] sm:text-[11px] font-black text-white tracking-tighter leading-none">PSA</span>
        </div>
        <div className="pl-2 pr-2.5 sm:pl-2.5 sm:pr-4 h-full flex items-center">
          <span className="text-[11px] sm:text-[14px] font-black text-[#df1e26] dark:text-red-500 leading-none">{grade}</span>
        </div>
      </div>
    );
  }

  if (isBGS) {
    return (
      <div className={`flex items-center overflow-hidden rounded-full border border-blue-500/30 shadow-[0_2px_8px_-2px_rgba(30,58,138,0.3)] h-7 sm:h-8 bg-white dark:bg-[#0d0d0d] ${className}`}>
        <div className="bg-blue-900 dark:bg-blue-800 px-2.5 sm:px-3 h-full flex items-center">
          <span className="text-[9px] sm:text-[11px] font-black text-white tracking-tighter leading-none">BGS</span>
        </div>
        <div className="pl-2 pr-2.5 sm:pl-2.5 sm:pr-4 h-full flex items-center">
          <span className="text-[11px] sm:text-[14px] font-black text-blue-900 dark:text-blue-400 leading-none">GRADED</span>
        </div>
      </div>
    );
  }

  if (isCGC) {
    return (
      <div className={`flex items-center overflow-hidden rounded-full border border-cyan-500/30 shadow-[0_2px_8px_-2px_rgba(8,145,178,0.3)] h-7 sm:h-8 bg-white dark:bg-[#0d0d0d] ${className}`}>
        <div className="bg-cyan-600 dark:bg-cyan-700 px-2.5 sm:px-3 h-full flex items-center">
          <span className="text-[9px] sm:text-[11px] font-black text-white tracking-tighter leading-none">CGC</span>
        </div>
        <div className="pl-2 pr-2.5 sm:pl-2.5 sm:pr-4 h-full flex items-center">
          <span className="text-[11px] sm:text-[14px] font-black text-cyan-600 dark:text-cyan-400 leading-none">GRADED</span>
        </div>
      </div>
    );
  }

  const displayCondition = isRAW ? 'RAW卡' : (condition === 'Mint' ? '美品' : condition);

  return (
    <div className={`bg-white/95 dark:bg-[#0d0d0d]/80 backdrop-blur-md px-3 py-1 sm:px-5 sm:py-2 rounded-full text-[11px] sm:text-[13px] font-black text-gray-900 dark:text-white shadow-md dark:shadow-none border border-gray-100/50 dark:border-white/10 ${className}`}>
      {displayCondition}
    </div>
  );
};
