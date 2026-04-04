import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Package, Eye, Loader2, RefreshCw } from 'lucide-react';

interface AnalyticsData {
  totalViews: number;
  daily: { views: number; date: string }[];
  listingsCount: number;
  usersCount: number;
}

export const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        const result = await response.json();
        // Sort daily data by date
        result.daily.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#1c1c1e] rounded-[2rem] border border-gray-100 dark:border-white/5">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-bold">正在分析流量數據...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Eye className="w-6 h-6" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{data.totalViews.toLocaleString()}</div>
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">總瀏覽量</div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{data.usersCount.toLocaleString()}</div>
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">註冊用戶</div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{data.listingsCount.toLocaleString()}</div>
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">活躍賣場</div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-center items-center">
          <button 
            onClick={fetchAnalytics}
            className="p-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all active:scale-95"
          >
            <RefreshCw className="w-6 h-6 text-gray-400" />
          </button>
          <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-4">重新整理數據</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">每日瀏覽趨勢</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                  dy={10}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  itemStyle={{ color: '#2563eb' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">流量分佈</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                  dy={10}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                />
                <Bar dataKey="views" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
