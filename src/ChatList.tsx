import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Chat } from './types';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MessageSquare, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ChatList: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const q = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const fetchedChats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chat[];
      
      // Sort by lastMessageAt locally if needed
      fetchedChats.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis() || a.createdAt?.toMillis() || 0;
        const timeB = b.lastMessageAt?.toMillis() || b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setChats(fetchedChats);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <MessageSquare className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            訊息
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
            繼續您與買家或賣家的對話。
          </p>
        </div>
        <button onClick={fetchChats} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-400">
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-[#0d0d0d] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
          <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">沒有進行中的對話</h3>
          <p className="text-gray-500 dark:text-gray-400">當您聯絡賣家時，您的訊息會顯示在這裡。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/chat/${chat.id}`} className="block">
                <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-md hover:border-gray-200 dark:hover:border-white/10 transition-all flex items-center gap-4 sm:gap-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#050505] flex-shrink-0 border border-gray-200 dark:border-white/10">
                    <img 
                      src={chat.listingImageUrl} 
                      alt={chat.listingTitle} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-4">
                        {chat.listingTitle}
                      </h3>
                      {(chat.lastMessageAt || chat.createdAt) && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow((chat.lastMessageAt || chat.createdAt).toDate(), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 truncate text-sm sm:text-base">
                      {chat.lastMessage || "開始對話..."}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
