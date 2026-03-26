import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, where, limit, startAfter } from 'firebase/firestore';
import { db } from './firebase';
import { Listing } from './types';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Star, Repeat, Loader2, Image as ImageIcon, Filter, PlusCircle, X } from 'lucide-react';
import { ConditionBadge } from './components/ConditionBadge';
import { SearchFilters, FilterCriteria } from './components/SearchFilters';
import { useAuth } from './AuthContext';

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
              className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-lg"
              autoFocus
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-4 rounded-2xl border transition-all ${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-[#0d0d0d] border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/10'}`}
          >
            <Filter className="w-6 h-6" />
          </button>
        </div>

        <SearchFilters filters={filters} setFilters={setFilters} isOpen={showFilters} setIsOpen={setShowFilters} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-[#0d0d0d] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">找不到卡片</h3>
          <p className="text-gray-500 dark:text-gray-400">請嘗試調整搜尋條件或稍後再試。</p>
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
                <Link to={`/listing/${listing.id}`} className="group block h-full">
                  <div className="bg-white dark:bg-[#0d0d0d] rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-xl dark:hover:shadow-none dark:hover:border-white/10 transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100 dark:bg-[#050505] relative">
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {listing.imageUrls && listing.imageUrls.length > 1 && (
                        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-black/50 backdrop-blur-md rounded-lg text-[8px] sm:text-[10px] font-bold text-white flex items-center gap-1 z-10">
                          <ImageIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>{listing.imageUrls.length}</span>
                        </div>
                      )}
                      <ConditionBadge 
                        condition={listing.condition} 
                        cardType={listing.cardType}
                        title={listing.title} 
                        className="absolute top-2 right-2 sm:top-3 sm:right-3"
                      />
                      {listing.negotiation && (
                        <div className={`absolute bottom-2 left-2 sm:bottom-3 sm:left-3 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black shadow-sm border ${
                          listing.negotiation === 'Firm' 
                            ? 'bg-gray-900/80 dark:bg-black/60 text-white border-gray-800 dark:border-white/10' 
                            : 'bg-blue-600/80 dark:bg-blue-500/60 text-white border-blue-500 dark:border-blue-400/20'
                        } backdrop-blur-md`}>
                          {listing.negotiation === 'Firm' ? '不議價' : '可議價'}
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-5 flex flex-col flex-grow">
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 tracking-tight">
                        ${listing.price.toLocaleString()}
                      </p>
                      <div className="mt-auto pt-2 sm:pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-3">
                          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                            {listing.sellerPhoto ? (
                              <img src={listing.sellerPhoto} alt={listing.sellerName} className="w-4 h-4 sm:w-6 sm:h-6 rounded-full" />
                            ) : (
                              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                            )}
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{listing.sellerName}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500" />
                              {(listing.sellerRating ? listing.sellerRating * 100 : 0).toFixed(0)}%
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Repeat className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" />
                              {listing.sellerCompletedTransactions || 0}次
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
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
