import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import imageCompression from 'browser-image-compression';
import { getCardDetails, getCardDetailsByNumber } from './services/geminiService';
import { UploadCloud, Loader2, Image as ImageIcon, X, HelpCircle, Sparkles, Save, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { ConditionBadge } from './components/ConditionBadge';

export const EditListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, setShowLoginModal } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [year, setYear] = useState('');
  const [set, setSet] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [language, setLanguage] = useState<'日文' | '英文' | '中文'>('日文');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('Mint');
  const [cardType, setCardType] = useState<'RAW' | 'PSA 10' | 'PSA 9' | 'PSA 8' | 'BGS' | 'CGC'>('RAW');
  const [conditionDetails, setConditionDetails] = useState<string[]>([]);
  const [negotiation, setNegotiation] = useState<'Firm' | 'Negotiable'>('Firm');
  const [attribute, setAttribute] = useState('無');
  const [rarity, setRarity] = useState('C');
  const [transactionMethod, setTransactionMethod] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isLookingUpNumber, setIsLookingUpNumber] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
      navigate('/');
      return;
    }

    const fetchListing = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.sellerId !== user.uid) {
            navigate('/');
            return;
          }
          setTitle(data.title || '');
          setEnglishName(data.englishName || '');
          setYear(data.year || '');
          setSet(data.set || '');
          setCardNumber(data.cardNumber || '');
          setLanguage(data.language || '日文');
          setDescription(data.description || '');
          setPrice((data.price * 7.8).toFixed(0) || '');
          setCondition(data.condition || 'Mint');
          setCardType(data.cardType || 'RAW');
          setConditionDetails(data.conditionDetails || []);
          setNegotiation(data.negotiation || 'Firm');
          setAttribute(data.attribute || '無');
          setRarity(data.rarity || 'C');
          setTransactionMethod(data.transactionMethod || []);
          setExistingImageUrls(data.imageUrls || [data.imageUrl].filter(Boolean));
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError('無法載入卡片資訊。');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, user, navigate, setShowLoginModal]);

  const handleAILookup = async () => {
    if (!title) {
      setError('請先輸入卡片名稱以進行 AI 搜尋。');
      return;
    }
    setIsLookingUp(true);
    setError('');
    try {
      const details = await getCardDetails(title);
      if (details) {
        if (details.englishName) setEnglishName(details.englishName);
        if (details.year) setYear(details.year);
        if (details.set) setSet(details.set);
        if (details.cardNumber) setCardNumber(details.cardNumber);
        if (details.rarity) setRarity(details.rarity);
        if (details.attribute) setAttribute(details.attribute);
        if (details.description) setDescription(details.description);
        if (details.estimatedPrice) setPrice(details.estimatedPrice.toString());
      } else {
        setError('無法找到該卡片的詳細數據，請手動填寫。');
      }
    } catch (err) {
      console.error('AI Lookup error:', err);
      setError('AI 搜尋發生錯誤。');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleNumberLookup = async () => {
    if (!cardNumber) {
      setError('請先輸入卡號以進行 AI 搜尋。');
      return;
    }
    setIsLookingUpNumber(true);
    setError('');
    try {
      const details = await getCardDetailsByNumber(cardNumber, set);
      if (details) {
        if (details.title) setTitle(details.title);
        if (details.englishName) setEnglishName(details.englishName);
        if (details.year) setYear(details.year);
        if (details.set) setSet(details.set);
        if (details.rarity) setRarity(details.rarity);
        if (details.attribute) setAttribute(details.attribute);
        if (details.description) setDescription(details.description);
        if (details.estimatedPrice) setPrice(details.estimatedPrice.toString());
      } else {
        setError('無法找到該卡號的詳細數據，請手動填寫。');
      }
    } catch (err) {
      console.error('AI Lookup error:', err);
      setError('AI 搜尋發生錯誤。');
    } finally {
      setIsLookingUpNumber(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = [...imageFiles, ...files].slice(0, 5 - existingImageUrls.length);
      setImageFiles(newFiles);
      
      const newPreviews: string[] = [];
      for (const file of files) {
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newPreviews.push(preview);
      }
      setImagePreviews([...imagePreviews, ...newPreviews].slice(0, 5 - existingImageUrls.length));
    }
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    if (existingImageUrls.length === 0 && imageFiles.length === 0) {
      setError('請至少上傳一張卡片照片。');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const compressedImages: string[] = [...existingImageUrls];
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };

      for (const file of imageFiles) {
        const compressedFile = await imageCompression(file, options);
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedFile);
        });
        compressedImages.push(base64);
      }

      const listingRef = doc(db, 'listings', id);
      await updateDoc(listingRef, {
        title,
        englishName,
        year,
        set,
        cardNumber,
        language,
        description,
        price: parseFloat(price) / 7.8,
        condition,
        cardType,
        conditionDetails,
        negotiation,
        attribute,
        rarity,
        transactionMethod,
        imageUrl: compressedImages[0],
        imageUrls: compressedImages,
        updatedAt: serverTimestamp(),
      });

      navigate(`/listing/${id}`);
    } catch (err) {
      console.error('Error updating listing:', err);
      setError('更新失敗，請稍後再試。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="pt-20 sm:pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto bg-white dark:bg-black min-h-screen">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors -ml-2 sm:ml-0"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">編輯卡片上架</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-10">
        {/* Image Upload Section */}
        <section className="bg-white dark:bg-[#1c1c1e] p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              卡片照片 (最多 5 張)
            </h2>
            <span className="text-[10px] sm:text-xs font-bold text-gray-400">{existingImageUrls.length + imageFiles.length}/5</span>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
            {existingImageUrls.map((url, index) => (
              <div key={`existing-${index}`} className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-blue-500/30 group">
                <img src={url} alt={`Existing ${index}`} className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-[8px] font-bold rounded-md">已上傳</div>
              </div>
            ))}
            {imagePreviews.map((preview, index) => (
              <div key={`new-${index}`} className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-white/5 group">
                <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {existingImageUrls.length + imageFiles.length < 5 && (
              <label className="aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl hover:border-blue-500 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-all group">
                <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-[10px] font-black text-gray-400 group-hover:text-blue-500 mt-1 sm:mt-2 uppercase tracking-widest">新增照片</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        </section>

        {/* Basic Info Section */}
        <section className="bg-white dark:bg-[#1c1c1e] p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-5 sm:space-y-6">
          <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mb-4 sm:mb-6">基本資訊</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">卡片名稱 (自定名稱)</label>
                <button
                  type="button"
                  onClick={handleAILookup}
                  disabled={isLookingUp || !title}
                  className="flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-colors py-1 px-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  AI 自動填寫
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="例如：莉莉艾 SR"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">英文名稱 (配對結果)</label>
              <input
                type="text"
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="例如：Lillie SR"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">年份</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="2023"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">語言</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                >
                  <option value="日文">日文</option>
                  <option value="英文">英文</option>
                  <option value="中文">中文</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">系列</label>
                <input
                  type="text"
                  value={set}
                  onChange={(e) => setSet(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="例如：S12a"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">卡號</label>
                  <button
                    type="button"
                    onClick={handleNumberLookup}
                    disabled={isLookingUpNumber || !cardNumber}
                    className="flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-colors py-1 px-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    {isLookingUpNumber ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    依卡號搜尋
                  </button>
                </div>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  onBlur={() => {
                    if (cardNumber && !title) {
                      handleNumberLookup();
                    }
                  }}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="例如：210/172"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">稀有度</label>
                <input
                  type="text"
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="例如：SAR, SR, UR"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">屬性</label>
                <input
                  type="text"
                  value={attribute}
                  onChange={(e) => setAttribute(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="例如：火, 水, 支援者"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Condition Section */}
        <section className="bg-white dark:bg-[#1c1c1e] p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6 sm:space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">卡況與類型</h2>
            <ConditionBadge condition={condition} cardType={cardType} title={title} className="!h-7 sm:!h-8 scale-90 sm:scale-100 origin-right" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1">卡片類型</label>
              <div className="grid grid-cols-3 sm:grid-cols-2 gap-2">
                {['RAW', 'PSA 10', 'PSA 9', 'PSA 8', 'BGS', 'CGC'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCardType(type as any)}
                    className={`py-2 sm:py-3 rounded-xl text-xs font-bold transition-all border ${
                      cardType === type 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                        : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-transparent hover:border-gray-200 dark:hover:border-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1 mt-2 sm:mt-0">卡況等級</label>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                {['Mint', 'Near Mint', 'Excellent', 'Played'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCondition(lvl)}
                    className={`py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all border text-center sm:text-left flex justify-center sm:justify-between items-center ${
                      condition === lvl 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                        : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-transparent hover:border-gray-200 dark:hover:border-white/10'
                    }`}
                  >
                    {lvl}
                    {condition === lvl && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 ml-1">卡況細節 (可多選)</label>
            <div className="flex flex-wrap gap-2">
              {['無明顯瑕疵', '白邊', '壓痕', '刮痕', '受潮', '裁切不均', '印刷線'].map((detail) => (
                <button
                  key={detail}
                  type="button"
                  onClick={() => {
                    if (conditionDetails.includes(detail)) {
                      setConditionDetails(prev => prev.filter(d => d !== detail));
                    } else {
                      setConditionDetails(prev => [...prev, detail]);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    conditionDetails.includes(detail)
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-transparent hover:border-gray-200 dark:hover:border-white/10'
                  }`}
                >
                  {detail}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-white dark:bg-[#1c1c1e] p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6 sm:space-y-8">
          <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">價格與交易</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">售價 (HK$)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">HK$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">議價空間</label>
              <div className="flex p-1.5 bg-gray-50 dark:bg-white/5 rounded-2xl">
                {(['Firm', 'Negotiable'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setNegotiation(opt)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      negotiation === opt 
                        ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {opt === 'Firm' ? '不議價' : '可議價'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 ml-1">交易方式 (可多選)</label>
            <div className="flex flex-wrap gap-2">
              {['面交', '店到店', '郵寄', '黑貓宅配'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    if (transactionMethod.includes(method)) {
                      setTransactionMethod(prev => prev.filter(m => m !== method));
                    } else {
                      setTransactionMethod(prev => [...prev, method]);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    transactionMethod.includes(method)
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-transparent hover:border-gray-200 dark:hover:border-white/10'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Description Section */}
        <section className="bg-white dark:bg-[#1c1c1e] p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 sm:mb-4 ml-1">詳細描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px] sm:min-h-[150px] resize-none text-sm sm:text-base"
            placeholder="請描述卡片細節、保存方式或任何買家需要知道的資訊..."
          />
        </section>

        {error && (
          <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-red-100 dark:border-red-800/30">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            {error}
          </div>
        )}

        <div className="flex gap-3 sm:gap-4 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 sm:py-5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-2xl sm:rounded-[1.5rem] font-black hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95 text-sm sm:text-base"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-[2] py-4 sm:py-5 bg-blue-600 text-white rounded-2xl sm:rounded-[1.5rem] font-black hover:bg-blue-700 transition-all active:scale-95 shadow-xl sm:shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-70 text-sm sm:text-base"
          >
            {saving ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Save className="w-5 h-5 sm:w-6 sm:h-6" />}
            儲存變更
          </button>
        </div>
      </form>
    </div>
  );
};

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
