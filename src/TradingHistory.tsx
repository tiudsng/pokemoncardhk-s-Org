import React from 'react';
import { motion } from 'motion/react';

interface Trade {
  id: string;
  avatar: string;
  time: string;
  condition: string;
  price: number;
}

const mockTrades: Trade[] = [
  { id: '1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', time: '1 hour ago', condition: 'PSA 8 or under', price: 246 },
  { id: '2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', time: '1 hour ago', condition: 'PSA 8 or under', price: 178 },
  { id: '3', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam', time: '6 hours ago', condition: 'PSA 10', price: 3702 },
  { id: '4', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo', time: '11 hours ago', condition: 'A', price: 1146 },
  { id: '5', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Toby', time: '1 day ago', condition: 'A', price: 1965 },
];

export const TradingHistory: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#0d0d0d] rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 mt-8 sm:mt-12 overflow-hidden transition-colors duration-300">
      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Trading History</h3>
      
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[320px]">
          <thead>
            <tr className="text-left">
              <th className="pb-6 px-4 font-medium text-gray-400 dark:text-gray-500 text-sm sm:text-base uppercase tracking-wider">date</th>
              <th className="pb-6 px-4 font-medium text-gray-400 dark:text-gray-500 text-sm sm:text-base uppercase tracking-wider">condition</th>
              <th className="pb-6 px-4 font-medium text-gray-400 dark:text-gray-500 text-sm sm:text-base uppercase tracking-wider text-right">price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
            {mockTrades.map((trade, index) => (
              <motion.tr 
                key={trade.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`${index % 2 === 0 ? '' : 'bg-gray-50/30 dark:bg-white/5'} transition-colors hover:bg-gray-100/50 dark:hover:bg-white/10`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={trade.avatar} 
                      alt="avatar" 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-100 dark:border-white/10 shadow-sm"
                    />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap font-medium">{trade.time}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{trade.condition}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">HK ${trade.price.toLocaleString()}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
