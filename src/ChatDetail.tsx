import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Chat, Message } from './types';
import { useAuth } from './AuthContext';
import { motion } from 'motion/react';
import { Send, ArrowLeft, Image as ImageIcon, MessageSquare, CheckCircle2, Star, DollarSign, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ReviewModal } from './components/ReviewModal';

export const ChatDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState<Chat | null>(null);
  const [listing, setListing] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isMarkingSold, setIsMarkingSold] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!id || !user || user.isGuest) {
      if (!user || user.isGuest) navigate('/auth');
      return;
    }

    const chatRef = doc(db, 'chats', id);
    const unsubscribeChat = onSnapshot(chatRef, async (chatSnap) => {
      if (chatSnap.exists()) {
        const chatData = { id: chatSnap.id, ...chatSnap.data() } as Chat;
        setChat(chatData);
      }
    });

    // Fetch listing status once
    const fetchListing = async () => {
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const chatData = chatSnap.data() as Chat;
        const listingRef = doc(db, 'listings', chatData.listingId);
        const listingSnap = await getDoc(listingRef);
        if (listingSnap.exists()) {
          setListing({ id: listingSnap.id, ...listingSnap.data() });
        }
      }
    };
    fetchListing();

    const q = query(
      collection(db, `chats/${id}/messages`),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(fetchedMessages);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeChat();
      unsubscribe();
    };
  }, [id, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id || !chat) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Add message
      await addDoc(collection(db, `chats/${id}/messages`), {
        chatId: id,
        senderId: user.uid,
        text: messageText,
        createdAt: serverTimestamp(),
      });

      // Update chat last message
      await updateDoc(doc(db, 'chats', id), {
        lastMessage: messageText,
        lastMessageAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("發送訊息失敗。");
    }
  };

  const handleMarkAsSold = async () => {
    if (!chat || !listing || !user || isMarkingSold) return;
    
    const otherParticipantId = chat.participantIds.find(pid => pid !== user.uid);
    if (!otherParticipantId) return;

    if (!window.confirm('確定要將此卡片標記為已售出給這位買家嗎？')) return;

    setIsMarkingSold(true);
    try {
      const listingRef = doc(db, 'listings', listing.id);
      await updateDoc(listingRef, {
        status: 'sold',
        buyerId: otherParticipantId
      });
      
      // Add a system message to the chat
      await addDoc(collection(db, `chats/${id}/messages`), {
        chatId: id,
        senderId: 'system',
        text: '🎉 交易已完成！買家現在可以為賣家評分。',
        createdAt: serverTimestamp(),
      });

      setListing({ ...listing, status: 'sold', buyerId: otherParticipantId });
    } catch (error) {
      console.error("Error marking as sold:", error);
      alert("更新狀態失敗。");
    } finally {
      setIsMarkingSold(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="pt-32 text-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">找不到對話</h2>
      </div>
    );
  }

  const isSeller = chat && user && listing && user.uid === listing.sellerId;
  const isBuyer = chat && user && listing && user.uid !== listing.sellerId;
  const isSoldToMe = isBuyer && listing.status === 'sold' && listing.buyerId === user.uid;

  const otherUserId = chat.participantIds.find(id => id !== user?.uid);

  return (
    <div className="pt-16 flex flex-col h-[100dvh] bg-[var(--bg)] max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-4 py-3 flex items-center gap-4 sticky top-16 z-30 shadow-sm dark:shadow-none">
        <Link to="/chats" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-400">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <Link to={`/listing/${chat.listingId}`} className="flex items-center gap-3 flex-grow min-w-0">
          <img 
            src={chat.listingImageUrl} 
            alt={chat.listingTitle} 
            className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-white/10 flex-shrink-0"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="truncate">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{chat.listingTitle}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">查看卡片詳情</p>
          </div>
        </Link>

        {otherUserId && (
          <Link 
            to={`/profile/${otherUserId}`}
            className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-600 dark:text-gray-300 flex items-center gap-2"
            title="查看對方個人檔案"
          >
            <UserIcon className="w-5 h-5" />
          </Link>
        )}
        
        {/* Transaction Actions */}
        <div className="flex-shrink-0">
          {isSeller && listing.status !== 'sold' && (
            <button
              onClick={handleMarkAsSold}
              disabled={isMarkingSold}
              className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-green-600/20 disabled:opacity-50"
            >
              {isMarkingSold ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">標記為已售出</span>
                  <span className="sm:hidden">已售出</span>
                </>
              )}
            </button>
          )}
          
          {isSoldToMe && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>評價賣家</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">開始對話</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">打個招呼並詢問關於這張卡片的事吧！</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user.uid;
            const isSystem = msg.senderId === 'system';
            const showTime = index === 0 || (msg.createdAt?.toMillis() - messages[index-1].createdAt?.toMillis() > 300000); // 5 mins
            
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 px-4 py-2 rounded-full text-xs font-bold border border-amber-100 dark:border-amber-800/30 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {showTime && msg.createdAt && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-2 px-2">
                    {formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true })}
                  </span>
                )}
                <div 
                  className={`max-w-[75%] sm:max-w-[60%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm dark:shadow-none ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-white border border-gray-100 dark:border-white/5 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-white/5 p-4 pb-safe">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-grow relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="輸入訊息..."
              className="w-full bg-gray-100 dark:bg-black border-transparent rounded-2xl py-3 pl-4 pr-12 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-[#1c1c1e] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all resize-none outline-none overflow-hidden placeholder-gray-400 dark:placeholder-gray-500"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-sm active:scale-95"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>

      {/* Review Modal */}
      {listing && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          sellerId={listing.sellerId}
          sellerName={listing.sellerName}
          listingId={listing.id}
          listingTitle={listing.title}
          onSuccess={() => {
            // Maybe add a success message or update UI
          }}
        />
      )}
    </div>
  );
};
