import React from 'react';
import { Listing } from '../types';
import { Filter } from 'lucide-react';

export interface FilterCriteria {
  minPrice: string;
  maxPrice: string;
  condition: string;
  cardType: string;
  rarity: string;
  attribute: string;
  language: string;
}

interface SearchFiltersProps {
  filters: FilterCriteria;
  setFilters: React.Dispatch<React.SetStateAction<FilterCriteria>>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, setFilters, isOpen, setIsOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="bg-white dark:bg-[#0d0d0d] p-6 rounded-2xl shadow-lg dark:shadow-none border border-gray-100 dark:border-white/10 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-colors duration-300">
      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">價格範圍</label>
        <div className="flex gap-2">
          <input type="number" placeholder="最低" value={filters.minPrice} onChange={e => setFilters(prev => ({...prev, minPrice: e.target.value}))} className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
          <input type="number" placeholder="最高" value={filters.maxPrice} onChange={e => setFilters(prev => ({...prev, maxPrice: e.target.value}))} className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">卡片狀態</label>
        <select value={filters.condition} onChange={e => setFilters(prev => ({...prev, condition: e.target.value}))} className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
          <option value="">全部</option>
          {['Mint', 'Near Mint', 'Excellent', 'Good', 'Lightly Played', 'Played', 'Poor'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">卡片類型</label>
        <select value={filters.cardType} onChange={e => setFilters(prev => ({...prev, cardType: e.target.value}))} className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
          <option value="">全部</option>
          {['RAW', 'PSA 10', 'PSA 9', 'PSA 8', 'BGS', 'CGC'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">稀有度</label>
        <select value={filters.rarity} onChange={e => setFilters(prev => ({...prev, rarity: e.target.value}))} className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
          <option value="">全部</option>
          {['UR', 'SAR', 'SR', 'SSR', 'HR', 'AR', 'C', 'U', 'R'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">屬性</label>
        <select value={filters.attribute} onChange={e => setFilters(prev => ({...prev, attribute: e.target.value}))} className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
          <option value="">全部</option>
          {['水', '火', '草', '電', '超', '鬥', '惡', '鋼', '妖', '龍', '無'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">語言</label>
        <select value={filters.language} onChange={e => setFilters(prev => ({...prev, language: e.target.value}))} className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
          <option value="">全部</option>
          {['日文', '英文', '中文'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div className="flex items-end">
        <button onClick={() => setFilters({minPrice: '', maxPrice: '', condition: '', cardType: '', rarity: '', attribute: '', language: ''})} className="w-full py-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">重置</button>
      </div>
    </div>
  );
};
