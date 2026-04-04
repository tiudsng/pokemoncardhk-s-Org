import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Comment } from '../types';
import { Star, Send, User, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ListingCommentsProps {
  listingId: string;
}

export const ListingComments: React.FC<ListingCommentsProps> = ({ listingId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, setShowLoginModal } = useAuth();

  useEffect(() => {
    if (!listingId) return;

    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('listingId', '==', listingId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [listingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.isGuest) {
      setShowLoginModal(true);
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        listingId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || '',
        rating,
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
      setRating(5);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-white/5 mb-6 sm:mb-8">
      <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 sm:mb-6">評價與評論 ({comments.length})</h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">評分</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      star <= rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300 dark:text-gray-600'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="寫下您的評論..."
              className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-4 pr-12 text-sm sm:text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 sm:h-28 placeholder:text-gray-400 dark:placeholder:text-gray-600"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="absolute bottom-3 right-3 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-white/5">
            <MessageCircle className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">暫無評論，成為第一個評論的人吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 sm:gap-4 p-4 bg-white dark:bg-black rounded-2xl border border-gray-100 dark:border-white/5">
              {comment.userPhoto ? (
                <img
                  src={comment.userPhoto}
                  alt={comment.userName}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-100 dark:border-white/10"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/10">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate pr-2">{comment.userName}</h4>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : '剛剛'}
                  </span>
                </div>
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                        star <= comment.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-200 dark:text-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
