import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Camera, AlignLeft, RefreshCw, ChevronLeft } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User as UserType } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserType;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, userData }) => {
  const [displayName, setDisplayName] = useState(userData.displayName || '');
  const [photoURL, setPhotoURL] = useState(userData.photoURL || '');
  const [bio, setBio] = useState(userData.bio || '');
  const [loading, setLoading] = useState(false);
  const [nameChanged, setNameChanged] = useState(!!userData.displayNameChanged);

  const avatarStyles = [
    'avataaars',
    'bottts',
    'pixel-art',
    'adventurer',
    'big-smile',
    'lorelei',
    'notionists',
    'open-peeps'
  ];

  const [currentSeed, setCurrentSeed] = useState(userData.uid);

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
    const newUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
    setPhotoURL(newUrl);
  };

  const predefinedAvatars = [
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=Milo`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Luna`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver`,
    `https://api.dicebear.com/7.x/big-smile/svg?seed=Zoe`,
    `https://api.dicebear.com/7.x/lorelei/svg?seed=Leo`,
    `https://api.dicebear.com/7.x/notionists/svg?seed=Maya`,
    `https://api.dicebear.com/7.x/open-peeps/svg?seed=Max`
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName !== userData.displayName && nameChanged) {
      alert("顯示名稱只能修改一次。");
      return;
    }
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userData.uid);
      const updateData: any = {
        photoURL,
        bio
      };
      if (displayName !== userData.displayName) {
        updateData.displayName = displayName;
        updateData.displayNameChanged = true;
      }
      await updateDoc(userRef, updateData);
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("更新失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-[#0d0d0d] rounded-3xl shadow-2xl w-full max-w-md p-8 border border-gray-100 dark:border-white/10"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center mb-6">
              <button onClick={onClose} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white ml-2">編輯個人資料</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group mb-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-white/10 shadow-xl bg-gray-50 dark:bg-white/5">
                    <img 
                      src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.uid}`} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-90"
                    title="隨機生成頭像"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="w-full">
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 text-center">選擇預設頭像</label>
                  <div className="grid grid-cols-4 gap-3">
                    {predefinedAvatars.map((url, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setPhotoURL(url)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                          photoURL === url 
                            ? 'border-blue-500 ring-2 ring-blue-500/20' 
                            : 'border-transparent bg-gray-50 dark:bg-white/5'
                        }`}
                      >
                        <img src={url} alt={`Avatar ${index}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">顯示名稱</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#16161a] transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">頭像 URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Camera className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="url"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#16161a] transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">個人簡介</label>
                <div className="relative">
                  <div className="absolute top-3 left-4 pointer-events-none">
                    <AlignLeft className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#16161a] transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500 min-h-[100px] resize-none"
                    placeholder="向大家介紹一下你自己吧..."
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-gray-900/20 dark:shadow-none"
              >
                {loading ? '更新中...' : '儲存變更'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
