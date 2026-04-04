import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Listing } from '../types';
import { Trash2, ExternalLink, Search, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminListingManager: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要永久刪除此賣場嗎？此操作無法撤銷。')) return;

    try {
      await deleteDoc(doc(db, 'listings', id));
      setListings(prev => prev.filter(l => l.id !== id));
      alert('賣場已成功移除。');
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert('刪除失敗，請稍後再試。');
    }
  };

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-600 dark:text-gray-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">賣場管理</h3>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋標題或賣家..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">載入中...</div>
      ) : filteredListings.length === 0 ? (
        <div className="py-20 text-center text-gray-500">找不到任何賣場。</div>
      ) : (
        <div className="overflow-x-auto -mx-8 sm:mx-0">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5">
                <th className="pb-5 px-8 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">卡片</th>
                <th className="pb-5 px-8 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">賣家</th>
                <th className="pb-5 px-8 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">價格</th>
                <th className="pb-5 px-8 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">狀態</th>
                <th className="pb-5 px-8 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {filteredListings.map(l => (
                <tr key={l.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden shrink-0">
                        <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{l.title}</div>
                        <div className="text-[10px] text-gray-500 font-medium">{l.cardNumber} • {l.set}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-8">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{l.sellerName}</div>
                    <div className="text-[10px] text-gray-500 font-medium">ID: {l.sellerId.slice(0, 8)}...</div>
                  </td>
                  <td className="py-5 px-8">
                    <div className="text-sm font-black text-gray-900 dark:text-white">HK${(l.price * 7.8).toLocaleString()}</div>
                  </td>
                  <td className="py-5 px-8">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${l.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-50 dark:bg-white/10 text-gray-500'}`}>
                      {l.status === 'active' ? '上架中' : '已售出'}
                    </span>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        to={`/listing/${l.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="查看賣場"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="刪除賣場"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
