import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { GoogleGenAI, Type } from '@google/genai';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Loader2, Copy, CheckCircle2, Image as ImageIcon, Wand2, Send, FileText, User, UploadCloud, Sparkles } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { generateArticleImage } from '../services/geminiService';

interface ImageAsset {
  id: string;
  url: string;
}

interface UserData {
  id: string;
  displayName: string;
}

export const AdminContentCreator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ai-column' | 'quick-post'>('ai-column');
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);

  // AI Column State
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<{seo: string, clickbait: string, forum: string} | null>(null);
  const [selectedTitleType, setSelectedTitleType] = useState<'seo' | 'clickbait' | 'forum'>('forum');
  const [contentHtml, setContentHtml] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublishingArticle, setIsPublishingArticle] = useState(false);
  const [articleSuccess, setArticleSuccess] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Quick Post State
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [postType, setPostType] = useState<'放售' | '徵卡'>('放售');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTime, setPostTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postSuccess, setPostSuccess] = useState('');

  const [copiedUrl, setCopiedUrl] = useState('');

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

  const handleGenerateAIImage = async () => {
    const title = generatedTitles ? generatedTitles[selectedTitleType] : topic;
    if (!title) return;
    
    setIsGeneratingImage(true);
    try {
      let aiImage = await generateArticleImage(title);
      if (aiImage) {
        aiImage = await compressBase64(aiImage);
        setCoverUrl(aiImage);
      } else {
        alert("AI 圖片生成失敗。");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("AI 圖片生成出錯。");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result as string);
        setIsUploadingCover(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error uploading cover:", error);
      alert("圖片上傳失敗。");
      setIsUploadingCover(false);
    }
  };

  // Fetch Images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const q = query(collection(db, 'image_library'), orderBy('createdAt', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        setImages(snapshot.docs.map(doc => ({ id: doc.id, url: doc.data().url })));
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setLoadingImages(false);
      }
    };
    fetchImages();
  }, []);

  // Fetch Users for Quick Post
  useEffect(() => {
    if (activeTab === 'quick-post' && users.length === 0) {
      const fetchUsers = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'users'));
          const usersList = snapshot.docs.map(doc => ({
            id: doc.id,
            displayName: doc.data().displayName || 'Unknown User'
          }));
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
    }
  }, [activeTab, users.length]);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(''), 2000);
  };

  const handleGenerateAI = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `請以「${topic}」為主題撰寫文章。`,
        config: {
          systemInstruction: "你是一個香港 TCG 投資專家。請用極度地道、論壇風格的廣東話 (多用助詞囉, 呀, 㗎) 撰寫一篇約 800 字的文章。輸出必須是 JSON 格式，包含：1. titles: { seo: 'SEO型', clickbait: '標題黨', forum: '吹水型' } 2. content_html: 包含 <h2> 和 <p> 的 HTML 文案。 3. 重要：在文案中適合放圖的位置插入 [IMAGE_PLACEHOLDER] 占位符。",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titles: {
                type: Type.OBJECT,
                properties: {
                  seo: { type: Type.STRING },
                  clickbait: { type: Type.STRING },
                  forum: { type: Type.STRING }
                }
              },
              content_html: { type: Type.STRING }
            }
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      if (result.titles) setGeneratedTitles(result.titles);
      if (result.content_html) setContentHtml(result.content_html);
      
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("生成失敗，請檢查控制台。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishArticle = async () => {
    if (!generatedTitles || !contentHtml) return;
    setIsPublishingArticle(true);
    try {
      const finalTitle = generatedTitles[selectedTitleType];
      await addDoc(collection(db, 'articles'), {
        title: finalTitle,
        content: contentHtml,
        coverImage: coverUrl || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&q=80&w=1000',
        author: 'TCG INVEST 專家團隊',
        createdAt: Timestamp.now(),
        readTime: '5 min read',
        category: '投資分析'
      });
      setArticleSuccess('文章發佈成功！');
      setTimeout(() => setArticleSuccess(''), 3000);
      setTopic('');
      setGeneratedTitles(null);
      setContentHtml('');
      setCoverUrl('');
    } catch (error) {
      console.error("Publish Error:", error);
      alert("發佈失敗。");
    } finally {
      setIsPublishingArticle(false);
    }
  };

  const handleQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !price || !postContent) return;
    setIsSubmittingPost(true);
    try {
      const selectedUser = users.find(u => u.id === selectedUserId);
      const authorName = selectedUser?.displayName || 'Unknown';
      const selectedDate = new Date(postTime);

      await addDoc(collection(db, 'posts'), {
        author_id: selectedUserId,
        author_name: authorName,
        type: postType,
        price: Number(price),
        content: postContent,
        image_url: postImageUrl,
        created_at: Timestamp.fromDate(selectedDate)
      });

      setPostSuccess('分身發佈成功！');
      setPostContent('');
      setPostImageUrl('');
      setTimeout(() => setPostSuccess(''), 3000);
    } catch (error) {
      console.error("Post Error:", error);
      alert("發佈失敗。");
    } finally {
      setIsSubmittingPost(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Pane: Main Content Area */}
      <div className="flex-1 bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-6 sm:p-8 border border-gray-100 dark:border-white/5 shadow-sm">
        
        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('ai-column')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'ai-column' ? 'bg-white dark:bg-[#1c1c1e] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Wand2 className="w-4 h-4" />
            AI 專欄生成器
          </button>
          <button
            onClick={() => setActiveTab('quick-post')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'quick-post' ? 'bg-white dark:bg-[#1c1c1e] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <User className="w-4 h-4" />
            快速分身發佈器
          </button>
        </div>

        {/* Tab 1: AI Column Creator */}
        {activeTab === 'ai-column' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                文章主題
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例如: 2026年寶可夢卡牌投資趨勢"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !topic}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  AI 生成
                </button>
              </div>
            </div>

            {generatedTitles && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-4">
                  選擇標題
                </label>
                <div className="space-y-3">
                  {(['seo', 'clickbait', 'forum'] as const).map((type) => (
                    <label key={type} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="titleType"
                        checked={selectedTitleType === type}
                        onChange={() => setSelectedTitleType(type)}
                        className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1 block">
                          {type === 'seo' ? 'SEO型' : type === 'clickbait' ? '標題黨' : '吹水型'}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {generatedTitles[type]}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                封面圖片
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-32 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 relative group">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  {isUploadingCover && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="輸入圖片 URL 或從右側圖庫複製"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 cursor-pointer transition-all">
                      <UploadCloud className="w-5 h-5" />
                      上傳本機圖片
                      <input 
                        type="file"
                        accept="image/*,.heic,.heif,.webp"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAIImage}
                      disabled={isGeneratingImage || (!topic && !generatedTitles)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400 transition-all disabled:opacity-50"
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      AI 生成圖片
                    </button>
                    <p className="text-xs text-gray-400">支援多種格式</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                文章內容 (支援 HTML)
              </label>
              <div className="bg-white dark:bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
                <ReactQuill 
                  theme="snow" 
                  value={contentHtml} 
                  onChange={setContentHtml}
                  className="h-64 sm:h-96 text-gray-900 dark:text-white"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                提示：點擊右側圖庫複製圖片 URL，並在編輯器中使用「插入圖片」功能替換 [IMAGE_PLACEHOLDER]。
              </p>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={handlePublishArticle}
                disabled={isPublishingArticle || !contentHtml || !generatedTitles}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPublishingArticle ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                發佈專欄
              </button>
              
              {articleSuccess && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  {articleSuccess}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Quick Alias Poster */}
        {activeTab === 'quick-post' && (
          <form onSubmit={handleQuickPost} className="space-y-6">
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

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                圖片
              </label>
              <input
                type="url"
                value={postImageUrl}
                onChange={(e) => setPostImageUrl(e.target.value)}
                placeholder="輸入圖片 URL"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
              />
            </div>

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

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                內容描述 (地道廣東話)
              </label>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="例如: 完美品，有意PM，可面交..."
                required
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white resize-y"
              />
            </div>

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

            <div className="pt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={isSubmittingPost || loadingUsers}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingPost ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                立即發佈
              </button>
              
              {postSuccess && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  {postSuccess}
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Right Pane: Image Gallery */}
      <div className="w-full lg:w-80 bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-6 border border-gray-100 dark:border-white/5 shadow-sm h-fit lg:sticky lg:top-24">
        <div className="flex items-center gap-2 mb-6">
          <ImageIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">快捷圖庫</h3>
        </div>
        
        {loadingImages ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            圖庫暫無圖片
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {images.map(img => (
              <div 
                key={img.id}
                onClick={() => copyToClipboard(img.url)}
                className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer border border-gray-100 dark:border-white/5"
              >
                <img src={img.url} alt="Gallery asset" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"  referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {copiedUrl === img.url ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : (
                    <Copy className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4 text-center">
          點擊圖片即可複製 URL
        </p>
      </div>
    </div>
  );
};
