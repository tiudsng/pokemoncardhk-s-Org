import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, Loader2, Image as ImageIcon, Sparkles, AlertCircle, CheckCircle2, Scan } from 'lucide-react';
import { analyzeCardImage } from './services/geminiService';
import imageCompression from 'browser-image-compression';
import { Link } from 'react-router-dom';

export const AiAnalysisPage: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Show preview
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setImagePreview(preview);
      
      // Start analysis
      handleImageAnalysis(file);
    }
  };

  const handleImageAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setError('');
    setResult(null);
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      const base64DataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });

      const mimeType = base64DataUrl.split(';')[0].split(':')[1];
      const base64Data = base64DataUrl.split(',')[1];

      const analysisResult = await analyzeCardImage(base64Data, mimeType);

      if (analysisResult.error) {
        if (analysisResult.error === "Cannot identify card") {
           setError('圖片模糊無法辨識，請上傳更清晰的照片。');
        } else {
           setError(`圖片分析失敗: ${analysisResult.error}`);
        }
      } else {
        setResult(analysisResult);
      }
    } catch (err: any) {
      console.error('Image analysis error:', err);
      setError('圖片分析發生錯誤。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20"
          >
            <Scan className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">AI 卡牌鑑定分析</h1>
          <p className="text-gray-500 dark:text-gray-400">上傳您的 TCG 卡牌照片，AI 將自動為您識別卡片資訊並提供初步卡況與投資分析。</p>
        </div>

        <div className="bg-white dark:bg-[#141414] rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                imagePreview 
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5' 
                  : 'border-blue-300 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*,.heic,.heif,.webp" 
                className="hidden" 
              />
              
              {imagePreview ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-64 mb-4 rounded-xl overflow-hidden shadow-md">
                    <img src={imagePreview} alt="Card Preview" className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <button className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                    <UploadCloud className="w-4 h-4" />
                    重新上傳
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">點擊上傳卡片照片</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">支援 JPG, PNG 格式，請確保卡片清晰可見</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analysis Results */}
            <AnimatePresence>
              {result && !isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 space-y-6"
                >
                  <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">分析結果</h3>
                  </div>

                  {/* Card Info */}
                  {result.card_info && (
                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/5">
                      <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">卡片基本資訊</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">卡片名稱</p>
                          <p className="font-bold text-gray-900 dark:text-white">{result.card_info.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">系列 / 卡號</p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {result.card_info.set_name || '-'} {result.card_info.set_number ? `(${result.card_info.set_number})` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">稀有度</p>
                          <p className="font-bold text-gray-900 dark:text-white">{result.card_info.rarity || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">語言</p>
                          <p className="font-bold text-gray-900 dark:text-white">{result.card_info.language || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Investment Data */}
                  {result.investment_data && (
                    <div className="bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl p-5 border border-blue-100 dark:border-blue-500/10">
                      <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-4 uppercase tracking-wider">投資與卡況分析</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            result.investment_data.is_graded 
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {result.investment_data.is_graded ? '已鑑定 (Graded)' : '裸卡 (Raw)'}
                          </span>
                          {result.investment_data.is_graded && result.investment_data.grading_company && (
                            <span className="px-2.5 py-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold text-gray-900 dark:text-white">
                              {result.investment_data.grading_company} {result.investment_data.grade_score}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-1">AI 視覺卡況評價</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                            {result.investment_data.visual_condition || '無法提供卡況分析'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <Link 
                      to="/create"
                      onClick={() => {
                        if (result) {
                          sessionStorage.setItem('prefillData', JSON.stringify(result));
                        }
                      }}
                      state={{ prefillData: result }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-center transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      使用此資訊上架
                    </Link>
                    <Link 
                      to={`/search?q=${encodeURIComponent(result.search_keywords || result.card_info?.name || '')}`}
                      className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-bold text-center transition-colors border border-gray-200 dark:border-white/5"
                    >
                      搜尋市場價格
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
};
