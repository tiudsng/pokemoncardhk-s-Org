import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Info, ExternalLink, Tag, X } from 'lucide-react';

const data = [
  { name: 'Jan', price: 260 },
  { name: 'Jan 15', price: 255 },
  { name: 'Feb', price: 280 },
  { name: 'Feb 15', price: 320 },
  { name: 'Mar', price: 480 },
  { name: 'Mar 15', price: 430 },
];

export const PriceHistory: React.FC<{ currentPrice: number }> = ({ currentPrice }) => {
  const [activeTab, setActiveTab] = useState<'RAW' | 'GRADED' | 'POP'>('RAW');
  const [timeRange, setTimeRange] = useState('3M');

  const getTabData = () => {
    switch (activeTab) {
      case 'GRADED':
        return {
          price: 1889,
          change: '+HK$210',
          percent: '+12.5%',
          isUp: true
        };
      case 'POP':
        return {
          price: 150000,
          change: '-HK$18.32',
          percent: '-4.08%',
          isUp: false
        };
      default:
        return {
          price: currentPrice,
          change: '-HK$18.32',
          percent: '-4.08%',
          isUp: false
        };
    }
  };

  const currentTabData = getTabData();

  return (
    <div className="bg-white dark:bg-[#0d0d0d] rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 mt-8 sm:mt-12 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">價格走勢</h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 dark:bg-[#16161a] text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white/10">
                數據基於最近 90 天的市場成交記錄。
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">HK${currentTabData.price.toLocaleString()}</span>
            <div className={`flex items-center gap-1 font-bold text-xs sm:text-sm ${currentTabData.isUp ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {currentTabData.isUp ? <TrendingUp className="w-3 h-3 sm:w-4 h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 h-4" />}
              <span>{currentTabData.change} ({currentTabData.percent})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-50 dark:bg-white/5 p-1 rounded-2xl flex gap-1 mb-8 w-full sm:w-fit border border-gray-100 dark:border-white/10">
        {(['RAW', 'GRADED', 'POP'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black tracking-widest transition-all duration-300 ${
              activeTab === tab 
                ? 'bg-white dark:bg-[#16161a] text-blue-600 dark:text-blue-400 shadow-sm border-2 border-blue-600 dark:border-blue-500' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-2 border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'GRADED' && (
        <div className="flex items-center gap-2 mb-6">
          <div className="w-4 h-1 bg-cyan-400 rounded-full"></div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">Holofoil PSA 10</span>
          <X className="w-3 h-3 text-gray-400 dark:text-gray-500 cursor-pointer" />
        </div>
      )}

      {/* Chart */}
      <div className="h-[350px] w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activeTab === 'GRADED' ? [
            { name: 'Jan', price: 897 },
            { name: 'Jan 15', price: 950 },
            { name: 'Feb', price: 1200 },
            { name: 'Feb 15', price: 1350 },
            { name: 'Mar', price: 1889 },
            { name: 'Mar 15', price: 1750 },
          ] : data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.2} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
              dy={10}
            />
            <YAxis hide domain={activeTab === 'GRADED' ? [800, 2000] : [200, 500]} />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px 16px',
                backgroundColor: 'var(--tw-colors-gray-800)',
                color: 'white'
              }}
              labelStyle={{ fontWeight: 800, color: '#e2e8f0', marginBottom: '4px' }}
              itemStyle={{ fontWeight: 700, color: '#38bdf8' }}
              formatter={(value: number) => [`HK$${value}`, '價格']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#0ea5e9" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8 mb-12">
        {['1M', '3M', '6M', '12M'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-black transition-all ${
              timeRange === range
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 scale-110 shadow-lg'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {activeTab === 'GRADED' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-900 dark:text-white">PSA - Holofoil</h4>
          </div>
          
          <div className="grid grid-cols-5 border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden">
            {[
              { grade: '10', price: '$1.78K', pop: '26745', active: true },
              { grade: '9', price: '$506', pop: '45118' },
              { grade: '8.5', price: '$405', pop: '427' },
              { grade: '8', price: '$394', pop: '16350' },
              { grade: '7', price: '$301', pop: '2874' },
            ].map((item) => (
              <div 
                key={item.grade}
                className={`flex flex-col items-center justify-center py-4 border-r last:border-r-0 border-gray-100 dark:border-white/5 transition-colors ${
                  item.active ? 'bg-cyan-50/50 dark:bg-cyan-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <span className={`text-xs font-black mb-1 ${item.active ? 'text-cyan-700 dark:text-cyan-400' : 'text-gray-900 dark:text-gray-300'}`}>{item.grade}</span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">{item.price}</span>
                <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500">{item.pop}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-400">
            <div className="w-3 h-3 bg-cyan-400 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white dark:bg-gray-800 rounded-full"></div>
            </div>
            <span>Gem Rate: Holofoil (28.89%)</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
