import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, CheckCircle2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface User {
  id: string;
  displayName: string;
}

export const AdminClonePoster: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Form State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [postType, setPostType] = useState<'放售' | '徵卡'>('放售');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [content, setContent] = useState('');
  const [postTime, setPostTime] = useState(() => {
    // Default to current local time in YYYY-MM-DDThh:mm format
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          displayName: doc.data().displayName || 'Unknown User'
        }));
        // Sort alphabetically for easier finding
        usersList.sort((a, b) => a.displayName.localeCompare(b.displayName));
        setUsers(usersList);
        if (usersList.length > 0) {
          setSelectedUserId(usersList[0].id);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("圖片上傳失敗。");
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !price || !content) return;

    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const selectedUser = users.find(u => u.id === selectedUserId);
      const authorName = selectedUser?.displayName || 'Unknown';
      
      const selectedDate = new Date(postTime);

      await addDoc(collection(db, 'posts'), {
        author_id: selectedUserId,
        author_name: authorName,
        type: postType,
        price: Number(price),
        content: content,
        image_url: imageUrl,
        created_at: Timestamp.fromDate(selectedDate)
      });

      setSuccessMsg('發佈成功！');
      setContent('');
      setImageUrl('');
      
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("發佈失敗，請檢查控制台。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">人肉分身發佈後台</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">手動控制虛擬用戶發文</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 用戶選擇 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            選擇用戶
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
            disabled={loadingUsers}
            required
          >
            {loadingUsers ? (
              <option>載入中...</option>
            ) : (
              users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 類型選擇 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            發文類型
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="postType"
                value="放售"
                checked={postType === '放售'}
                onChange={(e) => setPostType(e.target.value as '放售' | '徵卡')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-900 dark:text-white font-medium">放售</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="postType"
                value="徵卡"
                checked={postType === '徵卡'}
                onChange={(e) => setPostType(e.target.value as '放售' | '徵卡')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-900 dark:text-white font-medium">徵卡</span>
            </label>
          </div>
        </div>

        {/* 圖片輸入 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            圖片
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-32 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 relative group">
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="輸入圖片 URL 或上傳本機圖片"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
              />
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 cursor-pointer transition-all">
                  <UploadCloud className="w-5 h-5" />
                  上傳本機圖片
                  <input 
                    type="file"
                    accept="image/*,.heic,.heif,.webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400">支援多種格式</p>
              </div>
            </div>
          </div>
        </div>

        {/* 價格輸入 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            價錢 (HKD)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="例如: 100"
            min="0"
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
          />
        </div>

        {/* 描述輸入 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            內容描述 (地道廣東話)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="例如: 完美品，有意PM，可面交..."
            required
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white resize-y"
          />
        </div>

        {/* 時間設定 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            發佈時間
          </label>
          <input
            type="datetime-local"
            value={postTime}
            onChange={(e) => setPostTime(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
          />
        </div>

        {/* 提交按鈕 */}
        <div className="pt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting || loadingUsers}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                發佈中...
              </>
            ) : (
              '立即發佈'
            )}
          </button>
          
          {successMsg && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
              <CheckCircle2 className="w-5 h-5" />
              {successMsg}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
