import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, where, limit, startAfter } from 'firebase/firestore';
import { db } from './firebase';
import { Listing } from './types';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Star, Repeat, Loader2, Image as ImageIcon, Filter, PlusCircle, X, RefreshCw } from 'lucide-react';
import { ConditionBadge } from './components/ConditionBadge';
import { SearchFilters, FilterCriteria } from './components/SearchFilters';
import { useAuth } from './AuthContext';
import { SellerBadge } from './components/SellerBadge';
import { FavoriteButton } from './components/FavoriteButton';

const ListingSkeleton = () => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 h-full animate-pulse">
    <div className="aspect-[3/4] w-full bg-gray-100 dark:bg-black" />
    <div className="p-2.5 sm:p-5 space-y-3">
      <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
      <div className="h-6 bg-gray-100 dark:bg-white/5 rounded w-1/2" />
      <div className="pt-2 sm:pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gray-100 dark:bg-white/5 rounded-full" />
          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-16" />
        </div>
      </div>
    </div>
  </div>
);

export const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    minPrice: '',
    maxPrice: '',
    condition: '',
    cardType: '',
    rarity: '',
    attribute: '',
    language: ''
  });

  const fetchListings = React.useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setIsFetchingMore(true);

    try {
      let q = query(
        collection(db, 'listings'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const fetchedListings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Listing[];

      if (isInitial) {
        setListings(fetchedListings);
      } else {
        setListings(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const uniqueNew = fetchedListings.filter(l => !existingIds.has(l.id));
          return [...prev, ...uniqueNew];
        });
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 20);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [lastDoc]);

  useEffect(() => {
    fetchListings(true);
  }, []);

  const isFiltering = searchQuery.length > 0 || filters.minPrice !== '' || filters.maxPrice !== '' || filters.condition !== '' || filters.cardType !== '' || filters.rarity !== '' || filters.attribute !== '' || filters.language !== '';

  // Infinite scroll observer
  const observer = React.useRef<IntersectionObserver | null>(null);
  const lastElementRef = React.useCallback((node: HTMLDivElement | null) => {
    if (loading || isFetchingMore || isFiltering) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchListings();
      }
    }, { threshold: 0.1 });

    if (node) observer.current.observe(node);
  }, [loading, isFetchingMore, isFiltering, hasMore, fetchListings]);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (listing.englishName && listing.englishName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMinPrice = filters.minPrice === '' || listing.price >= parseFloat(filters.minPrice);
    const matchesMaxPrice = filters.maxPrice === '' || listing.price <= parseFloat(filters.maxPrice);
    const matchesCondition = filters.condition === '' || listing.condition === filters.condition;
    const matchesCardType = filters.cardType === '' || listing.cardType === filters.cardType;
    const matchesRarity = filters.rarity === '' || listing.rarity === filters.rarity;
    const matchesAttribute = filters.attribute === '' || listing.attribute === filters.attribute;
    const matchesLanguage = filters.language === '' || listing.language === filters.language;

    return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesCondition && matchesCardType && matchesRarity && matchesAttribute && matchesLanguage;
  });

  const [addingToPortfolio, setAddingToPortfolio] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      condition: '',
      cardType: '',
      rarity: '',
      attribute: '',
      language: ''
    });
    setSearchQuery('');
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-2"
          >
            {showToast.includes('成功') ? <PlusCircle className="w-5 h-5 text-green-400" /> : <X className="w-5 h-5 text-red-400" />}
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          搜尋卡片
        </h1>
        <div className="relative w-full flex gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="搜尋噴火龍、皮卡丘..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-gray-100/50 dark:bg-white/5 border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-white/10 transition-all shadow-sm"
              autoFocus
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-2xl border transition-all flex items-center gap-2 font-bold ${showFilters ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#1c1c1e] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'}`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">篩選</span>
          </button>
        </div>

        <SearchFilters filters={filters} setFilters={setFilters} isOpen={showFilters} setIsOpen={setShowFilters} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <ListingSkeleton key={i} />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">找不到卡片</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">請嘗試調整搜尋條件或稍後再試。</p>
          {isFiltering && (
            <button 
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              清除所有篩選
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                ref={index === filteredListings.length - 1 ? lastElementRef : null}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div 
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className="group block h-full cursor-pointer"
                >
                  <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-xl hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100 dark:bg-black relative">
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      {listing.imageUrls && listing.imageUrls.length > 1 && (
                        <div className="absolute bottom-1.5 right-1.5 sm:bottom-3 sm:right-3 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-black/50 backdrop-blur-md rounded-lg text-[8px] sm:text-[10px] font-bold text-white flex items-center gap-1 z-10">
                          <ImageIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>{listing.imageUrls.length}</span>
                        </div>
                      )}
                      <ConditionBadge 
                        condition={listing.condition} 
                        cardType={listing.cardType}
                        title={listing.title} 
                        className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 !h-6 sm:!h-8"
                      />
                      <FavoriteButton listingId={listing.id} className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 z-20" />
                      {listing.negotiation && (
                        <div className={`absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[7px] sm:text-[10px] font-black shadow-sm border ${
                          listing.negotiation === 'Firm' 
                            ? 'bg-gray-900/80 dark:bg-black/60 text-white border-gray-800 dark:border-white/10' 
                            : 'bg-blue-600/80 dark:bg-blue-500/60 text-white border-blue-500 dark:border-blue-400/20'
                        } backdrop-blur-md`}>
                          {listing.negotiation === 'Firm' ? '不議價' : '可議價'}
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 sm:p-5 flex flex-col flex-grow">
                      <h3 className="text-[13px] sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-0.5 sm:mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {listing.title}
                      </h3>
                      {listing.englishName && (
                        <p className="text-[9px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 sm:mb-2 line-clamp-1">
                          {listing.englishName}
                        </p>
                      )}
                      <p className="text-base sm:text-2xl font-black text-gray-900 dark:text-white mb-2 sm:mb-4 tracking-tight">
                        HK${(listing.price * 7.8).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <div className="mt-auto pt-2 sm:pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                          <Link 
                            to={`/profile/${listing.sellerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 sm:gap-2 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {listing.sellerPhoto ? (
                              <img src={listing.sellerPhoto} alt={listing.sellerName} className="w-4 h-4 sm:w-6 sm:h-6 rounded-full" loading="lazy"  referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                            )}
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{listing.sellerName}</span>
                          </Link>
                          
                          {/* Seller Info with Icons */}
                          <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span className="font-bold text-gray-900 dark:text-white">{(listing.sellerRating || 5).toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Repeat className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                              <span className="font-bold text-gray-900 dark:text-white">{listing.sellerCompletedTransactions || 0}</span>
                            </div>
                            <div className="ml-auto sm:ml-0">
                              <SellerBadge 
                                transactions={listing.sellerCompletedTransactions || 0} 
                                rating={listing.sellerRating || 5} 
                                isProfessional={listing.sellerIsProfessionalSeller || false}
                                className="!text-[9px] !px-1.5 !py-0.5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {isFetchingMore && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {!isFetchingMore && hasMore && isFiltering && (
            <div className="flex justify-center py-8">
              <button
                onClick={() => fetchListings()}
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
              >
                載入更多
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

