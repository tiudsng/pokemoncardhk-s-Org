import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import imageCompression from 'browser-image-compression';
import { UploadCloud, Loader2, Image as ImageIcon, Search, X, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ConditionBadge } from './components/ConditionBadge';
import { OnboardingModal } from './components/OnboardingModal';

export const CreateWantListing: React.FC = () => {
  const { user, setShowLoginModal } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(true);

  const onboardingSteps = [
    { title: '歡迎徵卡', content: '讓我們引導您完成徵卡流程，讓賣家更快找到您！' },
    { title: '設定徵求目標', content: '請填寫您想徵求的卡片標題與預算，越詳細越容易找到心儀的卡片。' },
    { title: '上傳參考照片', content: '若有參考照片（如：卡片樣式），建議上傳，這能幫助賣家確認您徵求的卡片。' },
    { title: '指定卡況與類型', content: '明確標註您期望的卡況（如：美品）與卡片類型（如：RAW 或 PSA 等級），這能節省雙方溝通時間。' },
    { title: '發佈徵求', content: '確認資訊無誤後，即可發佈徵求，等待賣家與您聯繫！' }
  ];

  React.useEffect(() => {
    if (user && user.isGuest) {
      setShowLoginModal(true);
      navigate('/');
    }
  }, [user, navigate, setShowLoginModal]);
  
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [set, setSet] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [language, setLanguage] = useState<'日文' | '英文' | '中文'>('日文');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<'Mint' | 'Near Mint' | 'Excellent' | 'Good' | 'Lightly Played' | 'Played' | 'Poor'>('Mint');
  const [cardType, setCardType] = useState<'RAW' | 'PSA 10' | 'PSA 9' | 'PSA 8' | 'BGS' | 'CGC'>('RAW');
  const [conditionDetails, setConditionDetails] = useState<string[]>([]);
  const [negotiation, setNegotiation] = useState<'Firm' | 'Negotiable'>('Firm');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = [...imageFiles, ...files].slice(0, 5);
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
      setImagePreviews([...imagePreviews, ...newPreviews].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.isGuest) {
      setError('您必須登入才能徵卡。');
      setShowLoginModal(true);
      return;
    }
    if (!title || !price) {
      setError('請填寫標題與預算。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const base64Images: string[] = [];
      
      for (const file of imageFiles) {
        const options = { maxSizeMB: 0.15, maxWidthOrHeight: 800, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
        base64Images.push(base64);
      }

      await addDoc(collection(db, 'wantListings'), {
        title,
        description,
        targetPrice: parseFloat(price),
        condition,
        cardType,
        conditionDetails,
        negotiation,
        imageUrl: base64Images[0] || '',
        imageUrls: base64Images,
        year,
        set,
        cardNumber,
        language,
        buyerId: user.uid,
        buyerName: user.displayName || '匿名用戶',
        buyerPhoto: user.photoURL || '',
        buyerRating: user.rating || 5,
        buyerTotalReviews: user.totalReviews || 0,
        createdAt: serverTimestamp(),
      });

      navigate('/');
    } catch (err: any) {
      console.error('Error creating want listing:', err);
      setError('建立徵卡失敗。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">徵卡區 - 我要徵卡</h1>
            <button 
              onClick={() => setShowOnboarding(true)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
              title="查看徵卡引導"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-8">告訴賣家您想收購的卡片與預算。</p>

          <OnboardingModal 
            isOpen={showOnboarding} 
            onClose={() => setShowOnboarding(false)} 
            steps={onboardingSteps} 
          />
          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-800">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload & Preview */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">卡片照片 (選填，最多 5 張)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-gray-100 dark:border-gray-700 shadow-sm">
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[10px] font-bold py-1 text-center">
                        封面照片
                      </div>
                    )}
                  </div>
                ))}
                
                {imagePreviews.length < 5 && (
                  <div className="relative aspect-[3/4] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group">
                    <UploadCloud className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">新增照片</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">徵求預覽 (列表顯示效果)</label>
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full max-w-[300px] mx-auto">
                  <div className="flex items-start gap-4 mb-4">
                    {imagePreviews[0] ? (
                      <img src={imagePreviews[0]} alt="Preview" className="w-16 h-16 rounded-xl object-cover bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                        <Search className="w-6 h-6 text-gray-300 dark:text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        <div className="scale-75 origin-top-left">
                          <ConditionBadge 
                            condition={condition || 'Mint'} 
                            cardType={cardType}
                            title={title || "預覽標題"} 
                          />
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-1">{title || "預覽標題"}</h3>
                      <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                        預算 ${price || "0"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">卡片標題</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：徵求 初版 噴火龍" className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">年份</label>
              <input type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="例如：2023" className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">系列</label>
              <input type="text" value={set} onChange={(e) => setSet(e.target.value)} placeholder="例如：151 SV2a" className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">卡號</label>
              <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="例如：201/165" className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">語言</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value as '日文' | '英文' | '中文')} className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none">
                <option value="日文">日文</option>
                <option value="英文">英文</option>
                <option value="中文">中文</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">預算 (HKD)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">徵求卡片狀態 (概略)</label>
              <div className="flex flex-wrap gap-2">
                {(['Mint', 'Near Mint', 'Excellent', 'Good', 'Lightly Played', 'Played', 'Poor'] as const).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      condition === cond
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    {cond === 'Mint' ? 'RAW卡/美品' : cond}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">徵求卡片類型</label>
              <div className="flex flex-wrap gap-2">
                {(['RAW', 'PSA 10', 'PSA 9', 'PSA 8', 'BGS', 'CGC'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCardType(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      cardType === type
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">徵求狀態 (多選)</label>
              <div className="flex flex-wrap gap-2">
                {['美品', '有白邊', '有白點', '有卡傷', '微瑕', '壓痕'].map((detail) => (
                  <button
                    key={detail}
                    type="button"
                    onClick={() => {
                      if (conditionDetails.includes(detail)) {
                        setConditionDetails(conditionDetails.filter(d => d !== detail));
                      } else {
                        setConditionDetails([...conditionDetails, detail]);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      conditionDetails.includes(detail)
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    {detail}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">議價</label>
              <div className="flex gap-2">
                {(['Firm', 'Negotiable'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setNegotiation(opt)}
                    className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      negotiation === opt
                        ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900 shadow-md'
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    {opt === 'Firm' ? '不議價' : '可議'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">補充描述 (選填)</label>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：希望卡況完美，無白邊..."
                className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? '發佈中...' : '確認發佈徵卡'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};
