import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc, deleteDoc, getDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Listing } from './types';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { LoginModal } from './components/LoginModal';
import { FavoriteButton } from './components/FavoriteButton';
import { MessageCircle, ShieldCheck, Clock, CheckCircle2, DollarSign, X, Star, Repeat, Calendar, Share2, Search, Info, TrendingUp, Award, Layers, Hash, Globe, Tag, AlertCircle, BadgeDollarSign, PlusCircle, Sparkles, Loader2, Edit3, Briefcase, Zap } from 'lucide-react';
import { getMarketInsights } from './services/geminiService';
import { formatDistanceToNow } from 'date-fns';
import { PriceHistory } from './PriceHistory';
import { TradingHistory } from './TradingHistory';
import { MarketInsights } from './components/MarketInsights';
import { ConditionBadge } from './components/ConditionBadge';
import { SellerBadge } from './components/SellerBadge';
import { ListingComments } from './components/ListingComments';
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
  const [marketInsight, setMarketInsight] = useState<string | null>(null);
  const [isGettingInsight, setIsGettingInsight] = useState(false);
  const [isAddingToPortfolio, setIsAddingToPortfolio] = useState(false);
  const [portfolioAdded, setPortfolioAdded] = useState(false);

  const handleGetMarketInsights = async () => {
    if (!listing) return;
    setIsGettingInsight(true);
    try {
      const insight = await getMarketInsights(`${listing.title} ${listing.year} ${listing.set}`);
      setMarketInsight(insight);
    } catch (err) {
      console.error('Error getting market insight:', err);
    } finally {
      setIsGettingInsight(false);
    }
  };

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

  const handleAddToPortfolio = async () => {
    if (!user || user.isGuest) {
      setShowLoginModal(true);
      return;
    }
    if (!listing) return;

    setIsAddingToPortfolio(true);
    try {
      const portfolioRef = doc(db, 'portfolios', user.uid);
      const docSnap = await getDoc(portfolioRef);
      
      const newItem = {
        id: Math.random().toString(36).substring(2, 15),
        title: listing.title,
        purchasePrice: listing.price, // Store in USD-like format
        acquiredAt: new Date(),
        imageUrl: listing.imageUrl
      };

      if (docSnap.exists()) {
        const currentItems = docSnap.data().items || [];
        await updateDoc(portfolioRef, { items: [...currentItems, newItem] });
      } else {
        await setDoc(portfolioRef, { items: [newItem] });
      }
      
      setPortfolioAdded(true);
      setTimeout(() => setPortfolioAdded(false), 3000);
    } catch (error) {
      console.error("Error adding to portfolio:", error);
    } finally {
      setIsAddingToPortfolio(false);
    }
  };

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
                decoding="async"
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

      <div className="pt-20 sm:pt-24 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-24 h-fit space-y-3 sm:space-y-4"
          >
            <div 
              onClick={() => setIsImageZoomed(true)}
              className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] overflow-hidden aspect-[3/4] w-full flex items-center justify-center relative shadow-xl shadow-gray-200/50 dark:shadow-none group cursor-zoom-in border border-gray-100 dark:border-white/5"
            >
              <img 
                src={listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[selectedImageIndex] : listing.imageUrl} 
                alt={listing.title} 
                className="w-full h-full object-contain p-6 sm:p-12 transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <button 
                onClick={(e) => { e.stopPropagation(); setIsImageZoomed(true); }}
                className="absolute right-4 bottom-4 sm:right-8 sm:bottom-8 p-3 sm:p-4 bg-white dark:bg-black text-gray-900 dark:text-white rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 hover:scale-110"
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Thumbnails */}
            {listing.imageUrls && listing.imageUrls.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
                {listing.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index ? 'border-gray-900 dark:border-white shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100'
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
            className="flex flex-col py-2 sm:py-6"
          >
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <ConditionBadge 
                    condition={listing.condition} 
                    cardType={listing.cardType}
                    title={listing.title} 
                    className="!h-6 sm:!h-8 text-[10px] sm:text-xs"
                  />
                  {listing.negotiation && (
                    <div className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border ${
                      listing.negotiation === 'Firm' 
                        ? 'bg-gray-50 dark:bg-[#141414] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10' 
                        : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                    }`}>
                      <BadgeDollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{listing.negotiation === 'Firm' ? '不議價' : '可議價'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 rounded-full text-[10px] sm:text-xs font-bold border border-green-200 dark:border-green-500/20">
                    <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>High Demand</span>
                  </div>
                </div>
                <button 
                  onClick={handleShare}
                  className="p-2 sm:p-2.5 bg-transparent text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-300 transition-all active:scale-95 border border-gray-200 dark:border-white/10"
                  title="分享"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-1 sm:mb-2 leading-tight">
                {listing.title}
              </h1>
              {listing.englishName && (
                <h2 className="text-xs sm:text-base font-bold text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
                  {listing.englishName}
                </h2>
              )}
              
              <div className="flex items-baseline gap-2 sm:gap-3 mt-2 sm:mt-4">
                <p className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                  HK${(listing.price * 7.8).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <span className="text-xs sm:text-base font-bold text-gray-400 dark:text-gray-500 line-through">HK${(listing.price * 1.15 * 7.8).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* Investment Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="bg-gray-50 dark:bg-[#141414] rounded-xl p-3 border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Year</span>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white">{listing.year || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#141414] rounded-xl p-3 border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Set</span>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{listing.set || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#141414] rounded-xl p-3 border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Number</span>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{listing.cardNumber || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#141414] rounded-xl p-3 border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Lang</span>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{listing.language || 'N/A'}</p>
              </div>
            </div>

            {listing.conditionDetails && listing.conditionDetails.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 sm:mb-3 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  卡片狀態細節
                </h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {listing.conditionDetails.map((detail) => (
                    <span 
                      key={detail}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border border-amber-100 dark:border-amber-800"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-[#141414] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-100 dark:border-white/5 mb-6 sm:mb-8">
              <h3 className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 sm:mb-4">關於此卡片</h3>
              <div className="markdown-body prose prose-sm sm:prose-base prose-blue dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-gray-900 dark:prose-p:text-gray-300 font-medium">
                <ReactMarkdown>{listing.description}</ReactMarkdown>
              </div>
            </div>

            {/* Market Analysis Section */}
            <div className="space-y-6 sm:space-y-8 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">市場分析</h3>
                <button
                  onClick={handleGetMarketInsights}
                  disabled={isGettingInsight}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] sm:text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all disabled:opacity-50 border border-blue-200 dark:border-blue-500/20"
                >
                  {isGettingInsight ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                  AI 市場分析
                </button>
              </div>

              {marketInsight && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-12 h-12 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-black text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI 投資建議
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                    {marketInsight}
                  </p>
                </motion.div>
              )}

              <PriceHistory currentPrice={listing.price * 7.8} />
              <MarketInsights productName={listing.title} />
              <TradingHistory productName={listing.title} />
            </div>
            
            {/* Seller Info - Moved here and optimized for trust */}
            <div className="mt-8">
              <h3 className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">賣家資訊</h3>
              <Link to={`/profile/${listing.sellerId}`} className="bg-gray-50 dark:bg-[#141414] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all group block">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {listing.sellerPhoto ? (
                      <img src={listing.sellerPhoto} alt={listing.sellerName} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white dark:border-[#141414] shadow-sm group-hover:scale-105 transition-transform" loading="lazy"  referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-white/10 rounded-full border-2 border-white dark:border-[#141414] shadow-sm"></div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-base sm:text-xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {listing.sellerName}
                        </p>
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                          <span className="text-xs sm:text-sm font-black">{listing.sellerRating || '4.9'}</span>
                          <span className="text-[10px] sm:text-xs text-gray-400 font-bold">({listing.sellerCompletedTransactions || '120'}+)</span>
                        </div>
                        <SellerBadge 
                          transactions={listing.sellerCompletedTransactions || 120} 
                          rating={listing.sellerRating || 4.9} 
                          isProfessional={listing.sellerIsProfessionalSeller || false} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 sm:gap-1 text-right sm:text-right">
                    <div className="flex items-center justify-end gap-1.5 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400">
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500" />
                      <span>身份已認證</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
                      <span>回覆率: 98%</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-0.5">平均回覆</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white">1小時內</p>
                  </div>
                  <div className="text-center border-x border-gray-100 dark:border-white/5">
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-0.5">加入時間</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white">2022年</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-0.5">好評率</p>
                    <p className="text-xs font-black text-green-600 dark:text-green-400">100%</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="mt-6">
              <div className="max-w-7xl mx-auto">
                {user?.uid === listing.sellerId ? (
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex-1 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-center py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-base">
                        您是此卡片的賣家
                      </div>
                      <Link 
                        to={`/edit-listing/${listing.id}`}
                        className="p-2.5 sm:p-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                      >
                        <Edit3 className="w-4 h-4 sm:w-6 sm:h-6" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['active', 'reserved', 'sold'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-medium transition-colors ${listing.status === status ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                        >
                          {status === 'active' ? '上架中' : status === 'reserved' ? '已預訂' : '已售出'}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-4">
                    {/* Favorite and Portfolio buttons on the left */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <FavoriteButton listingId={id!} className="p-2.5 sm:p-4 bg-gray-100 dark:bg-white/5 rounded-xl sm:rounded-2xl" />
                      <button
                        onClick={handleAddToPortfolio}
                        disabled={isAddingToPortfolio || portfolioAdded}
                        className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                          portfolioAdded 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                            : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                        title="加入投資組合"
                      >
                        {isAddingToPortfolio ? (
                          <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin" />
                        ) : portfolioAdded ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
                        ) : (
                          <Briefcase className="w-4 h-4 sm:w-6 sm:h-6" />
                        )}
                      </button>
                    </div>
                    
                    {/* Primary actions on the right */}
                    <div className="flex-1 flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={handleMakeOfferClick}
                        disabled={startingChat || listing.status !== 'active'}
                        className="flex-1 bg-white dark:bg-black text-gray-900 dark:text-white border-2 border-gray-900 dark:border-white py-2.5 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-lg font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-[0.98] flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-70"
                      >
                        <DollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">出價</span>
                        <span className="sm:hidden">出價</span>
                      </button>
                      <button
                        onClick={handleContactSeller}
                        disabled={startingChat || listing.status !== 'active'}
                        className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-[0.98] flex items-center justify-center gap-1 sm:gap-2 shadow-lg shadow-gray-900/20 dark:shadow-white/20 disabled:opacity-70"
                      >
                        {startingChat ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-5 sm:w-5 border-b-2 border-white dark:border-gray-900"></div>
                        ) : (
                          <>
                            <MessageCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">聯絡賣家</span>
                            <span className="sm:hidden">聯絡</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ListingComments listingId={listing.id} />
          </motion.div>
        </div>
      </div>

      {/* Offer Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        )}
        {showOfferModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
              className="relative bg-white dark:bg-[#1c1c1e] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-white/10"
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
                        placeholder={(listing.price * 7.8).toFixed(0)}
                        className="block w-full rounded-xl border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-black py-3 pl-8 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#1c1c1e] transition-all outline-none text-lg font-medium"
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

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/10 p-4 pb-safe-offset-4">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button 
            onClick={handleContactSeller}
            disabled={startingChat}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white py-3.5 px-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {startingChat ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white"></div>
            ) : (
              <>
                <MessageCircle className="w-5 h-5" />
                <span>聯絡賣家</span>
              </>
            )}
          </button>
          <button 
            onClick={handleMakeOfferClick}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 px-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            <Zap className="w-5 h-5 fill-white" />
            <span>提出出價</span>
          </button>
        </div>
      </div>
    </>
  );
};
