import React, { useEffect, useState } from 'react';
import { collection, query, where, getDoc, orderBy, doc, getDocs, deleteDoc, limit, startAfter, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { Listing, WantListing, User as UserType } from './types';
import { useAuth } from './AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { EditProfileModal } from './components/EditProfileModal';
import { SellerBadge } from './components/SellerBadge';
import { TradingInsights } from './components/TradingInsights';
import { UserBadges } from './components/UserBadges';
import { Star, Repeat, Calendar, Package, Heart, Settings, ChevronRight, LogOut, Camera, Search, Clock, Trash2, AlertCircle, BadgeDollarSign, MessageSquare, Quote, User as UserIcon, Image as ImageIcon, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { ConditionBadge } from './components/ConditionBadge';
import { Review } from './types';
import { formatDistanceToNow } from 'date-fns';

export const Profile: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user, logOut, setShowLoginModal } = useAuth();
  const navigate = useNavigate();
  
  const effectiveUserId = userId || user?.uid;
  const isOwnProfile = !userId || userId === user?.uid;

  const [activeTab, setActiveTab] = useState<'listings' | 'wants' | 'reviews'>('listings');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [lastListingDoc, setLastListingDoc] = useState<any>(null);
  const [hasMoreListings, setHasMoreListings] = useState(true);
  const [isFetchingMoreListings, setIsFetchingMoreListings] = useState(false);

  const [myWants, setMyWants] = useState<WantListing[]>([]);
  const [lastWantDoc, setLastWantDoc] = useState<any>(null);
  const [hasMoreWants, setHasMoreWants] = useState(true);
  const [isFetchingMoreWants, setIsFetchingMoreWants] = useState(false);

  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [lastReviewDoc, setLastReviewDoc] = useState<any>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [isFetchingMoreReviews, setIsFetchingMoreReviews] = useState(false);

  const [userData, setUserData] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDeleteListing = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOwnProfile) return;
    if (!window.confirm('確定要刪除此賣場嗎？')) return;
    
    try {
      await deleteDoc(doc(db, 'listings', id));
      setMyListings(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("刪除失敗，請稍後再試。");
    }
  };

  const handleDeleteWant = async (id: string) => {
    if (!isOwnProfile) return;
    if (!window.confirm('確定要刪除此徵求嗎？')) return;
    
    try {
      await deleteDoc(doc(db, 'wantListings', id));
      setMyWants(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error("Error deleting want:", error);
      alert("刪除失敗，請稍後再試。");
    }
  };

  const fetchListings = React.useCallback(async (isInitial = false) => {
    if (!effectiveUserId) return;
    if (isInitial) setLoading(true);
    else setIsFetchingMoreListings(true);

    try {
      let q = query(
        collection(db, 'listings'),
        where('sellerId', '==', effectiveUserId),
        orderBy('createdAt', 'desc'),
        limit(12)
      );

      if (!isInitial && lastListingDoc) {
        q = query(q, startAfter(lastListingDoc));
      }

      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Listing[];

      if (isInitial) setMyListings(fetched);
      else setMyListings(prev => [...prev, ...fetched]);

      setLastListingDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreListings(snapshot.docs.length === 12);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
      setIsFetchingMoreListings(false);
    }
  }, [effectiveUserId, lastListingDoc]);

  const fetchWants = React.useCallback(async (isInitial = false) => {
    if (!effectiveUserId) return;
    if (isInitial) setLoading(true);
    else setIsFetchingMoreWants(true);

    try {
      let q = query(
        collection(db, 'wantListings'),
        where('buyerId', '==', effectiveUserId),
        orderBy('createdAt', 'desc'),
        limit(12)
      );

      if (!isInitial && lastWantDoc) {
        q = query(q, startAfter(lastWantDoc));
      }

      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WantListing[];

      if (isInitial) setMyWants(fetched);
      else setMyWants(prev => [...prev, ...fetched]);

      setLastWantDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreWants(snapshot.docs.length === 12);
    } catch (error) {
      console.error("Error fetching wants:", error);
    } finally {
      setLoading(false);
      setIsFetchingMoreWants(false);
    }
  }, [effectiveUserId, lastWantDoc]);

  const fetchReviews = React.useCallback(async (isInitial = false) => {
    if (!effectiveUserId) return;
    if (isInitial) setLoading(true);
    else setIsFetchingMoreReviews(true);

    try {
      let q = query(
        collection(db, 'reviews'),
        where('sellerId', '==', effectiveUserId),
        orderBy('createdAt', 'desc'),
        limit(12)
      );

      if (!isInitial && lastReviewDoc) {
        q = query(q, startAfter(lastReviewDoc));
      }

      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];

      if (isInitial) setMyReviews(fetched);
      else setMyReviews(prev => [...prev, ...fetched]);

      setLastReviewDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreReviews(snapshot.docs.length === 12);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
      setIsFetchingMoreReviews(false);
    }
  }, [effectiveUserId, lastReviewDoc]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!effectiveUserId) {
        if (!user || user.isGuest) {
          navigate('/auth');
        }
        return;
      }

      // Fetch user data from Firestore (one-time)
      const userRef = doc(db, 'users', effectiveUserId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData({ id: userSnap.id, ...userSnap.data() } as any);
      } else {
        setUserData(null);
      }

      // Check if following
      if (user && !user.isGuest && effectiveUserId !== user.uid) {
        const followId = `${user.uid}_${effectiveUserId}`;
        const followRef = doc(db, 'follows', followId);
        const followSnap = await getDoc(followRef);
        setIsFollowing(followSnap.exists());
      }

      fetchListings(true);
      fetchWants(true);
      fetchReviews(true);
    };

    fetchUserData();
  }, [effectiveUserId, user, navigate, fetchListings, fetchWants, fetchReviews]);

  const handleFollow = async () => {
    if (!user || user.isGuest) {
      setShowLoginModal(true);
      return;
    }

    if (!userData || followLoading) return;

    setFollowLoading(true);
    const followId = `${user.uid}_${userData.uid}`;
    const followRef = doc(db, 'follows', followId);
    const userRef = doc(db, 'users', userData.uid);
    const myRef = doc(db, 'users', user.uid);

    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        await updateDoc(userRef, { followersCount: increment(-1) });
        await updateDoc(myRef, { followingCount: increment(-1) });
        setIsFollowing(false);
        setUserData(prev => prev ? { ...prev, followersCount: (prev.followersCount || 1) - 1 } : null);
      } else {
        await setDoc(followRef, {
          followerId: user.uid,
          followedId: userData.uid,
          createdAt: serverTimestamp()
        });
        await updateDoc(userRef, { followersCount: increment(1) });
        await updateDoc(myRef, { followingCount: increment(1) });
        setIsFollowing(true);
        setUserData(prev => prev ? { ...prev, followersCount: (prev.followersCount || 0) + 1 } : null);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading && !userData) {
    return (
      <div className="pt-32 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="pt-32 px-4 text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">找不到用戶</h2>
        <p className="text-gray-500 mb-8">該用戶可能不存在或已被刪除。</p>
        <Link to="/" className="text-blue-600 font-bold hover:underline">返回首頁</Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-screen">
      {/* Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#0d0d0d] rounded-[3rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 mb-10 overflow-hidden"
      >
        {/* Header Background/Cover */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          {isOwnProfile && (
            <button 
              onClick={() => logOut()}
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all active:scale-95 border border-white/30"
              title="登出"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
          {isOwnProfile && user?.role === 'admin' && (
            <Link 
              to="/admin"
              className="absolute top-4 left-4 p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all active:scale-95 border border-white/30"
              title="管理員後台"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}
        </div>

        <div className="px-6 sm:px-10 pb-10 -mt-16 relative z-10">
          <div className="flex flex-col items-center text-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] overflow-hidden border-8 border-white dark:border-[#0d0d0d] shadow-2xl bg-white dark:bg-[#0d0d0d]">
                <img 
                  src={userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.uid}`} 
                  alt={userData.displayName || 'User'} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {userData.uid === user?.uid && !user?.isGuest && (
                <div className="absolute bottom-2 right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-[#0d0d0d] shadow-lg animate-pulse"></div>
              )}
            </div>
            
            <div className="w-full max-w-3xl">
              <div className="flex flex-col items-center gap-4 mb-6">
                <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{userData.displayName}</h1>
                <div className="flex items-center justify-center gap-2">
                  <SellerBadge 
                    transactions={userData.completedTransactions || 0} 
                    rating={userData.rating || 5} 
                    isProfessional={userData.isProfessionalSeller || false} 
                  />
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-gray-200 dark:border-white/10">
                    <Heart className="w-3 h-3" />
                    <span>{userData.followersCount || 0} 追蹤者</span>
                  </div>
                  {userData.uid === user?.uid && user?.isGuest && (
                    <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-gray-200 dark:border-white/10">
                      訪客模式
                    </span>
                  )}
                </div>
                <UserBadges />
              </div>
              
              {userData.bio && (
                <p className="text-gray-600 dark:text-gray-400 text-base mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
                  {userData.bio}
                </p>
              )}
              
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-row justify-center gap-4 sm:gap-8 w-full">
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">信用評分</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-2xl border border-amber-100 dark:border-amber-800/30 shadow-sm">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-amber-700 dark:text-amber-400 font-black text-lg">{(userData?.rating || 5).toFixed(1)}</span>
                      </div>
                      <span className="text-gray-400 dark:text-gray-500 text-xs font-bold">({userData?.totalReviews || 0} 評價)</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center flex-1">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">成交次數</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-2xl border border-blue-100 dark:border-blue-800/30 shadow-sm">
                        <Repeat className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        <span className="text-blue-700 dark:text-blue-400 font-black text-lg">{userData?.completedTransactions || 0}</span>
                      </div>
                      <span className="text-gray-400 dark:text-gray-500 text-xs font-bold">次交易</span>
                    </div>
                  </div>
                </div>

                {userData?.createdAt && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">加入時間</span>
                    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-5 py-2.5 rounded-2xl border border-green-100 dark:border-green-800/30 shadow-sm text-green-700 dark:text-green-400 font-black text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(userData.createdAt.toDate()).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-10 w-full max-w-lg mx-auto">
                <TradingInsights listings={myListings} />
              </div>
            </div>

            {isOwnProfile ? (
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center mt-4">
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-gray-900/20 dark:shadow-none group"
                >
                  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                  編輯個人資料
                </button>
                <Link 
                  to="/portfolio"
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all active:scale-95 border border-blue-100 dark:border-blue-800 group"
                >
                  <BadgeDollarSign className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  我的投資組合
                </Link>
              </div>
            ) : (
              <div className="mt-4">
                <button 
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg ${
                    isFollowing 
                      ? 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                  }`}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      取消追蹤
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      追蹤用戶
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
        <div className="flex gap-1 bg-gray-100 dark:bg-[#0d0d0d] p-1.5 rounded-[1.5rem] w-full sm:w-auto shadow-inner dark:shadow-none border dark:border-white/5">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'listings' 
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-md scale-[1.02]' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {isOwnProfile ? '我的賣場' : '商品'} ({myListings.length})
          </button>
          <button
            onClick={() => setActiveTab('wants')}
            className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'wants' 
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-md scale-[1.02]' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {isOwnProfile ? '我的徵求' : '徵求'} ({myWants.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'reviews' 
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-md scale-[1.02]' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {isOwnProfile ? '收到評價' : '評價'} ({myReviews.length})
          </button>
        </div>

        {isOwnProfile && activeTab === 'listings' && (
          <Link 
            to="/create" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 dark:shadow-none"
          >
            <Camera className="w-4 h-4" />
            上架新卡片
          </Link>
        )}
      </div>

      {userData && (
        <EditProfileModal 
          isOpen={showEditModal} 
          onClose={() => setShowEditModal(false)} 
          userData={userData} 
        />
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'listings' ? (
          <motion.div
            key="listings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {myListings.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white dark:bg-[#0d0d0d] rounded-[4rem] border border-dashed border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                  <div className="w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                    <Package className="w-16 h-16 text-gray-200 dark:text-gray-700" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">開啟您的收藏傳奇</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-sm mx-auto font-medium leading-relaxed">
                    您的展示櫃目前是空的。上架您的第一張稀有卡片，讓全世界的收藏家為之瘋狂！
                  </p>
                  {isOwnProfile && (
                    <Link to="/create" className="inline-flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-10 py-5 rounded-[1.5rem] font-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-95 shadow-2xl shadow-gray-900/30 dark:shadow-none group">
                      <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      立即上架卡片
                    </Link>
                  )}
                </div>
              ) : (
                myListings.map(listing => (
                  <Link key={listing.id} to={`/listing/${listing.id}`} className="group">
                    <div className="bg-white dark:bg-[#0d0d0d] rounded-[2.5rem] overflow-hidden shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 hover:shadow-2xl hover:-translate-y-1 dark:hover:border-white/10 transition-all duration-500">
                      <div className="aspect-[3/4] relative overflow-hidden bg-gray-100 dark:bg-[#050505]">
                        <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        
                        {/* Overlay Gradients */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {listing.imageUrls && listing.imageUrls.length > 1 && (
                          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-xl rounded-xl text-[10px] font-black text-white flex items-center gap-1.5 z-10 border border-white/10">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{listing.imageUrls.length}</span>
                          </div>
                        )}
                        
                        <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-xl backdrop-blur-xl z-10 border border-white/20 ${
                          listing.status === 'active' ? 'bg-green-500/80 text-white' : 
                          listing.status === 'reserved' ? 'bg-amber-500/80 text-white' : 
                          'bg-gray-500/80 text-white'
                        }`}>
                          {listing.status === 'active' ? '上架中' : listing.status === 'reserved' ? '已預訂' : '已售出'}
                        </div>
                        
                        <ConditionBadge 
                          condition={listing.condition} 
                          cardType={listing.cardType}
                          title={listing.title} 
                          className="absolute top-4 left-4 scale-110 origin-top-left"
                        />
                        
                        {listing.negotiation && (
                          <div className={`absolute bottom-4 left-4 px-4 py-1.5 rounded-full text-[10px] font-black shadow-xl border ${
                            listing.negotiation === 'Firm' 
                              ? 'bg-gray-900/60 text-white border-white/10' 
                              : 'bg-blue-600/60 text-white border-white/10'
                          } backdrop-blur-xl`}>
                            {listing.negotiation === 'Firm' ? '不議價' : '可議價'}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">{listing.title}</h3>
                          {isOwnProfile && (
                            <button 
                              onClick={(e) => handleDeleteListing(listing.id, e)}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">NT$</span>
                          <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{listing.price.toLocaleString()}</p>
                        </div>
                        
                        <div className="mt-5 pt-5 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(listing.createdAt?.toDate()).toLocaleDateString()}</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 dark:text-gray-600">{listing.condition}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {hasMoreListings && (
              <div className="flex justify-center">
                <button
                  onClick={() => fetchListings()}
                  disabled={isFetchingMoreListings}
                  className="px-8 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  {isFetchingMoreListings ? <Loader2 className="w-4 h-4 animate-spin" /> : '載入更多商品'}
                </button>
              </div>
            )}
          </motion.div>
        ) : activeTab === 'wants' ? (
          <motion.div
            key="wants"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myWants.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white dark:bg-[#0d0d0d] rounded-[4rem] border border-dashed border-gray-200 dark:border-white/10 shadow-2xl shadow-blue-200/20 dark:shadow-none">
                  <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                    <Search className="w-16 h-16 text-blue-300 dark:text-blue-600" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">尋找您的夢幻逸品</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-sm mx-auto font-medium leading-relaxed">
                    正在尋找特定的卡片嗎？發佈徵求讓全世界的賣家主動為您尋找！
                  </p>
                  {isOwnProfile && (
                    <Link to="/create-want" className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-[1.5rem] font-black hover:bg-blue-700 transition-all active:scale-95 shadow-2xl shadow-blue-600/30 dark:shadow-none group">
                      <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      發佈徵求
                    </Link>
                  )}
                </div>
              ) : (
                myWants.map(want => (
                  <div key={want.id} className="bg-white dark:bg-[#0d0d0d] rounded-[2rem] p-6 shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex items-start gap-5">
                      <div className="w-24 h-24 rounded-2xl bg-gray-50 dark:bg-[#050505] overflow-hidden shrink-0 border border-gray-100 dark:border-white/5 relative group-hover:shadow-lg transition-shadow">
                        {want.imageUrl ? (
                          <>
                            <img src={want.imageUrl} alt={want.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            {want.imageUrls && want.imageUrls.length > 1 && (
                              <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-lg text-[8px] font-black text-white flex items-center gap-1">
                                <ImageIcon className="w-2.5 h-2.5" />
                                <span>{want.imageUrls.length}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200 dark:text-gray-700">
                            <Package className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <ConditionBadge 
                            condition={want.condition || 'Mint'} 
                            cardType={want.cardType}
                            title={want.title} 
                            className="!px-2.5 !py-1 !text-[9px] !h-auto scale-90 origin-left"
                          />
                          {want.negotiation && (
                            <div className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                              want.negotiation === 'Firm' 
                                ? 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10' 
                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/30'
                            }`}>
                              {want.negotiation === 'Firm' ? '不議價' : '可議價'}
                            </div>
                          )}
                        </div>
                        <h3 className="font-black text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight tracking-tight group-hover:text-blue-600 transition-colors">{want.title}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">預算</span>
                          <p className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">NT${want.targetPrice.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-5 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(want.createdAt?.toDate()).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteWant(want.id)}
                        className={`${isOwnProfile ? 'text-red-500 hover:text-red-600 dark:hover:text-red-400' : 'text-gray-400 dark:text-gray-600 pointer-events-none opacity-0'} text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        刪除徵求
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {hasMoreWants && (
              <div className="flex justify-center">
                <button
                  onClick={() => fetchWants()}
                  disabled={isFetchingMoreWants}
                  className="px-8 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  {isFetchingMoreWants ? <Loader2 className="w-4 h-4 animate-spin" /> : '載入更多徵求'}
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="reviews"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              {myReviews.length === 0 ? (
                <div className="py-32 text-center bg-white dark:bg-[#0d0d0d] rounded-[4rem] border border-dashed border-gray-200 dark:border-white/10 shadow-2xl shadow-amber-200/20 dark:shadow-none">
                  <div className="w-32 h-32 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                    <Star className="w-16 h-16 text-amber-300 dark:text-amber-600" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">建立您的聲譽</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto font-medium leading-relaxed">
                    完成交易後，買家將可以為您評分。良好的信用是成功交易的關鍵！
                  </p>
                </div>
              ) : (
                myReviews.map(review => (
                  <div key={review.id} className="bg-white dark:bg-[#0d0d0d] rounded-[2rem] p-8 shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start gap-6">
                      <img 
                        src={review.buyerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.buyerId}`} 
                        alt={review.buyerName} 
                        className="w-12 h-12 rounded-full border border-gray-100 dark:border-white/10 shadow-sm"
                      />
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-gray-900 dark:text-white">{review.buyerName}</h4>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            {review.createdAt ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true }) : '剛剛'}
                          </span>
                        </div>
                        <div className="flex gap-0.5 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-white/10'}`} 
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <div className="relative mb-4">
                            <Quote className="absolute -left-1 -top-1 w-4 h-4 text-gray-100 dark:text-white/5 -z-10" />
                            <p className="text-gray-600 dark:text-gray-300 text-sm italic leading-relaxed pl-2">
                              「{review.comment}」
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 w-fit px-3 py-1.5 rounded-lg">
                          <Package className="w-3 h-3" />
                          <span>關於：{review.listingTitle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {hasMoreReviews && (
              <div className="flex justify-center">
                <button
                  onClick={() => fetchReviews()}
                  disabled={isFetchingMoreReviews}
                  className="px-8 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  {isFetchingMoreReviews ? <Loader2 className="w-4 h-4 animate-spin" /> : '載入更多評價'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
