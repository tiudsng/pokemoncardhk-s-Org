import React from 'react';
import { ShieldCheck, Zap, Search, Package, Award, AlertCircle } from 'lucide-react';

export interface SellerData {
  uid: string;
  display_name: string;
  identity_tier: 'gold' | 'silver' | 'bronze';
  rating_pct: number;
  total_trades: number;
  cancel_rate_90d: number;
  visual_tags: string[];
  join_year: number;
  is_verified: boolean;
}

const TAG_MAP: Record<string, { icon: React.ElementType; label: string }> = {
  fast_reply: { icon: Zap, label: '回覆快' },
  accurate_desc: { icon: Search, label: '描述準' },
  good_packaging: { icon: Package, label: '包裝好' },
};

const TIER_CONFIG = {
  gold: {
    icon: Award,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    label: 'Gold Seller',
  },
  silver: {
    icon: Award,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-100',
    label: 'Silver Seller',
  },
  bronze: {
    icon: Award,
    color: 'text-stone-400',
    bg: 'bg-stone-50',
    border: 'border-stone-100',
    label: 'Bronze Seller',
  },
};

export function SellerProfile({ seller }: { seller: SellerData }) {
  const tier = TIER_CONFIG[seller.identity_tier] || TIER_CONFIG.bronze;
  const TierIcon = tier.icon;

  return (
    <div className="group relative flex flex-col p-6 bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out w-full max-w-sm">
      
      {/* Header: Avatar & Name */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center border border-gray-200/50 shadow-inner">
            <span className="text-lg font-medium tracking-tight text-gray-700">
              {seller.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
          {seller.is_verified && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px]">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-gray-900 tracking-tight leading-tight flex items-center gap-2">
            {seller.display_name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color} ${tier.border}`}>
              <TierIcon className="w-3 h-3" />
              {tier.label}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              Since {seller.join_year}
            </span>
          </div>
        </div>
      </div>

      {/* Core Metrics: Clean & Minimal */}
      <div className="flex items-center gap-6 mb-5 px-1">
        <div className="flex flex-col">
          <span className="text-2xl font-light tracking-tight text-gray-900">
            {seller.rating_pct}%
          </span>
          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
            好評率
          </span>
        </div>
        <div className="w-px h-8 bg-gray-100"></div>
        <div className="flex flex-col">
          <span className="text-2xl font-light tracking-tight text-gray-900">
            {seller.total_trades}
          </span>
          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
            成交數
          </span>
        </div>
      </div>

      {/* Visual Tags & Warnings */}
      <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-gray-50">
        {seller.visual_tags.map((tagKey) => {
          const tag = TAG_MAP[tagKey];
          if (!tag) return null;
          const TagIcon = tag.icon;
          return (
            <span 
              key={tagKey} 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-xs font-medium border border-gray-100/50"
            >
              <TagIcon className="w-3.5 h-3.5 text-gray-400" />
              {tag.label}
            </span>
          );
        })}

        {/* High Cancel Rate Warning */}
        {seller.cancel_rate_90d > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100 ml-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            近期棄單
          </span>
        )}
      </div>
    </div>
  );
}
