import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { useAuth } from './AuthContext';
import { PortfolioItem } from './types';
import { motion } from 'motion/react';
import { Loader2, TrendingUp, Eye, BarChart2, Calculator, Edit3, Send, ChevronUp, ChevronDown, MoreHorizontal, Briefcase, PlusCircle, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EditPortfolioModal } from './components/EditPortfolioModal';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ExtendedPortfolioItem extends PortfolioItem {
  set: string;
  rarity: string;
  number: string;
  condition: string;
  finish: string;
  qty: number;
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
}

export const PortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExtendedPortfolioItem[]>([]);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchPortfolio = async () => {
    if (!user || user.isGuest) {
      setLoading(false);
      return;
    }

    try {
      const portfolioRef = doc(db, 'portfolios', user.uid);
      const docSnap = await getDoc(portfolioRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const portfolioItems: PortfolioItem[] = data.items || [];
        
        // Map real items to extended items with some mock market data for display
        const extendedItems: ExtendedPortfolioItem[] = portfolioItems.map(item => ({
          ...item,
          set: 'Pokemon TCG',
          rarity: 'Rare',
          number: '000/000',
          condition: 'Near Mint',
          finish: 'Holofoil',
          qty: 1,
          currentPrice: (item.purchasePrice || 0) * (1 + (Math.random() * 0.1 - 0.02)), // Mock 2% loss to 8% gain
          changeAmount: 0, // Calculated below
          changePercent: 0 // Calculated below
        })).map(item => {
          const purchasePrice = item.purchasePrice || 0;
          const changeAmount = item.currentPrice - purchasePrice;
          const changePercent = purchasePrice > 0 ? (changeAmount / purchasePrice) * 100 : 0;
          return { ...item, changeAmount, changePercent };
        });

        setItems(extendedItems);
      } else {
        setItems([]);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `portfolios/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [user]);

  const handleSaveItem = async (updatedItem: PortfolioItem) => {
    if (!user) return;
    try {
      const portfolioRef = doc(db, 'portfolios', user.uid);
      const newItems = items.map(item => item.id === updatedItem.id ? updatedItem : item);
      await updateDoc(portfolioRef, { items: newItems });
      await fetchPortfolio();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `portfolios/${user.uid}`);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    try {
      const portfolioRef = doc(db, 'portfolios', user.uid);
      const newItems = items.filter(item => item.id !== itemId);
      await updateDoc(portfolioRef, { items: newItems });
      await fetchPortfolio();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `portfolios/${user.uid}`);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.currentPrice || 0), 0);
  const totalProfit = items.reduce((sum, item) => sum + (item.changeAmount || 0), 0);
  const totalPurchasePrice = totalValue - totalProfit;
  const totalProfitPercent = totalPurchasePrice > 0 ? (totalProfit / totalPurchasePrice) * 100 : 0;

  if (loading) return <div className="flex justify-center items-center h-screen bg-white dark:bg-[#050505]"><Loader2 className="animate-spin w-8 h-8 text-red-600" /></div>;

  if (!user || user.isGuest) {
    return (
      <div className="pt-32 pb-24 px-4 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">請先登入</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">登入後即可開始管理您的卡片投資組合，追蹤市場價值與收益。</p>
        <Link to="/auth" className="block w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-600/20">
          立即登入
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-screen bg-white dark:bg-[#050505]"
    >
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-gray-500 dark:text-gray-400 font-bold text-lg">Portfolio:</span>
          <span className="text-red-500 dark:text-red-400 font-bold text-lg">Main</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-black text-gray-900 dark:text-white">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h1>
            <button className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
              <Eye className="w-5 h-5" />
            </button>
          </div>
          {items.length > 0 && (
            <div className={`flex items-center gap-1 font-bold text-sm ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalProfit >= 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>${Math.abs(totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({totalProfitPercent.toFixed(2)}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-12 max-w-xl mx-auto">
        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 rounded-full border-2 border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors">
            <BarChart2 className="w-6 h-6" />
          </button>
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 text-center leading-tight">Market<br/>Movers</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 rounded-full border-2 border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 hover:border-red-500/30 hover:text-red-500 transition-colors">
            <Calculator className="w-6 h-6" />
          </button>
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 text-center leading-tight">Trade<br/>Analyzer</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 rounded-full border-2 border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 hover:border-red-500/30 hover:text-red-500 transition-colors">
            <Edit3 className="w-6 h-6" />
          </button>
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 text-center leading-tight">Bulk Actions</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button className="w-14 h-14 rounded-full border-2 border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 hover:border-red-500/30 hover:text-red-500 transition-colors">
            <Send className="w-6 h-6" />
          </button>
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 text-center leading-tight">Export</span>
        </div>
      </div>

      {/* Cards Grid */}
      {items.length === 0 ? (
        <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-white/10">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">投資組合還是空的</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">您的投資組合目前沒有卡片。您可以瀏覽市場並收藏您感興趣的卡片。</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">
            去逛逛
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-6">
          {items.map((item) => (
            <motion.div 
              key={item.id}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-[#0d0d0d] rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 p-3 sm:p-5 flex flex-col shadow-sm"
            >
              <div className="flex justify-center mb-3 sm:mb-6">
                <div className="relative group">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full max-w-[120px] sm:w-48 h-auto object-contain drop-shadow-xl transition-transform group-hover:scale-105" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                  <h3 className="text-xs sm:text-xl font-black text-gray-900 dark:text-white line-clamp-1">{item.title}</h3>
                  <button 
                    onClick={() => {
                      setEditingItem(item);
                      setIsEditModalOpen(true);
                    }}
                    className="p-1.5 sm:p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-bold text-[10px] sm:text-sm line-clamp-1">{item.set}</p>
                <p className="text-gray-500 dark:text-gray-400 text-[8px] sm:text-xs mb-0.5 sm:mb-1">
                  {item.rarity} • {item.number}
                </p>
                <p className="text-red-500 dark:text-red-400 font-bold text-[8px] sm:text-xs mb-2 sm:mb-4">
                  {item.condition} • {item.finish}
                </p>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-auto gap-1 sm:gap-0">
                  <div className="hidden sm:block">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Qty: {item.qty}</p>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Cost: ${(item.purchasePrice || 0).toLocaleString()}</p>
                  </div>
                  <div className="w-full sm:text-right">
                    <div className={`flex items-center sm:justify-end gap-0.5 sm:gap-1 font-bold text-[10px] sm:text-sm ${item.changeAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.changeAmount >= 0 ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                      <span>${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-gray-400 text-[8px] sm:text-[10px] font-bold">
                      {item.changeAmount >= 0 ? '+' : ''}${item.changeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({item.changePercent.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <button className="fixed bottom-24 right-6 w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center shadow-lg sm:hidden">
        <ChevronUp className="w-6 h-6" />
      </button>

      <EditPortfolioModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        item={editingItem}
      />
    </motion.div>
  );
};
