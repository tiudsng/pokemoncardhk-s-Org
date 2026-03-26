import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import imageCompression from 'browser-image-compression';
import { UploadCloud, Loader2, Image as ImageIcon, X, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ConditionBadge } from './components/ConditionBadge';
import { OnboardingModal } from './components/OnboardingModal';

export const CreateListing: React.FC = () => {
  const { user, setShowLoginModal } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const onboardingSteps = [
    { title: '歡迎上架卡片', content: '讓我們引導您完成上架流程，讓您的卡片更快找到買家！' },
    { title: '上傳清晰照片', content: '建議上傳 3-5 張不同角度的照片，包含卡片正面、背面及細節瑕疵，這能大幅提升買家信任度。' },
    { title: '填寫卡片細節', content: '請準確填寫年份、系列、卡號與語言，這有助於買家搜尋到您的卡片。' },
    { title: '標註卡況', content: '誠實標註卡況（如：是否有白邊、壓痕），並選取對應的卡片類型（如：RAW 或 PSA 等級），這能避免後續交易糾紛。' },
    { title: '設定價格', content: '設定合理的價格，並註明是否可議價，這能讓交易更順利。' }
  ];

  React.useEffect(() => {
    if (user && user.isGuest) {
      setShowLoginModal(true);
      navigate('/');
      return;
    }
    
    if (user) {
      const checkOnboarding = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (!userData.hasCompletedOnboarding) {
            setShowOnboarding(true);
          }
        }
      };
      checkOnboarding();
    }
  }, [user, navigate, setShowLoginModal]);

  const handleCloseOnboarding = async () => {
    setShowOnboarding(false);
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { hasCompletedOnboarding: true });
    }
  };
  
  const [title, setTitle] = useState('');
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = [...imageFiles, ...files].slice(0, 5); // Limit to 5 images
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
      setError('您必須登入才能上架卡片。');
      setShowLoginModal(true);
      return;
    }
    if (imageFiles.length === 0) {
      setError('請上傳至少一張卡片照片。');
      return;
    }
    if (!title || !description || !price) {
      setError('請填寫所有欄位。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const base64Images: string[] = [];
      
      for (const file of imageFiles) {
        // Compress image heavily to fit within Firestore 1MB limit
        const options = {
          maxSizeMB: 0.15, // Smaller size for multiple images
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        
        const compressedFile = await imageCompression(file, options);
        
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
        base64Images.push(base64);
      }

      // Save to Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      const docRef = await addDoc(collection(db, 'listings'), {
        title,
        description,
        price: parseFloat(price),
        condition,
        cardType,
        conditionDetails,
        negotiation,
        attribute,
        rarity,
        transactionMethod,
        year,
        set,
        cardNumber,
        language,
        imageUrl: base64Images[0],
        imageUrls: base64Images,
        sellerId: user.uid,
        sellerName: user.displayName || '匿名用戶',
        sellerPhoto: user.photoURL || '',
        sellerRating: userData.rating || 5,
        sellerTotalReviews: userData.totalReviews || 0,
        sellerCompletedTransactions: userData.completedTransactions || 0,
        sellerCreatedAt: userData.createdAt || serverTimestamp(),
        status: 'active',
        createdAt: serverTimestamp(),
      });

      navigate(`/listing/${docRef.id}`);
    } catch (err: any) {
      console.error('Error creating listing:', err);
      setError(err.message || '建立上架失敗。圖片可能仍然太大。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto min-h-screen"
    >
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">賣卡區 - 上架卡片</h1>
            <button 
              onClick={() => setShowOnboarding(true)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
              title="查看上架引導"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-8">刊登您的 TCG 卡牌進行拍賣或出售。</p>

          <OnboardingModal 
            isOpen={showOnboarding} 
            onClose={handleCloseOnboarding} 
            steps={onboardingSteps} 
          />

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload & Preview */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">卡片照片 (最多 5 張)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 justify-items-center sm:justify-items-start">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none">
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
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">卡片預覽 (列表顯示效果)</label>
                <div className="w-full max-w-[200px] mx-auto aspect-[3/4] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg dark:shadow-none border border-gray-100 dark:border-gray-700 relative">
                  {imagePreviews[0] ? (
                    <img src={imagePreviews[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <div className="scale-75 origin-top-right">
                      <ConditionBadge 
                        condition={condition} 
                        cardType={cardType}
                        title={title || "預覽標題"} 
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-xs font-bold truncate">{title || "預覽標題"}</p>
                    <p className="text-white text-sm font-black">${price || "0"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">卡片標題</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：初版 噴火龍 閃卡"
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">年份</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="例如：2023"
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">系列</label>
                <input
                  type="text"
                  value={set}
                  onChange={(e) => setSet(e.target.value)}
                  placeholder="例如：151 SV2a"
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">卡號</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="例如：201/165"
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">語言</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as '日文' | '英文' | '中文')}
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none appearance-none"
                >
                  <option value="日文">日文</option>
                  <option value="英文">英文</option>
                  <option value="中文">中文</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">價格 (HKD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">$</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 pl-8 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">卡片類型</label>
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

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">卡片狀態 (多選)</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">提示：前 3 個標籤將會顯示在卡片上。</p>
                <div className="flex flex-wrap gap-2">
                  {['美品', '有白邊', '有白點', '有卡傷', '微瑕', '壓痕', '歡迎驗屍官', '不適合完美主義者', '平過鞋網', '鞋網價'].map((detail) => (
                    <button
                      key={detail}
                      type="button"
                      onClick={() => {
                        const isSelected = conditionDetails.includes(detail);
                        let newDetails;
                        if (isSelected) {
                          newDetails = conditionDetails.filter(d => d !== detail);
                          // Remove from description
                          setDescription(prev => prev.replace(new RegExp(`\\s?#${detail}`, 'g'), '').trim());
                        } else {
                          newDetails = [...conditionDetails, detail];
                          // Add to description
                          if (!description.includes(`#${detail}`)) {
                            setDescription(prev => prev ? `${prev} #${detail}` : `#${detail}`);
                          }
                        }
                        setConditionDetails(newDetails);
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
                          ? 'bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700 text-white shadow-md'
                          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {opt === 'Firm' ? '不議價' : '可議'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">屬性</label>
                <select
                  value={attribute}
                  onChange={(e) => setAttribute(e.target.value)}
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none appearance-none"
                >
                  {['水', '火', '草', '電', '超', '鬥', '惡', '鋼', '妖', '龍', '無'].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">稀有度</label>
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none appearance-none"
                >
                  {['UR', 'SAR', 'SR', 'SSR', 'HR', 'AR', 'C', 'U', 'R'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">交易方式</label>
                <div className="flex gap-4 pt-3 text-gray-900 dark:text-gray-300">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value="面交"
                      checked={transactionMethod.includes('面交')}
                      onChange={(e) => {
                        if (e.target.checked) setTransactionMethod([...transactionMethod, '面交']);
                        else setTransactionMethod(transactionMethod.filter(m => m !== '面交'));
                      }}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-800"
                    />
                    面交
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value="店到店"
                      checked={transactionMethod.includes('店到店')}
                      onChange={(e) => {
                        if (e.target.checked) setTransactionMethod([...transactionMethod, '店到店']);
                        else setTransactionMethod(transactionMethod.filter(m => m !== '店到店'));
                      }}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-800"
                    />
                    店到店
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">描述</label>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述卡片的歷史、具體瑕疵或其他細節..."
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] dark:focus:ring-offset-gray-800"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    發佈中...
                  </>
                ) : (
                  '確認上架'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};
