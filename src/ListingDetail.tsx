import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc, deleteDoc, getDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Listing } from './types';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { LoginModal } from './components/LoginModal';
import { FavoriteButton } from './components/FavoriteButton';
import { MessageCircle, ShieldCheck, Clock, CheckCircle2, DollarSign, X, Star, Repeat, Calendar, Share2, Search, Info, TrendingUp, Award, Layers, Hash, Globe, Tag, AlertCircle, BadgeDollarSign, PlusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PriceHistory } from './PriceHistory';
import { TradingHistory } from './TradingHistory';
import { ConditionBadge } from './components/ConditionBadge';
import { SellerBadge } from './components/SellerBadge';
import ReactMarkdown from 'react-markdown';

export const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const { user, showLoginModal, setShowLoginModal } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const listingRef = doc(db, 'listings', id);
        const docSnap = await getDoc(listingRef);
        if (docSnap.exists()) {
          const listingData = { id: docSnap.id, ...docSnap.data() } as Listing;
          setListing(listingData);
        } else {
          setListing(null);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  useEffect(() => {
    const fetchSeller = async () => {
      if (!listing?.sellerId) return;

      try {
        const sellerRef = doc(db, 'users', listing.sellerId);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          setSeller(sellerSnap.data());
        }
      } catch (error) {
        console.error("Error fetching seller:", error);
      }
    };

    fetchSeller();
  }, [listing?.sellerId]);

  const getOrCreateChat = async () => {
    if (!user || !listing) return null;
    
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('participantIds', 'array-contains', user.uid),
      where('listingId', '==', listing.id)
    );
    const querySnapshot = await getDocs(q);
    
    let chatId = null;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participantIds.includes(listing.sellerId)) {
        chatId = doc.id;
      }
    });

    if (chatId) {
      return chatId;
    } else {
      const newChatRef = await addDoc(chatsRef, {
        participantIds: [user.uid, listing.sellerId],
        listingId: listing.id,
        listingTitle: listing.title,
        listingImageUrl: listing.imageUrl,
        createdAt: serverTimestamp(),
      });
      return newChatRef.id;
    }
  };

  const handleContactSeller = async () => {
    if (!listing) return;
    if (!user || user.isGuest) {
      setShowLoginModal(true);
      return;
    }
    
    setStartingChat(true);
    try {
      const chatId = await getOrCreateChat();
      if (chatId) {
        navigate(`/chat/${chatId}`);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start chat. Please try again.");
    } finally {
      setStartingChat(false);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'reserved' | 'sold') => {
    if (!listing || !user || user.uid !== listing.sellerId) return;
    
    try {
      const docRef = doc(db, 'listings', listing.id);
      await updateDoc(docRef, { status: newStatus });
      setListing({ ...listing, status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleMakeOfferClick = () => {
    if (!user || user.isGuest) {
      setShowLoginModal(true);
      return;
    }
    setShowOfferModal(true);
  };

  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listing || !offerAmount) return;
    
    setStartingChat(true);
    try {
      const chatId = await getOrCreateChat();
      if (chatId) {
        // Send the offer message
        const offerMessage = `Hi! I'd like to make an offer of HK$${offerAmount} for your ${listing.title}.`;
        
        await addDoc(collection(db, `chats/${chatId}/messages`), {
          chatId: chatId,
          senderId: user.uid,
          text: offerMessage,
          createdAt: serverTimestamp(),
        });

        // Navigate to chat
        navigate(`/chat/${chatId}`);
      }
    } catch (error) {
      console.error("Error sending offer:", error);
      alert("Failed to send offer. Please try again.");
    } finally {
      setStartingChat(false);
      setShowOfferModal(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: `在 TCG INVEST 看到這張卡片：${listing?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('連結已複製到剪貼簿！');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="pt-32 text-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">找不到卡片</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline">返回首頁</button>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isImageZoomed && listing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsImageZoomed(false)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[selectedImageIndex] : listing.imageUrl}
                alt={listing.title}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <button
                onClick={() => setIsImageZoomed(false)}
                className="absolute top-4 right-4 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-24 h-fit space-y-4"
          >
            <div 
              onClick={() => setIsImageZoomed(true)}
              className="bg-white dark:bg-[#0d0d0d] rounded-[2.5rem] overflow-hidden aspect-[3/4] w-full flex items-center justify-center relative shadow-2xl shadow-gray-200/50 dark:shadow-none group cursor-zoom-in border border-gray-100 dark:border-white/5"
            >
              <img 
                src={listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[selectedImageIndex] : listing.imageUrl} 
                alt={listing.title} 
                className="w-full h-full object-contain p-6 sm:p-12 transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <button 
                onClick={(e) => { e.stopPropagation(); setIsImageZoomed(true); }}
                className="absolute right-8 bottom-8 p-4 bg-white dark:bg-[#050505] text-gray-900 dark:text-white rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 hover:scale-110"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>

            {/* Thumbnails */}
            {listing.imageUrls && listing.imageUrls.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {listing.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index ? 'border-blue-600 shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col py-4 sm:py-6"
          >
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <ConditionBadge 
                    condition={listing.condition} 
                    cardType={listing.cardType}
                    title={listing.title} 
                    className="!h-6 sm:!h-8"
                  />
                  {listing.negotiation && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border ${
                      listing.negotiation === 'Firm' 
                        ? 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10' 
                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                    }`}>
                      <BadgeDollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{listing.negotiation === 'Firm' ? '不議價' : '可議價'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] sm:text-xs font-bold border border-green-100 dark:border-green-800">
                    <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>High Demand</span>
                  </div>
                </div>
                <button 
                  onClick={handleShare}
                  className="p-2.5 sm:p-3 bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-300 transition-all active:scale-95 border border-gray-100 dark:border-white/10"
                  title="分享"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <h1 className="text-2xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-2 sm:mb-4 leading-[0.95] sm:leading-[0.9]">
                {listing.title}
              </h1>
              
              <div className="flex items-baseline gap-2 sm:gap-3">
                <p className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                  HK${listing.price.toLocaleString()}
                </p>
                <span className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 line-through">HK${(listing.price * 1.15).toLocaleString()}</span>
              </div>
            </div>

            {/* Investment Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-[#0d0d0d] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Year</p>
                <p className="text-sm font-black text-gray-900 dark:text-white">{listing.year || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#0d0d0d] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                <Layers className="w-4 h-4 text-purple-500 dark:text-purple-400 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Set</p>
                <p className="text-sm font-black text-gray-900 dark:text-white">{listing.set || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#0d0d0d] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                <Hash className="w-4 h-4 text-orange-500 dark:text-orange-400 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Number</p>
                <p className="text-sm font-black text-gray-900 dark:text-white">{listing.cardNumber || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#0d0d0d] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                <Globe className="w-4 h-4 text-green-500 dark:text-green-400 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Lang</p>
                <p className="text-sm font-black text-gray-900 dark:text-white">{listing.language || 'N/A'}</p>
              </div>
            </div>

            {listing.conditionDetails && listing.conditionDetails.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  卡片狀態細節
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.conditionDetails.map((detail) => (
                    <span 
                      key={detail}
                      className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold border border-amber-100 dark:border-amber-800"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">關於此卡片</h3>
              <div className="markdown-body prose prose-sm sm:prose-base prose-blue dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300">
                <ReactMarkdown>{listing.description}</ReactMarkdown>
              </div>
            </div>

            <PriceHistory currentPrice={listing.price} />
            <TradingHistory />

            {/* Seller Info */}
            <Link to={`/profile/${listing.sellerId}`} className="bg-gray-50 dark:bg-[#0d0d0d] rounded-3xl p-6 border border-gray-100 dark:border-white/5 mb-8 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group block">
              <div className="flex items-center gap-4 mb-6">
                {listing.sellerPhoto ? (
                  <img src={listing.sellerPhoto} alt={listing.sellerName} className="w-14 h-14 rounded-full border-2 border-white dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 dark:bg-white/10 rounded-full border-2 border-white dark:border-white/10 shadow-sm"></div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">賣家</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {listing.sellerName}
                    <CheckCircle2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  </p>
                  <SellerBadge 
                    transactions={listing.sellerCompletedTransactions || 0} 
                    rating={listing.sellerRating || 5} 
                    isProfessional={listing.sellerIsProfessionalSeller || false} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
                <div className="text-center flex flex-col items-center gap-1">
                  <Star className="w-3 h-3 sm:w-4 h-4 text-amber-500 fill-amber-500" />
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">賣家評分</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    {seller?.rating ? seller.rating.toFixed(1) : '5.0'}
                    <span className="text-[10px] text-gray-400 ml-1">({seller?.totalReviews || 0})</span>
                  </p>
                </div>
                <div className="text-center flex flex-col items-center gap-1">
                  <Repeat className="w-3 h-3 sm:w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">交易次數</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{seller?.completedTransactions || 0}</p>
                </div>
                <div className="text-center flex flex-col items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 h-4 text-green-500 dark:text-green-400" />
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">加入日期</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    {seller?.createdAt ? new Date(seller.createdAt.toDate()).toLocaleDateString() : listing.sellerCreatedAt ? new Date(listing.sellerCreatedAt.toDate()).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </Link>


            {/* Action Buttons */}
            <div className="mt-auto pt-8 border-t border-gray-100 dark:border-white/5">
              {user?.uid === listing.sellerId ? (
                <div className="space-y-4">
                  <div className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-center py-4 rounded-2xl font-semibold">
                    您是此卡片的賣家
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['active', 'reserved', 'sold'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`py-2 rounded-xl text-sm font-medium transition-colors ${listing.status === status ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                      >
                        {status === 'active' ? '上架中' : status === 'reserved' ? '已預訂' : '已售出'}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleMakeOfferClick}
                    disabled={startingChat || listing.status !== 'active'}
                    className="w-full bg-white dark:bg-[#050505] text-gray-900 dark:text-white border-2 border-gray-900 dark:border-white py-4 rounded-2xl text-lg font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <DollarSign className="w-5 h-5" />
                    出價
                  </button>
                  <div className="flex items-center gap-3 flex-grow">
                      <FavoriteButton listingId={id!} />
                    <button
                      onClick={handleContactSeller}
                      disabled={startingChat || listing.status !== 'active'}
                      className="flex-grow bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl text-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 dark:shadow-white/20 disabled:opacity-70"
                    >
                      {startingChat ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-gray-900"></div>
                      ) : (
                        <>
                          <MessageCircle className="w-5 h-5" />
                          聯絡賣家
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Offer Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        )}
        {showOfferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOfferModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-[#0d0d0d] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-white/10"
            >
              <div className="p-6">
                <button 
                  onClick={() => setShowOfferModal(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">提出出價</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                  向 {listing.sellerName} 針對 {listing.title} 提出出價。
                </p>
                
                <form onSubmit={submitOffer} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">您的出價 (HKD)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">$</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        placeholder={listing.price.toString()}
                        className="block w-full rounded-xl border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-[#050505] py-3 pl-8 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#0d0d0d] transition-all outline-none text-lg font-medium"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={!offerAmount || startingChat}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors active:scale-[0.98] disabled:opacity-50"
                  >
                    {startingChat ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      '送出出價'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
