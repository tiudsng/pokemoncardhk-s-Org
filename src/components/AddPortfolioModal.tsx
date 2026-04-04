import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, DollarSign, Calendar, Tag, Info, Sparkles, Loader2, Image as ImageIcon, Hash, Layers } from 'lucide-react';
import { getCardDetails, getCardDetailsByNumber } from '../services/geminiService';
import { PortfolioItem } from '../types';

interface AddPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newItem: PortfolioItem) => Promise<void>;
}

export const AddPortfolioModal: React.FC<AddPortfolioModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [acquiredAt, setAcquiredAt] = useState(new Date().toISOString().split('T')[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [set, setSet] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isLookingUpNumber, setIsLookingUpNumber] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAILookup = async () => {
    if (!title) return;
    setIsLookingUp(true);
    setAiError(null);
    try {
      const details = await getCardDetails(title);
      if (details) {
        if (details.estimatedPrice) {
          setPurchasePrice(details.estimatedPrice.toString());
        }
        if (details.imageUrl) {
          setImageUrl(details.imageUrl);
        }
        if (details.cardNumber) {
          setCardNumber(details.cardNumber);
        }
        if (details.set) {
          setSet(details.set);
        }
      } else {
        setAiError("無法獲取卡片資訊，請檢查 API Key 或稍後再試。");
      }
    } catch (err) {
      console.error('AI Lookup error:', err);
      setAiError("AI 查詢出錯，請稍後再試。");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleNumberLookup = async () => {
    if (!cardNumber) return;
    setIsLookingUpNumber(true);
    setAiError(null);
    try {
      const details = await getCardDetailsByNumber(cardNumber, set);
      if (details) {
        if (details.title) setTitle(details.title);
        if (details.estimatedPrice) setPurchasePrice(details.estimatedPrice.toString());
        if (details.imageUrl) setImageUrl(details.imageUrl);
        if (details.set) setSet(details.set);
      } else {
        setAiError("無法根據卡號獲取資訊，請檢查 API Key 或稍後再試。");
      }
    } catch (err) {
      console.error('AI Number Lookup error:', err);
      setAiError("AI 查詢出錯，請稍後再試。");
    } finally {
      setIsLookingUpNumber(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const newItem: PortfolioItem = {
        id: Math.random().toString(36).substring(2, 15),
        title,
        purchasePrice: (parseFloat(purchasePrice) || 0) / 7.8,
        acquiredAt: new Date(acquiredAt),
        imageUrl: imageUrl || 'https://picsum.photos/seed/pokemon/400/600',
        cardNumber,
        set
      };
      await onAdd(newItem);
      // Reset form
      setTitle('');
      setPurchasePrice('');
      setAcquiredAt(new Date().toISOString().split('T')[0]);
      setImageUrl('');
      setCardNumber('');
      setSet('');
      onClose();
    } catch (error) {
      console.error("Error adding portfolio item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5"
          >
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">新增收藏卡片</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">將新卡片加入您的投資組合</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {aiError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-red-100 dark:bg-red-900/40 rounded-full">
                    <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-800 dark:text-red-300 leading-relaxed">
                      {aiError}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2 ml-1">
                      <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">卡片名稱</label>
                      <button
                        type="button"
                        onClick={handleAILookup}
                        disabled={isLookingUp || !title}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
                      >
                        {isLookingUp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        AI 獲取資訊
                      </button>
                    </div>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-red-500 transition-all"
                        placeholder="輸入卡片名稱"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2 ml-1">
                        <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">卡號</label>
                        <button
                          type="button"
                          onClick={handleNumberLookup}
                          disabled={isLookingUpNumber || !cardNumber}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
                        >
                          {isLookingUpNumber ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          AI 搜尋
                        </button>
                      </div>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-red-500 transition-all"
                          placeholder="例如：201/165"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">系列</label>
                      <div className="relative">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={set}
                          onChange={(e) => setSet(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-red-500 transition-all"
                          placeholder="例如：151 SV2a"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">入手價格 (HK$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-red-500 transition-all"
                        placeholder="0.00"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">入手日期</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={acquiredAt}
                        onChange={(e) => setAcquiredAt(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-red-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">圖片網址 (可選)</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-red-500 transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                    您可以手動輸入資訊，或使用 AI 自動獲取卡片的市場估價與圖片。
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-gray-900/20 dark:shadow-none"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    新增至投資組合
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
