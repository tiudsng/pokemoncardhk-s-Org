import React from 'react';
import { SellerProfile, SellerData } from './components/SellerProfile';

const MOCK_SELLERS: SellerData[] = [
  {
    uid: 'user_001',
    display_name: 'Kelvin_Lau',
    identity_tier: 'gold',
    rating_pct: 100,
    total_trades: 245,
    cancel_rate_90d: 0,
    visual_tags: ['fast_reply', 'accurate_desc', 'good_packaging'],
    join_year: 2024,
    is_verified: true,
  },
  {
    uid: 'user_002',
    display_name: '呀輝',
    identity_tier: 'silver',
    rating_pct: 97,
    total_trades: 42,
    cancel_rate_90d: 0,
    visual_tags: ['fast_reply'],
    join_year: 2024,
    is_verified: true,
  },
  {
    uid: 'user_003',
    display_name: 'Jason_720',
    identity_tier: 'bronze',
    rating_pct: 100,
    total_trades: 8,
    cancel_rate_90d: 5, // Triggers warning
    visual_tags: [],
    join_year: 2025,
    is_verified: false,
  },
];

export function SellerProfileDemo() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] p-8 font-sans antialiased text-gray-900 flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-3">
            Seller Trust Profiles
          </h1>
          <p className="text-gray-500 text-lg font-medium tracking-tight">
            TCG INVEST Identity System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 place-items-center">
          {MOCK_SELLERS.map((seller) => (
            <SellerProfile key={seller.uid} seller={seller} />
          ))}
        </div>
      </div>
    </div>
  );
}
