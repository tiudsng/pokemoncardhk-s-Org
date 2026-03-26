import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsers();
  }, [user, navigate]);

  if (user?.role !== 'admin') return null;

  return (
    <div className="pt-24 px-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black mb-8">管理員後台</h1>
      <div className="bg-white dark:bg-[#0d0d0d] p-6 rounded-3xl border border-gray-100 dark:border-white/5">
        <h2 className="text-xl font-bold mb-4">用戶列表</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-sm">
              <th className="pb-4">名稱</th>
              <th className="pb-4">Email</th>
              <th className="pb-4">角色</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-gray-100 dark:border-white/5">
                <td className="py-4">{u.displayName}</td>
                <td className="py-4">{u.email}</td>
                <td className="py-4">{u.role || 'user'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
