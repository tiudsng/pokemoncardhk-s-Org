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
import { Star, Repeat, Calendar, Package, Heart, Settings, ChevronRight, LogOut, Camera, Search, Clock, Trash2, Edit3, AlertCircle, BadgeDollarSign, MessageSquare, Quote, User as UserIcon, Image as ImageIcon, Loader2, UserPlus, UserMinus, Share2, ShieldCheck, Zap, TrendingUp, Award } from 'lucide-react';
import { ConditionBadge } from './components/ConditionBadge';
import { Review } from './types';
import { formatDistanceToNow } from 'date-fns';

const ListingSkeleton = () => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/5 h-full animate-pulse">
    <div className="aspect-[3/4] w-full bg-gray-100 dark:bg-black" />
    <div className="p-3 sm:p-6 space-y-3">
      <div className="h-4 bg-gray-50 dark:bg-white/5 rounded w-3/4" />
      <div className="h-6 bg-gray-50 dark:bg-white/5 rounded w-1/2" />
      <div className="pt-3 sm:pt-5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gray-50 dark:bg-white/5 rounded-full" />
          <div className="h-3 bg-gray-50 dark:bg-white/5 rounded w-16" />
        </div>
      </div>
    </div>
  </div>
);

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

  const handleDeleteWant = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
      <div className="pt-32 flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="pt-32 px-4 text-center">
        <AlertCircle className="w-16 h-16 text-gray-600 dark:text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">找不到用戶</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">該用戶可能不存在或已被刪除。</p>
        <Link to="/" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">返回首頁</Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-24 pb-24 min-h-screen">
      {/* AI Admin Panel - Only visible to admin */}
      {(user?.email === "appleyes516@gmail.com" || user?.role === 'admin') && (
        <div className="mb-8">
          <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
            <h3 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" /> AI 流動性管理員 (測試用)
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/spawn', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'sell' })
                    });
                    if (res.ok) {
                      alert('✅ AI 賣場生成成功！請刷新首頁查看。');
                    } else {
                      const data = await res.json();
                      alert(`❌ 生成失敗: ${data.error || '未知錯誤'}`);
                    }
                  } catch (err) {
                    alert('❌ 生成失敗，網路錯誤。');
                  }
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
              >
                立即生成賣場 (Sell)
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/spawn', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'buy' })
                    });
                    if (res.ok) {
                      alert('✅ AI 徵求生成成功！請刷新首頁查看。');
                    } else {
                      const data = await res.json();
                      alert(`❌ 生成失敗: ${data.error || '未知錯誤'}`);
                    }
                  } catch (err) {
                    alert('❌ 生成失敗，網路錯誤。');
                  }
                }}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
              >
                立即生成徵求 (Buy)
              </button>
            </div>
            <p className="mt-3 text-[10px] font-bold text-gray-500">
              * 此面板僅管理員可見。點擊後 AI 會調用 Minimax 生成內容並寫入 Firestore。
            </p>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-12"
      >
        {/* Background Banner */}
        <div className="h-48 sm:h-64 rounded-[2.5rem] overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700">
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          
          {/* Banner Actions */}
          <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
            {isOwnProfile && (
              <>
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin"
                    className="p-3 rounded-2xl bg-gray-100 dark:bg-white/10 backdrop-blur-xl text-gray-900 dark:text-white hover:bg-gray-200 dark:bg-white/20 transition-all border border-gray-300 dark:border-white/20 group/btn"
                    title="管理員後台"
                  >
                    <Settings className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-500" />
                  </Link>
                )}
                <button 
                  onClick={() => logOut()}
                  className="p-3 rounded-2xl bg-gray-100 dark:bg-white/10 backdrop-blur-xl text-gray-900 dark:text-white hover:bg-gray-200 dark:bg-white/20 transition-all border border-gray-300 dark:border-white/20 group/btn"
                  title="登出"
                >
                  <LogOut className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </>
            )}
            {!isOwnProfile && (
              <button 
                className="p-3 rounded-2xl bg-gray-100 dark:bg-white/10 backdrop-blur-xl text-gray-900 dark:text-white hover:bg-gray-200 dark:bg-white/20 transition-all border border-gray-300 dark:border-white/20"
                title="分享個人檔案"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Profile Info Overlay */}
        <div className="px-4 sm:px-6 md:px-12 -mt-16 sm:-mt-20 md:-mt-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 md:gap-8 w-full lg:w-auto">
              {/* Avatar */}
              <div className="relative group/avatar -mt-8 sm:-mt-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-[4px] sm:border-[6px] border-white dark:border-black shadow-2xl bg-white dark:bg-[#1c1c1e] relative z-10">
                  <img 
                    src={userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.uid}`} 
                    alt={userData.displayName || 'User'} 
                    className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700"
                    loading="lazy"
                   referrerPolicy="no-referrer" />
                  
                  {isOwnProfile && (
                    <button 
                      onClick={() => setShowEditModal(true)}
                      className="absolute inset-0 bg-gray-100 dark:bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-20"
                    >
                      <div className="p-3 bg-gray-200 dark:bg-white/20 rounded-2xl border border-white/30">
                        <Camera className="w-6 h-6 text-gray-900 dark:text-white" />
                      </div>
                    </button>
                  )}
                </div>
                {/* Status Indicator */}
                <div className="absolute bottom-4 right-4 w-8 h-8 bg-green-500 rounded-2xl border-4 border-white dark:border-black shadow-lg z-20 animate-pulse"></div>
                
                {/* Avatar Decoration */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[3.5rem] opacity-0 group-hover/avatar:opacity-20 transition-opacity duration-500 -z-10 blur-xl"></div>
              </div>

              {/* User Details */}
              <div className="flex-1 text-center sm:text-left pb-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                  <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{userData.displayName}</h1>
                  {userData.isProfessionalSeller && (
                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">認證賣家</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(userData.createdAt?.toDate()).toLocaleDateString()} 加入</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-700 rounded-full hidden sm:block"></div>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-bold text-sm">
                    <Heart className="w-4 h-4" />
                    <span>{userData.followersCount || 0} 追蹤者</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <UserBadges userData={userData} />
                  <SellerBadge 
                    transactions={userData.completedTransactions || 0} 
                    rating={userData.rating || 5} 
                    isProfessional={userData.isProfessionalSeller || false} 
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto mt-4 lg:mt-0">
              {isOwnProfile ? (
                <>
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-black rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-black/5 dark:shadow-white/5"
                  >
                    <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                    編輯資料
                  </button>
                  <Link 
                    to="/portfolio"
                    className="p-3 sm:p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl sm:rounded-2xl hover:bg-gray-100 dark:bg-white/10 transition-all active:scale-95 group"
                    title="投資組合"
                  >
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button 
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 shadow-xl ${
                      isFollowing 
                        ? 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:bg-white/10' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 sm:w-5 sm:h-5" />
                        取消追蹤
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                        追蹤用戶
                      </>
                    )}
                  </button>
                  <button className="p-3 sm:p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl sm:rounded-2xl hover:bg-gray-100 dark:bg-white/10 transition-all active:scale-95">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {userData.bio && (
          <div className="mt-8 px-6 sm:px-12">
            <div className="max-w-3xl p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-12 h-12 text-gray-900 dark:text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed font-medium relative z-10">
                {userData.bio}
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="mt-8 px-4 sm:px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:border-white/10 transition-all group">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-500">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-500" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">信用評分</span>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{(userData?.rating || 5).toFixed(1)}</span>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500">/ 5.0</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:border-white/10 transition-all group">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-500">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">成交次數</span>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{userData?.completedTransactions || 0}</span>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500">次交易</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:border-white/10 transition-all group">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-purple-500/10 text-purple-500">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">評價總數</span>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{userData?.totalReviews || 0}</span>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500">則評價</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:border-white/10 transition-all group">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-green-500/10 text-green-500">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">成交率</span>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">98%</span>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500">準時交付</span>
            </div>
          </div>
        </div>

        {/* Trading Insights Integration */}
        <div className="mt-8 px-6 sm:px-12">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-gray-50 to-white dark:from-[#1c1c1e] dark:to-black border border-gray-100 dark:border-white/5">
            <TradingInsights listings={myListings} />
          </div>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="flex gap-1 sm:gap-2 bg-white dark:bg-[#1c1c1e] p-1.5 sm:p-2 rounded-[1.5rem] sm:rounded-[2rem] w-full sm:w-auto border border-gray-100 dark:border-white/5 relative overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('listings')}
            className={`relative flex-1 sm:flex-none whitespace-nowrap px-4 sm:px-10 py-3 sm:py-4 rounded-[1.25rem] sm:rounded-[1.5rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-500 z-10 ${
              activeTab === 'listings' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-600 dark:text-gray-300'
            }`}
          >
            {activeTab === 'listings' && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-gray-100 dark:bg-white/10 rounded-[1.25rem] sm:rounded-[1.5rem] border border-gray-200 dark:border-white/10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-20 flex items-center justify-center gap-1.5 sm:gap-2">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isOwnProfile ? '我的賣場' : '商品'}
              <span className="ml-0.5 sm:ml-1 opacity-50">{myListings.length}</span>
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('wants')}
            className={`relative flex-1 sm:flex-none whitespace-nowrap px-4 sm:px-10 py-3 sm:py-4 rounded-[1.25rem] sm:rounded-[1.5rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-500 z-10 ${
              activeTab === 'wants' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-600 dark:text-gray-300'
            }`}
          >
            {activeTab === 'wants' && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-gray-100 dark:bg-white/10 rounded-[1.25rem] sm:rounded-[1.5rem] border border-gray-200 dark:border-white/10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-20 flex items-center justify-center gap-1.5 sm:gap-2">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isOwnProfile ? '我的徵求' : '徵求'}
              <span className="ml-0.5 sm:ml-1 opacity-50">{myWants.length}</span>
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('reviews')}
            className={`relative flex-1 sm:flex-none whitespace-nowrap px-4 sm:px-10 py-3 sm:py-4 rounded-[1.25rem] sm:rounded-[1.5rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-500 z-10 ${
              activeTab === 'reviews' ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-600 dark:text-gray-300'
            }`}
          >
            {activeTab === 'reviews' && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-gray-100 dark:bg-white/10 rounded-[1.25rem] sm:rounded-[1.5rem] border border-gray-200 dark:border-white/10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-20 flex items-center justify-center gap-1.5 sm:gap-2">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isOwnProfile ? '收到評價' : '評價'}
              <span className="ml-0.5 sm:ml-1 opacity-50">{myReviews.length}</span>
            </span>
          </button>
        </div>

        {isOwnProfile && activeTab === 'listings' && (
          <Link 
            to="/create" 
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20 group"
          >
            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
            上架新商品
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
              {loading ? (
                [...Array(6)].map((_, i) => <ListingSkeleton key={i} />)
              ) : myListings.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white dark:bg-[#1c1c1e] rounded-[4rem] border border-dashed border-gray-200 dark:border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent"></div>
                  <div className="w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10">
                    <Package className="w-16 h-16 text-gray-700" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight relative z-10">開啟您的收藏傳奇</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-sm mx-auto font-medium leading-relaxed relative z-10">
                    您的展示櫃目前是空的。上架您的第一張稀有卡片，讓全世界的收藏家為之瘋狂！
                  </p>
                  {isOwnProfile && (
                    <Link to="/create" className="relative z-10 inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-[1.5rem] font-black hover:bg-gray-100 transition-all active:scale-95 shadow-2xl shadow-white/10 group">
                      <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      立即上架卡片
                    </Link>
                  )}
                </div>
              ) : (
                myListings.map(listing => (
                  <Link key={listing.id} to={`/listing/${listing.id}`} className="group">
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:border-white/20 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500">
                      <div className="aspect-[3/4] relative overflow-hidden bg-gray-100 dark:bg-black">
                        <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy"  referrerPolicy="no-referrer" />
                        
                        {/* Overlay Gradients */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {listing.imageUrls && listing.imageUrls.length > 1 && (
                          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 px-2 py-1 sm:px-3 sm:py-1.5 bg-gray-100 dark:bg-black/60 backdrop-blur-xl rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black text-gray-900 dark:text-white flex items-center gap-1 sm:gap-1.5 z-10 border border-gray-200 dark:border-white/10">
                            <ImageIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                            <span>{listing.imageUrls.length}</span>
                          </div>
                        )}
                        
                        <div className={`absolute top-2 right-2 sm:top-4 sm:right-4 px-2 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] shadow-xl backdrop-blur-xl z-10 border border-gray-300 dark:border-white/20 ${
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
                          className="absolute top-2 left-2 sm:top-4 sm:left-4 scale-90 sm:scale-110 origin-top-left"
                        />
                        
                        {listing.negotiation && (
                          <div className={`absolute bottom-2 left-2 sm:bottom-4 sm:left-4 px-2 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black shadow-xl border ${
                            listing.negotiation === 'Firm' 
                              ? 'bg-gray-100 dark:bg-black/60 text-gray-900 dark:text-white border-gray-200 dark:border-white/10' 
                              : 'bg-blue-600/60 text-white border-gray-200 dark:border-white/10'
                          } backdrop-blur-xl`}>
                            {listing.negotiation === 'Firm' ? '不議價' : '可議價'}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 sm:p-6 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                          <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                            <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white line-clamp-2 sm:line-clamp-1 group-hover:text-blue-400 transition-colors tracking-tight leading-tight">{listing.title}</h3>
                            {listing.englishName && (
                              <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 mt-0.5 sm:mt-1 line-clamp-1">
                                {listing.englishName}
                              </p>
                            )}
                          </div>
                          {isOwnProfile && (
                            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                              <Link 
                                to={`/edit-listing/${listing.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-400 hover:bg-gray-50 dark:bg-white/5 rounded-lg sm:rounded-xl transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Link>
                              <button 
                                onClick={(e) => handleDeleteListing(listing.id, e)}
                                className="p-1.5 sm:p-2 text-gray-500 hover:text-red-400 hover:bg-gray-50 dark:bg-white/5 rounded-lg sm:rounded-xl transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1 sm:gap-1.5 mb-3 sm:mb-5 mt-auto">
                          <span className="text-[10px] sm:text-xs font-black text-blue-400">HK$</span>
                          <p className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{(listing.price * 7.8).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                        
                        <div className="pt-3 sm:pt-5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-bold text-gray-500">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>{new Date(listing.createdAt?.toDate()).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{listing.condition}</span>
                          </div>
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
                  className="px-8 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-100 dark:bg-white/10 transition-all flex items-center gap-2"
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
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 border border-gray-100 dark:border-white/5 animate-pulse h-48"></div>
                ))
              ) : myWants.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white dark:bg-[#1c1c1e] rounded-[4rem] border border-dashed border-gray-200 dark:border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent"></div>
                  <div className="w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10">
                    <Search className="w-16 h-16 text-blue-400" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight relative z-10">尋找您的夢幻逸品</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-sm mx-auto font-medium leading-relaxed relative z-10">
                    正在尋找特定的卡片嗎？發佈徵求讓全世界的賣家主動為您尋找！
                  </p>
                  {isOwnProfile && (
                    <Link to="/create-want" className="relative z-10 inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-[1.5rem] font-black hover:bg-blue-700 transition-all active:scale-95 shadow-2xl shadow-blue-600/30 group">
                      <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      發佈徵求
                    </Link>
                  )}
                </div>
              ) : (
                myWants.map(want => (
                  <div key={want.id} className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:border-white/20 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex items-start gap-3 sm:gap-5">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-black overflow-hidden shrink-0 border border-gray-100 dark:border-white/5 relative group-hover:shadow-lg transition-shadow">
                        {want.imageUrl ? (
                          <>
                            <img src={want.imageUrl} alt={want.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy"  referrerPolicy="no-referrer" />
                            {want.imageUrls && want.imageUrls.length > 1 && (
                              <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-gray-100 dark:bg-black/50 backdrop-blur-md rounded-md sm:rounded-lg text-[8px] font-black text-gray-900 dark:text-white flex items-center gap-1">
                                <ImageIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                <span>{want.imageUrls.length}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700">
                            <Package className="w-8 h-8 sm:w-10 sm:h-10" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            <ConditionBadge 
                              condition={want.condition || 'Mint'} 
                              cardType={want.cardType}
                              title={want.title} 
                              className="!px-2 !py-0.5 sm:!px-2.5 sm:!py-1 !text-[8px] sm:!text-[9px] !h-auto"
                            />
                            {want.negotiation && (
                              <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black border uppercase tracking-wider ${
                                want.negotiation === 'Firm' 
                                  ? 'bg-gray-50 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10' 
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>
                                {want.negotiation === 'Firm' ? '不議價' : '可議價'}
                              </div>
                            )}
                          </div>
                          {isOwnProfile && (
                            <div className="flex items-center gap-0.5 sm:gap-1 ml-2 shrink-0">
                              <Link 
                                to={`/edit-want/${want.id}`}
                                className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-400 hover:bg-gray-50 dark:bg-white/5 rounded-lg sm:rounded-xl transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Link>
                              <button 
                                onClick={(e) => handleDeleteWant(want.id, e)}
                                className="p-1.5 sm:p-2 text-gray-500 hover:text-red-400 hover:bg-gray-50 dark:bg-white/5 rounded-lg sm:rounded-xl transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white mb-0.5 sm:mb-1 line-clamp-2 leading-tight tracking-tight group-hover:text-blue-400 transition-colors">{want.title}</h3>
                        {want.englishName && (
                          <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 mb-1 sm:mb-2 line-clamp-1">
                            {want.englishName}
                          </p>
                        )}
                        <div className="flex items-baseline gap-1 sm:gap-1.5">
                          <span className="text-[9px] sm:text-[10px] font-black text-blue-400">預算</span>
                          <p className="text-base sm:text-xl font-black text-blue-400 tracking-tighter">HK${(want.targetPrice * 7.8).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-bold text-gray-500">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>{new Date(want.createdAt?.toDate()).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteWant(want.id, e);
                        }}
                        className={`${isOwnProfile ? 'text-red-500 hover:text-red-400' : 'text-gray-600 pointer-events-none opacity-0'} text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 sm:gap-1.5 hover:bg-red-500/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg`}
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
                  className="px-10 py-4 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 dark:bg-white/10 transition-all flex items-center gap-2 border border-gray-100 dark:border-white/5"
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
            <div className="space-y-6">
              {myReviews.length === 0 ? (
                <div className="py-32 text-center bg-white dark:bg-[#1c1c1e] rounded-[4rem] border border-dashed border-gray-200 dark:border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-600/5 to-transparent"></div>
                  <div className="w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10">
                    <Star className="w-16 h-16 text-amber-500" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight relative z-10">建立您的聲譽</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto font-medium leading-relaxed relative z-10">
                    完成交易後，買家將可以為您評分。良好的信用是成功交易的關鍵！
                  </p>
                </div>
              ) : (
                myReviews.map(review => (
                  <div key={review.id} className="bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:border-white/20 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 group">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                      <div className="relative">
                        <img 
                          src={review.buyerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.buyerId}`} 
                          alt={review.buyerName} 
                          className="w-16 h-16 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl object-cover"
                          loading="lazy"
                         referrerPolicy="no-referrer" />
                        <div className="absolute -bottom-2 -right-2 bg-amber-500 p-1.5 rounded-xl border-4 border-[#0d0d0d]">
                          <Star className="w-3 h-3 text-gray-900 dark:text-white fill-current" />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{review.buyerName}</h4>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-lg border border-gray-100 dark:border-white/5">
                            {review.createdAt ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true }) : '剛剛'}
                          </span>
                        </div>
                        <div className="flex gap-1 mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} 
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <div className="relative mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 italic">
                            <Quote className="absolute -left-2 -top-2 w-6 h-6 text-gray-900 dark:text-white/10 -z-10" />
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                              「{review.comment}」
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                          <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                            <Package className="w-3.5 h-3.5" />
                          </div>
                          <span>關於商品：<span className="text-blue-400">{review.listingTitle}</span></span>
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
                  className="px-10 py-4 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 dark:bg-white/10 transition-all flex items-center gap-2 border border-gray-100 dark:border-white/5"
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
