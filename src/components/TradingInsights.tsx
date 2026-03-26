import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Listing } from '../types';

interface TradingInsightsProps {
  listings: Listing[];
}

export const TradingInsights: React.FC<TradingInsightsProps> = ({ listings }) => {
  // Process data for the chart: count listings per month
  const data = React.useMemo(() => {
    const counts: Record<string, number> = {};
    listings.forEach(l => {
      const date = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
      const month = date.toLocaleString('default', { month: 'short' });
      counts[month] = (counts[month] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [listings]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#0d0d0d] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">近期上架趨勢</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: '#f3f4f6' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
