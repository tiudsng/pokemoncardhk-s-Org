import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, Search, BookOpen, TrendingUp, Hash } from 'lucide-react';
import { getMarketInsights, getCardDetails, getCardDetailsByNumber, generateArticle, analyzeCardImage } from './services/geminiService';

export const AITestPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [set, setSet] = useState('');
  const [topic, setTopic] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async (type: string) => {
    setLoading(type);
    setResult(null);
    setError(null);
    try {
      let data;
      switch (type) {
        case 'market':
          data = await getMarketInsights(query || 'Pikachu VMAX');
          break;
        case 'details':
          data = await getCardDetails(query || 'Charizard');
          break;
        case 'number':
          data = await getCardDetailsByNumber(cardNumber || '151/165', set || '151');
          break;
        case 'article':
          data = await generateArticle(topic || '2024 Pokemon Card Investment');
          break;
        case 'chat':
          const chatRes = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: chatInput || '你好，請介紹一下你自己' }]
            })
          });
          if (!chatRes.ok) throw new Error(await chatRes.text());
          data = await chatRes.json();
          break;
      }
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pt-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600 rounded-2xl text-white">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">AI 功能測試</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">測試 Gemini API 的各項整合功能</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-800 dark:text-red-300 font-bold text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Market Insights Test */}
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
            <TrendingUp className="w-5 h-5" />
            <h3>市場分析測試</h3>
          </div>
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="輸入卡片名稱 (如: Pikachu VMAX)"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border-none text-sm font-bold"
          />
          <button 
            onClick={() => handleTest('market')}
            disabled={!!loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            {loading === 'market' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            測試市場分析
          </button>
        </div>

        {/* Card Details Test */}
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
            <Search className="w-5 h-5" />
            <h3>卡片詳情測試 (名稱)</h3>
          </div>
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="輸入卡片名稱 (如: Charizard)"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border-none text-sm font-bold"
          />
          <button 
            onClick={() => handleTest('details')}
            disabled={!!loading}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
          >
            {loading === 'details' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            測試詳情獲取
          </button>
        </div>

        {/* Card Number Test */}
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold">
            <Hash className="w-5 h-5" />
            <h3>卡片詳情測試 (卡號)</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="text" 
              value={cardNumber} 
              onChange={(e) => setCardNumber(e.target.value)} 
              placeholder="卡號 (如: 151/165)"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border-none text-sm font-bold"
            />
            <input 
              type="text" 
              value={set} 
              onChange={(e) => setSet(e.target.value)} 
              placeholder="系列 (如: 151)"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border-none text-sm font-bold"
            />
          </div>
          <button 
            onClick={() => handleTest('number')}
            disabled={!!loading}
            className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
          >
            {loading === 'number' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            測試卡號搜尋
          </button>
        </div>

        {/* Article Test */}
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
            <BookOpen className="w-5 h-5" />
            <h3>文章生成測試</h3>
          </div>
          <input 
            type="text" 
            value={topic} 
            onChange={(e) => setTopic(e.target.value)} 
            placeholder="輸入文章主題"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border-none text-sm font-bold"
          />
          <button 
            onClick={() => handleTest('article')}
            disabled={!!loading}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
          >
            {loading === 'article' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            測試文章生成
          </button>
        </div>

        {/* MiniMax Chat Test */}
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
            <Sparkles className="w-5 h-5" />
            <h3>MiniMax 對話測試</h3>
          </div>
          <input 
            type="text" 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)} 
            placeholder="輸入對話內容"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border-none text-sm font-bold"
          />
          <button 
            onClick={() => handleTest('chat')}
            disabled={!!loading}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
          >
            {loading === 'chat' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            測試 MiniMax 對話
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl overflow-auto max-h-[500px] font-mono text-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-blue-400 font-bold">測試結果:</h4>
            <button onClick={() => setResult(null)} className="text-gray-500 hover:text-white transition-colors">清除</button>
          </div>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </motion.div>
      )}
    </div>
  );
};
