import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, where, doc, setDoc, arrayUnion, limit, getDocs, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import { Listing, WantListing, PortfolioItem } from './types';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, ChevronRight, ChevronLeft, Clock, ShoppingBag, PlusCircle, Camera, Star, Repeat, Calendar, Filter, X, Image as ImageIcon, Briefcase, Loader2, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { ARTICLES } from './articleData';
import { useAuth } from './AuthContext';
import { ConditionBadge } from './components/ConditionBadge';
import { FavoriteButton } from './components/FavoriteButton';

const FeaturedArticle = ({ article }: { article: any }) => {
  const Icon = article.icon;
  return (
    <Link to={`/article/${article.id}`} className="group relative bg-white dark:bg-[#0d0d0d] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-white/5 flex flex-col h-full w-[90vw] sm:min-w-[350px] sm:w-auto snap-center shrink-0">
      <div className="relative h-56 sm:h-48 overflow-hidden bg-gray-100 dark:bg-[#050505] shrink-0">
        <div className="absolute inset-0 bg-gray-900/20 dark:bg-black/40 group-hover:bg-transparent transition-colors z-10" />
        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" loading="lazy" />
        <div className="absolute top-4 left-4 z-20">
          <span className="px-3 py-1 bg-white/90 dark:bg-black/60 backdrop-blur-xl text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider rounded-full border border-transparent dark:border-white/10">
            {article.category}
          </span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {article.readTime}
          </span>
          <span>•</span>
          <span>{article.date}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{article.title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-grow">{article.excerpt}</p>
        <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between mt-auto">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${article.color} flex items-center justify-center text-white shadow-sm`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            閱讀 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [wantListings, setWantListings] = useState<WantListing[]>([]);
  const [lastListingDoc, setLastListingDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastWantDoc, setLastWantDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreListings, setHasMoreListings] = useState(true);
  const [hasMoreWants, setHasMoreWants] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isFetchingMoreWants, setIsFetchingMoreWants] = useState(false);
  const [activeTab, setActiveTab] = useState<'sell' | 'want'>('sell');
  const [loading, setLoading] = useState(true);
  const [loadingWants, setLoadingWants] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cardPrices, setCardPrices] = useState<any[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);

  // Fetch market prices from Firestore card_prices collection
  const fetchCardPrices = async () => {
    try {
      const FIREBASE_PROJECT_ID = 'gen-lang-client-0326385388';
      const FIREBASE_API_KEY = 'AIzaSyDSwhKXm7KqaHVO2kb2PQ6qmarySPcZyJ0';
      const DATABASE_ID = 'abcd';

      const response = await axios.post(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${DATABASE_ID}/documents:runQuery`,
        {
          structuredQuery: {
            from: { collectionId: 'card_prices' },
            orderBy: [{ field: { fieldPath: 'latest_price_hkd' }, direction: 'DESCENDING' }],
            limit: 10
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': FIREBASE_API_KEY,
            'X-Goog-User-Project': FIREBASE_PROJECT_ID
          }
        }
      );

      const fetched: any[] = [];
      for (const doc of response.data) {
        if (doc.document) {
          const f = doc.document.fields || {};
          fetched.push({
            id: doc.document.name.split('/').pop(),
            card_name: f.card_name?.stringValue || f.title?.stringValue || 'Unknown',
            grade: f.grade?.stringValue || '',
            latest_price_sgd: f.latest_price_sgd?.integerValue || 0,
            latest_price_hkd: f.latest_price_hkd?.integerValue || Math.round((f.latest_price_sgd?.integerValue || 0) * 6.1),
            latest_price_jpy: f.latest_price_jpy?.integerValue,
            source: f.source?.stringValue || 'Snkrdunk',
            url: f.url?.stringValue || '',
            scrape_time: f.scrape_time?.stringValue || '',
          });
        }
      }
      setCardPrices(fetched);
      setPricesLoading(false);
    } catch (err) {
      console.error('Price fetch error:', err);
      setPricesLoading(false);
    }
  };

  useEffect(() => {
    fetchCardPrices();
  }, []);
  const [filters, setFilters] = useState({
    conditions: [] as string[],
    cardTypes: [] as string[],
    minPrice: '',
    maxPrice: ''
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleProtectedAction = (e: React.MouseEvent) => {
    if (!user || user.isGuest) {
      e.preventDefault();
      navigate('/auth');
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      // 取得單個卡片的寬度加上 gap (24px)
      const cardWidth = container.firstElementChild?.clientWidth || 350;
      const gap = 24; 
      const itemWidth = cardWidth + gap;
      
      const scrollAmount = direction === 'left' ? -itemWidth : itemWidth;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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

      if (!isInitial && lastListingDoc) {
        q = query(q, startAfter(lastListingDoc));
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
          // Prevent duplicates
          const existingIds = new Set(prev.map(l => l.id));
          const uniqueNew = fetchedListings.filter(l => !existingIds.has(l.id));
          return [...prev, ...uniqueNew];
        });
      }

      setLastListingDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreListings(snapshot.docs.length === 20);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [lastListingDoc]);

  const fetchWants = React.useCallback(async (isInitial = false) => {
    if (isInitial) setLoadingWants(true);
    else setIsFetchingMoreWants(true);

    try {
      let q = query(
        collection(db, 'wantListings'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      if (!isInitial && lastWantDoc) {
        q = query(q, startAfter(lastWantDoc));
      }

      const snapshot = await getDocs(q);
      const fetchedWants = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WantListing[];

      if (isInitial) {
        setWantListings(fetchedWants);
      } else {
        setWantListings(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(l => l.id));
          const uniqueNew = fetchedWants.filter(l => !existingIds.has(l.id));
          return [...prev, ...uniqueNew];
        });
      }

      setLastWantDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreWants(snapshot.docs.length === 20);
    } catch (error) {
      console.error("Error fetching want listings:", error);
    } finally {
      setLoadingWants(false);
      setIsFetchingMoreWants(false);
    }
  }, [lastWantDoc]);

  useEffect(() => {
    fetchListings(true);
    fetchWants(true);
  }, []);

  const isFiltering = searchQuery.length > 0 || filters.conditions.length > 0 || filters.cardTypes.length > 0 || filters.minPrice !== '' || filters.maxPrice !== '';

  // Infinite scroll observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = React.useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingWants || isFetchingMore || isFetchingMoreWants || isFiltering) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (activeTab === 'sell' && hasMoreListings) {
          fetchListings();
        } else if (activeTab === 'want' && hasMoreWants) {
          fetchWants();
        }
      }
    }, { threshold: 0.1 });

    if (node) observer.current.observe(node);
  }, [loading, loadingWants, isFetchingMore, isFetchingMoreWants, isFiltering, activeTab, hasMoreListings, hasMoreWants, fetchListings, fetchWants]);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCondition = filters.conditions.length === 0 || filters.conditions.includes(listing.condition);
    const matchesCardType = filters.cardTypes.length === 0 || (listing.cardType && filters.cardTypes.includes(listing.cardType));
    
    const price = listing.price;
    const matchesMinPrice = !filters.minPrice || price >= parseFloat(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || price <= parseFloat(filters.maxPrice);

    return matchesSearch && matchesCondition && matchesCardType && matchesMinPrice && matchesMaxPrice;
  });

  const filteredWantListings = wantListings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCondition = filters.conditions.length === 0 || filters.conditions.includes(listing.condition || 'Mint');
    const matchesCardType = filters.cardTypes.length === 0 || (listing.cardType && filters.cardTypes.includes(listing.cardType));
    
    const price = listing.targetPrice;
    const matchesMinPrice = !filters.minPrice || price >= parseFloat(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || price <= parseFloat(filters.maxPrice);

    return matchesSearch && matchesCondition && matchesCardType && matchesMinPrice && matchesMaxPrice;
  });

  const toggleFilter = (type: 'conditions' | 'cardTypes', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      conditions: [],
      cardTypes: [],
      minPrice: '',
      maxPrice: ''
    });
  };

  const activeFilterCount = filters.conditions.length + filters.cardTypes.length + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0);

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
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 sm:mb-12 gap-4 sm:gap-6">
        <div className="hidden sm:block">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            買卡區
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
            探索並購買稀有寶可夢卡牌。
          </p>
        </div>

        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-grow md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="搜尋噴火龍、皮卡丘..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-gray-100/50 dark:bg-white/5 border-0 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-white/10 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-2xl border transition-all flex items-center gap-2 font-bold ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-[#0d0d0d] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">篩選</span>
            {activeFilterCount > 0 && (
              <span className="bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filters Bar */}
      {activeFilterCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 mb-6"
        >
          <span className="text-sm font-bold text-gray-400 dark:text-gray-500 mr-1">已套用:</span>
          
          {filters.conditions.map(cond => (
            <button
              key={`chip-cond-${cond}`}
              onClick={() => toggleFilter('conditions', cond)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              {cond === 'Mint' ? '美品' : cond}
              <X className="w-3 h-3" />
            </button>
          ))}
          
          {filters.cardTypes.map(type => (
            <button
              key={`chip-type-${type}`}
              onClick={() => toggleFilter('cardTypes', type)}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              {type}
              <X className="w-3 h-3" />
            </button>
          ))}
          
          {filters.minPrice && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, minPrice: '' }))}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full text-xs font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
            >
              ${filters.minPrice}+
              <X className="w-3 h-3" />
            </button>
          )}
          
          {filters.maxPrice && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, maxPrice: '' }))}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full text-xs font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
            >
              -${filters.maxPrice}
              <X className="w-3 h-3" />
            </button>
          )}
          
          <button
            onClick={clearFilters}
            className="text-xs font-bold text-red-500 hover:text-red-600 px-2 py-1 transition-colors"
          >
            清除全部
          </button>
        </motion.div>
      )}

      {/* Filters Panel */}
      <motion.div
        initial={false}
        animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
        className="overflow-hidden mb-8"
      >
        <div className="bg-white dark:bg-[#0d0d0d] rounded-[2rem] p-6 sm:p-8 border border-gray-100 dark:border-white/5 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">篩選條件</h3>
            <button 
              onClick={clearFilters}
              className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              清除全部
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Condition Filter */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">卡片狀態</h4>
              <div className="flex flex-wrap gap-2">
                {['Mint', 'Near Mint', 'Excellent', 'Good', 'Lightly Played', 'Played', 'Poor'].map((cond) => (
                  <button
                    key={cond}
                    onClick={() => toggleFilter('conditions', cond)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      filters.conditions.includes(cond)
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-black/20 border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-white/10'
                    }`}
                  >
                    {cond === 'Mint' ? '美品' : cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Type Filter */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">卡片類型</h4>
              <div className="flex flex-wrap gap-2">
                {['RAW', 'PSA 10', 'PSA 9', 'PSA 8', 'BGS', 'CGC'].map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleFilter('cardTypes', type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      filters.cardTypes.includes(type)
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-black/20 border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">價格範圍 (HKD)</h4>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="最低"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-gray-400 dark:text-gray-500">—</span>
                <input
                  type="number"
                  placeholder="最高"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>



      {/* Featured Articles Section */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            收藏家指南
          </h2>
          <Link to="/articles" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="relative group/carousel">
          {showLeftArrow && (
            <button 
              onClick={(e) => { e.preventDefault(); scroll('left'); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-[#16161a] shadow-xl border border-gray-100 dark:border-white/10 text-gray-800 dark:text-white w-10 h-10 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-110 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 sm:-left-6 sm:w-12 sm:h-12"
              aria-label="Previous articles"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto gap-6 pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory no-scrollbar scroll-smooth"
          >
            {ARTICLES.map(article => (
              <FeaturedArticle key={article.id} article={article} />
            ))}
          </div>

          {showRightArrow && (
            <button 
              onClick={(e) => { e.preventDefault(); scroll('right'); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-[#16161a] shadow-xl border border-gray-100 dark:border-white/10 text-gray-800 dark:text-white w-10 h-10 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-110 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 sm:-right-6 sm:w-12 sm:h-12"
              aria-label="Next articles"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Market Prices Section - Bento Grid */}
      {cardPrices.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">市場行情</h2>
          </div>
          
          {pricesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {cardPrices.map((card, index) => (
                <div 
                  key={card.id}
                  className={`relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                    index === 0 
                      ? 'bg-gradient-to-br from-amber-900/30 to-orange-900/20 border-amber-500/30' 
                      : 'bg-white dark:bg-[#0d0d0d] border-gray-100 dark:border-white/10 hover:shadow-lg'
                  }`}
                >
                  {/* Rank */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black rounded-full z-10">
                      #1
                    </div>
                  )}
                  
                  <div className="p-4">
                    {/* Card Visual */}
                    <div className={`w-full aspect-[3/4] rounded-xl mb-3 flex items-center justify-center ${
                      index === 0 ? 'bg-amber-500/20' : 'bg-gray-50 dark:bg-white/5'
                    }`}>
                      <span className="text-3xl">
                        {card.card_name.toLowerCase().includes('charizard') ? '🔥' :
                         card.card_name.toLowerCase().includes('pikachu') || card.card_name.toLowerCase().includes('van gogh') ? '⚡' :
                         card.card_name.toLowerCase().includes('lugia') ? '🦅' :
                         card.card_name.toLowerCase().includes('rayquaza') ? '🐉' :
                         card.card_name.toLowerCase().includes('giratina') ? '👾' :
                         card.card_name.toLowerCase().includes('mewtwo') ? '🧬' :
                         card.card_name.toLowerCase().includes('gengar') ? '👻' :
                         card.card_name.toLowerCase().includes('dragonite') ? '🐲' : '🎴'}
                      </span>
                    </div>
                    
                    {/* Name */}
                    <h3 className="font-bold text-gray-900 dark:text-white text-xs leading-tight mb-1 line-clamp-2">
                      {card.card_name}
                    </h3>
                    <p className="text-gray-400 text-[10px] mb-2">{card.grade} · {card.source}</p>
                    
                    {/* Price */}
                    <div className="border-t border-gray-100 dark:border-white/10 pt-2">
                      <p className="text-gray-500 text-[10px]">HKD</p>
                      <p className={`font-black tracking-tight leading-none ${
                        index === 0 
                          ? 'text-xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500' 
                          : 'text-lg text-gray-900 dark:text-white'
                      }`}>
                        ${card.latest_price_hkd.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 scroll-mt-24" id="listings-section">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">最新上架</h2>
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-transparent dark:border-white/5">
          <button
            onClick={() => setActiveTab('sell')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'sell'
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            賣卡區
          </button>
          <button
            onClick={() => setActiveTab('want')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'want'
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            徵卡區
          </button>
        </div>
      </div>

      {activeTab === 'sell' ? (
        loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">找不到卡片</h3>
            <p className="text-gray-500 dark:text-gray-400">請嘗試調整搜尋條件或稍後再試。</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index % 20 * 0.05 }}
                ref={index === filteredListings.length - 1 ? lastElementRef : null}
              >
                <div 
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className="group block h-full cursor-pointer"
                >
                  <div className="bg-white dark:bg-[#0d0d0d] rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-xl hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100 dark:bg-[#050505] relative">
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
                      <p className="text-base sm:text-2xl font-black text-gray-900 dark:text-white mb-2 sm:mb-4 tracking-tight">
                        ${listing.price.toLocaleString()}
                      </p>
                      <div className="mt-auto pt-2 sm:pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-3">
                          <Link 
                            to={`/profile/${listing.sellerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 sm:gap-2 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {listing.sellerPhoto ? (
                              <img src={listing.sellerPhoto} alt={listing.sellerName} className="w-4 h-4 sm:w-6 sm:h-6 rounded-full" />
                            ) : (
                              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                            )}
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{listing.sellerName}</span>
                          </Link>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 fill-amber-500" />
                              {(listing.sellerRating || 5).toFixed(1)}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Repeat className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500 dark:text-blue-400" />
                              {listing.sellerCompletedTransactions || 0}次
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {isFetchingMore && (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            {!isFetchingMore && hasMoreListings && isFiltering && (
              <div className="col-span-full flex justify-center py-8">
                <button
                  onClick={() => fetchListings()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
                >
                  載入更多
                </button>
              </div>
            )}
          </div>
        )
      ) : (
          loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : filteredWantListings.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-[#0d0d0d] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">找不到徵卡</h3>
            <p className="text-gray-500 dark:text-gray-400">目前沒有相關的徵卡需求。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredWantListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index % 20 * 0.05 }}
                ref={index === filteredWantListings.length - 1 ? lastElementRef : null}
                className="bg-white dark:bg-[#0d0d0d] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-xl hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 flex flex-col h-full"
              >
                <div className="flex items-start gap-4 mb-4">
                  {listing.imageUrl ? (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-200 dark:border-white/10">
                      <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover bg-gray-100 dark:bg-[#050505]" referrerPolicy="no-referrer" loading="lazy" />
                      {listing.imageUrls && listing.imageUrls.length > 1 && (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded-md text-[8px] font-bold text-white flex items-center gap-0.5">
                          <ImageIcon className="w-2 h-2" />
                          <span>{listing.imageUrls.length}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <ConditionBadge 
                        condition={listing.condition || 'Mint'} 
                        cardType={listing.cardType}
                        title={listing.title} 
                        className="!px-2 !py-0.5 !text-[8px] !h-auto"
                      />
                      {listing.negotiation && (
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black border ${
                          listing.negotiation === 'Firm' 
                            ? 'bg-gray-50 dark:bg-black/40 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10' 
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-400/20'
                        }`}>
                          {listing.negotiation === 'Firm' ? '不議價' : '可議價'}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 mb-1">{listing.title}</h3>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      預算 ${listing.targetPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <Link 
                      to={`/profile/${listing.buyerId}`}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/buyer"
                    >
                      {listing.buyerPhoto ? (
                        <img src={listing.buyerPhoto} alt={listing.buyerName} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-none mb-1 group-hover/buyer:text-blue-600 dark:group-hover/buyer:text-blue-400 transition-colors">{listing.buyerName}</span>
                        <div className="flex items-center gap-1 text-[9px] text-gray-400 dark:text-gray-500">
                          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          <span>{(listing.buyerRating || 5).toFixed(1)} ({listing.buyerTotalReviews || 0})</span>
                        </div>
                      </div>
                    </Link>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {listing.createdAt ? new Date(listing.createdAt.toDate()).toLocaleDateString() : ''}
                    </span>
                  </div>
              </motion.div>
            ))}
            {isFetchingMoreWants && (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            {!isFetchingMoreWants && hasMoreWants && isFiltering && (
              <div className="col-span-full flex justify-center py-8">
                <button
                  onClick={() => fetchWants()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
                >
                  載入更多
                </button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
