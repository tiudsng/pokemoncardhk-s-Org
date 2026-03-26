import React from 'react';
import { Award, Star, ShieldCheck } from 'lucide-react';

interface SellerBadgeProps {
  transactions: number;
  rating: number;
  isProfessional: boolean;
  className?: string;
}

export const SellerBadge: React.FC<SellerBadgeProps> = ({ transactions, rating, isProfessional, className = '' }) => {
  if (isProfessional) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800/50 ${className}`}>
        <Award className="w-3.5 h-3.5" />
        <span>專業賣家</span>
      </div>
    );
  }

  if (transactions >= 50 && rating >= 4.8) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold border border-yellow-200 dark:border-yellow-800/50 ${className}`}>
        <Star className="w-3.5 h-3.5" />
        <span>金牌賣家</span>
      </div>
    );
  }

  if (transactions >= 10 && rating >= 4.5) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-200 dark:border-white/10 ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>資深賣家</span>
      </div>
    );
  }

  return null;
};
