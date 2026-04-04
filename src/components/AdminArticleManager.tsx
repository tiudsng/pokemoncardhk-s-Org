import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Plus, Sparkles, Loader2, Trash2, Edit3, ExternalLink, Save, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateArticle, generateArticleImage } from '../services/geminiService';
import { useAuth } from '../AuthContext';
import imageCompression from 'browser-image-compression';

export const AdminArticleManager: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', category: '', imageUrl: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const compressBase64 = async (base64: string) => {
    try {
      const response = await fetch(base64);
      const blob = await response.blob();
      const file = new File([blob], "ai-image.png", { type: "image/png" });
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true
      });
      return await imageCompression.getDataUrlFromFile(compressedFile);
    } catch (error) {
      console.error("Compression error:", error);
      return base64;
    }
  };

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
        setEditForm(prev => ({ ...prev, imageUrl: reader.result as string }));
        setIsUploading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("圖片上傳失敗。");
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArticles(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const articleData = await generateArticle(topic);
      if (articleData) {
        // Generate a custom AI image based on the title
        let aiImage = await generateArticleImage(articleData.title);
        if (aiImage) {
          aiImage = await compressBase64(aiImage);
        }
        
        await addDoc(collection(db, 'articles'), {
          ...articleData,
          imageUrl: aiImage || articleData.imageUrl, // Use AI image if successful, fallback to Unsplash
          authorId: user?.uid,
          authorName: user?.displayName,
          createdAt: serverTimestamp(),
        });
        setTopic('');
      } else {
        setError("無法生成文章，請檢查 API Key 或稍後再試。");
      }
    } catch (error) {
      console.error("Error generating/saving article:", error);
      setError("AI 生成出錯，請稍後再試。");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImageForEdit = async () => {
    if (!editForm.title) return;
    setIsGeneratingImage(true);
    try {
      let aiImage = await generateArticleImage(editForm.title);
      if (aiImage) {
        aiImage = await compressBase64(aiImage);
        setEditForm(prev => ({ ...prev, imageUrl: aiImage }));
      } else {
        setError("AI 圖片生成失敗。");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setError("AI 圖片生成出錯。");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除這篇文章嗎？')) {
      try {
        await deleteDoc(doc(db, 'articles', id));
      } catch (error) {
        console.error("Error deleting article:", error);
      }
    }
  };

  const startEdit = (article: any) => {
    setEditingId(article.id);
    setEditForm({
      title: article.title,
      category: article.category,
      imageUrl: article.imageUrl
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'articles', editingId), {
        ...editForm,
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
    } catch (error) {
      console.error("Error updating article:", error);
      setError("更新文章失敗。");
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">AI 文章生成器</h3>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-bold text-red-800 dark:text-red-300">
            {error}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="輸入文章主題 (例如：2024 寶可夢卡牌投資趨勢)"
            className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                立即生成
              </>
            )}
          </button>
        </div>
        <p className="mt-4 text-xs text-gray-400 font-medium">
          AI 將自動生成標題、摘要、正文內容及配圖。生成後可直接在文章列表查看。
        </p>
      </div>

      <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-600 dark:text-gray-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">文章管理</h3>
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{articles.length} 篇文章</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">目前尚無文章，請使用上方生成器建立。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div 
                key={article.id}
                className="flex flex-col p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all group"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 dark:bg-black/20">
                      <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{article.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">{article.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => startEdit(article)}
                      className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(article.id)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {editingId === article.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">文章標題</label>
                        <input 
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full bg-white dark:bg-black/20 border-none rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">文章分類</label>
                        <input 
                          type="text"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full bg-white dark:bg-black/20 border-none rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">封面圖片</label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-32 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 relative group">
                          {editForm.imageUrl ? (
                            <img src={editForm.imageUrl} alt="Preview" className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
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
                          <div className="relative">
                            <input 
                              type="text"
                              value={editForm.imageUrl}
                              onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                              placeholder="輸入圖片 URL 或上傳本機圖片"
                              className="w-full bg-white dark:bg-black/20 border-none rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white pr-10"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 cursor-pointer transition-all">
                              <UploadCloud className="w-4 h-4" />
                              上傳本機圖片
                              <input 
                                type="file"
                                accept="image/*,.heic,.heif,.webp"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={handleGenerateImageForEdit}
                              disabled={isGeneratingImage || !editForm.title}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 transition-all disabled:opacity-50"
                            >
                              {isGeneratingImage ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                              AI 生成圖片
                            </button>
                            <p className="text-[10px] text-gray-400">支援 JPG, PNG, WebP, HEIC</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleUpdate}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        儲存更新
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
