import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, Loader2, Search, TrendingUp, BookOpen, Camera, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  cardData?: any;
}

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是你的 TCG 專家助手。我可以幫你查詢卡片價格、分析市場趨勢，或者協助你建立買賣貼文。你想聊聊哪張卡片？',
      timestamp: new Date(),
      suggestions: ['查詢噴火龍價格', '分析最近市場趨勢', '幫我寫一篇收藏指南', '如何辨別真假卡？']
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })).concat({ role: 'user', content: text })
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      const data = await response.json();
      const responseText = data.content || "抱歉，我現在無法回答。";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        suggestions: ['更多詳情', '查詢其他卡片', '建立徵卡貼文']
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.message?.includes("API Key is missing") 
          ? '請先在設定中配置 MiniMax API Key。' 
          : '抱歉，我現在遇到了一些技術問題。請稍後再試，或者檢查您的網路連接。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            AI 專家助手
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">您的個人 TCG 顧問與市場分析師</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-black bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <img src={`https://picsum.photos/seed/user${i}/32/32`} alt="user" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
          <span className="text-xs font-bold text-gray-400">正在與 1,240 位玩家交流</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-grow bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-blue-500/5 flex flex-col overflow-hidden relative">
        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-white/5 text-blue-600 dark:text-blue-400'
                }`}>
                  {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className="space-y-2">
                  <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none'
                  }`}>
                    {message.content}
                  </div>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(suggestion)}
                          className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <span className="text-[10px] font-bold text-gray-400 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-[1.5rem] rounded-tl-none">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5">
          <div className="flex gap-3">
            <div className="flex-grow relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="輸入您的問題..."
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-xl shadow-blue-600/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-6">
            <Link to="/create" className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-500 transition-colors">
              <PlusCircle className="w-4 h-4" />
              建立賣卡貼文
            </Link>
            <Link to="/create-want" className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-500 transition-colors">
              <Sparkles className="w-4 h-4" />
              建立徵卡貼文
            </Link>
            <Link to="/search" className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-500 transition-colors">
              <Search className="w-4 h-4" />
              搜尋卡片
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Tools */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <TrendingUp className="w-8 h-8 text-green-500 mb-4" />
          <h3 className="font-black text-gray-900 dark:text-white mb-2">市場趨勢</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">獲取最新的卡片價格波動與投資回報分析。</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <BookOpen className="w-8 h-8 text-blue-500 mb-4" />
          <h3 className="font-black text-gray-900 dark:text-white mb-2">收藏百科</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">查詢所有世代的卡片詳情、稀有度與發行背景。</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <Sparkles className="w-8 h-8 text-purple-500 mb-4" />
          <h3 className="font-black text-gray-900 dark:text-white mb-2">智能估價</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">上傳照片，讓 AI 幫您初步評估卡片品相與市場價值。</p>
        </div>
      </div>
    </div>
  );
};
