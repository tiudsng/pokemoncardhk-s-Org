import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';
import { AdminArticleManager } from './components/AdminArticleManager';
import { AdminListingManager } from './components/AdminListingManager';
import { AdminAnalytics } from './components/AdminAnalytics';
import { AdminContentCreator } from './components/AdminContentCreator';
import { Users, BookOpen, ShieldCheck, Package, BarChart3, Bot, Wand2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'articles' | 'listings' | 'analytics' | 'content-creator'>('analytics');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      const snapshot = await getDocs(query(collection(db, 'users'), limit(100)));
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsers();
  }, [user, navigate]);

  if (user?.role !== 'admin') return null;

  return (
    <div className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-4">
            管理員後台
            <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest">Admin Panel</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">管理平台用戶、文章及系統設定</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-10 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-[#1c1c1e] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <BarChart3 className="w-4 h-4" />
          數據分析
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'listings' ? 'bg-white dark:bg-[#1c1c1e] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <Package className="w-4 h-4" />
          賣場管理
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white dark:bg-[#1c1c1e] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <Users className="w-4 h-4" />
          用戶管理
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'articles' ? 'bg-white dark:bg-[#1c1c1e] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <BookOpen className="w-4 h-4" />
          文章管理
        </button>
        <button
          onClick={() => setActiveTab('content-creator')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'content-creator' ? 'bg-white dark:bg-[#1c1c1e] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <Wand2 className="w-4 h-4" />
          全能發佈
        </button>
      </div>

      {activeTab === 'analytics' && <AdminAnalytics />}
      {activeTab === 'listings' && <AdminListingManager />}
      {activeTab === 'content-creator' && <AdminContentCreator />}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-600 dark:text-gray-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">用戶列表</h3>
          </div>
          
          <div className="overflow-x-auto -mx-8 sm:mx-0">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="pb-5 px-8 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">用戶名稱</th>
                  <th className="pb-5 px-8 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email 地址</th>
                  <th className="pb-5 px-8 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">權限角色</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
                          ) : (
                            <Users className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="py-5 px-8 text-sm text-gray-600 dark:text-gray-400 font-medium">{u.email}</td>
                    <td className="py-5 px-8 text-right">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'bg-gray-50 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'articles' && <AdminArticleManager />}
    </div>
  );
};
