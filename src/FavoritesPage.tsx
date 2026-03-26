import React, { useEffect, useState } from 'react';
import { Heart, Search, Star, Repeat, Calendar, Trash2, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, deleteDoc, limit } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { Listing } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ConditionBadge } from './components/ConditionBadge';

export const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.isGuest) {
      if (!user || user.isGuest) navigate('/auth');
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'favorites'),
          where('userId', '==', user.uid),
          limit(50)
        );

        const snapshot = await getDocs(q);
        const favoriteItems = snapshot.docs.map(doc => ({
          id: doc.id,
          listingId: doc.data().listingId
        }));

        if (favoriteItems.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        // Fetch listings in chunks of 30 (Firestore limit for 'in' query)
        const listingIds = favoriteItems.map(f => f.listingId);
        const chunks = [];
        for (let i = 0; i < listingIds.length; i += 30) {
          chunks.push(listingIds.slice(i, i + 30));
        }

        const listingPromises = chunks.map(chunk => 
          getDocs(query(collection(db, 'listings'), where('__name__', 'in', chunk)))
        );

        const listingSnapshots = await Promise.all(listingPromises);
        const listingsMap = new Map();
        listingSnapshots.forEach(snap => {
          snap.docs.forEach(doc => {
            listingsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
        });

        const combinedResults = favoriteItems
          .map(f => {
            const listing = listingsMap.get(f.listingId);
            if (listing) {
              return { ...listing, favoriteId: f.id };
            }
            return null;
          })
          .filter(r => r !== null) as Listing[];

        setFavorites(combinedResults);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, navigate]);

  const removeFavorite = async (favoriteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen pt-16 bg-white dark:bg-[#030303] transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <Heart className="w-10 h-10 text-red-500 fill-red-500" />
          我的最愛
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
          您收藏的所有卡片都在這裡。
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 dark:bg-[#0d0d0d] rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-red-300 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">沒有收藏任何卡片</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8">快去探索並收藏您喜歡的卡片吧！</p>
          <Link 
            to="/"
            className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20"
          >
            探索卡片
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          <AnimatePresence>
            {favorites.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/listing/${listing.id}`} className="group block h-full">
                  <div className="bg-white dark:bg-[#0d0d0d] rounded-3xl overflow-hidden shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 hover:shadow-xl hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 h-full flex flex-col relative">
                    <button 
                      onClick={(e) => removeFavorite((listing as any).favoriteId, e)}
                      className="absolute top-2 right-2 z-20 p-2 bg-white/80 dark:bg-black/60 backdrop-blur-md rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                        className="absolute top-2 left-2"
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                            {listing.sellerPhoto ? (
                              <img src={listing.sellerPhoto} alt={listing.sellerName} className="w-4 h-4 sm:w-6 sm:h-6 rounded-full" />
                            ) : (
                              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                            )}
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{listing.sellerName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
