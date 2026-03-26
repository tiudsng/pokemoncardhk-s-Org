import React from 'react';
import { Award } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const badges: Badge[] = [
  { id: 'top-seller', name: '頂級賣家', icon: <Award className="w-4 h-4" />, color: 'bg-amber-100 text-amber-800' },
  { id: 'fast-shipper', name: '極速出貨', icon: <Award className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800' },
  { id: 'trusted', name: '誠信交易', icon: <Award className="w-4 h-4" />, color: 'bg-green-100 text-green-800' },
];

export const UserBadges: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}
          title={badge.name}
        >
          {badge.icon}
          {badge.name}
        </div>
      ))}
    </div>
  );
};
