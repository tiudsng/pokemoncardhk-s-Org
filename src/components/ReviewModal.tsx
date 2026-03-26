import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Send } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  listingId: string;
  listingTitle: string;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  listingId,
  listingTitle,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    setIsSubmitting(true);
    try {
      // 1. Add review to reviews collection
      await addDoc(collection(db, 'reviews'), {
        sellerId,
        buyerId: user.uid,
        buyerName: user.displayName || '匿名用戶',
        buyerPhoto: user.photoURL || '',
        listingId,
        listingTitle,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });

      // 2. Update seller's rating and totalReviews
      const sellerRef = doc(db, 'users', sellerId);
      const sellerSnap = await getDoc(sellerRef);
      
      if (sellerSnap.exists()) {
        const sellerData = sellerSnap.data();
        const currentRating = sellerData.rating || 0;
        const currentTotalReviews = sellerData.totalReviews || 0;
        
        // Calculate new average rating
        // New Rating = ((Current Rating * Total Reviews) + New Rating) / (Total Reviews + 1)
        const newTotalReviews = currentTotalReviews + 1;
        const newRating = ((currentRating * currentTotalReviews) + rating) / newTotalReviews;
        
        await updateDoc(sellerRef, {
          rating: newRating,
          totalReviews: newTotalReviews,
          completedTransactions: increment(1)
        });
      } else {
        // If user document doesn't exist (shouldn't happen), create it or just update with increment
        await updateDoc(sellerRef, {
          rating: rating,
          totalReviews: 1,
          completedTransactions: increment(1)
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("提交評價失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-[#0d0d0d] rounded-[2rem] shadow-2xl dark:shadow-none border border-gray-100 dark:border-white/10 w-full max-w-md overflow-hidden"
          >
            <div className="p-8">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800/50">
                  <Star className="w-8 h-8 text-amber-600 dark:text-amber-500 fill-amber-600 dark:fill-amber-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">評價賣家</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  為您與 <span className="font-bold text-gray-900 dark:text-white">{sellerName}</span> 的交易評分
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">關於：{listingTitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        className="p-1 transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            star <= (hover || rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200 dark:text-white/10'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {rating === 5 ? '太棒了！' : 
                     rating === 4 ? '很滿意' : 
                     rating === 3 ? '普通' : 
                     rating === 2 ? '不太好' : 
                     rating === 1 ? '很差' : '請選擇評分'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">分享您的心得 (選填)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="賣家的服務如何？卡片包裝得好嗎？"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-[#16161a] focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[100px] resize-none placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={rating === 0 || isSubmitting}
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-gray-900/10 dark:shadow-none"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      送出評價
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
