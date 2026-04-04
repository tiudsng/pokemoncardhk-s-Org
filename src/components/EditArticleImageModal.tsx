import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, UploadCloud, Sparkles, Loader2, Save } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { generateArticleImage } from '../services/geminiService';
import imageCompression from 'browser-image-compression';

interface EditArticleImageModalProps {
  article: any;
  isOpen: boolean;
  onClose: () => void;
}

export const EditArticleImageModal: React.FC<EditArticleImageModalProps> = ({ article, isOpen, onClose }) => {
  const [imageUrl, setImageUrl] = useState(article.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
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
      setError("圖片上傳失敗。");
      setIsUploading(false);
    }
  };

  const handleGenerateAIImage = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      let aiImage = await generateArticleImage(article.title);
      if (aiImage) {
        aiImage = await compressBase64(aiImage);
        setImageUrl(aiImage);
      } else {
        setError("AI 圖片生成失敗。");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setError("AI 圖片生成出錯。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'articles', article.id), {
        imageUrl,
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      console.error("Error updating article image:", error);
      setError("更新失敗。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white tracking-tight">編輯封面圖片</h3>
                <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-bold text-red-600 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div className="aspect-video rounded-3xl overflow-hidden bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/5 relative group">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  {(isUploading || isGenerating) && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-3xl border border-gray-200 dark:border-white/5 cursor-pointer transition-all group">
                    <UploadCloud className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-blue-400 transition-colors" />
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:hover:text-white transition-colors">上傳圖片</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <button
                    onClick={handleGenerateAIImage}
                    disabled={isGenerating}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-3xl border border-blue-200 dark:border-blue-900/30 transition-all group disabled:opacity-50"
                  >
                    <Sparkles className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    <span className="text-xs font-bold text-blue-400 group-hover:text-blue-200 transition-colors">AI 生成</span>
                  </button>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:bg-white/5 transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !imageUrl}
                    className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    儲存變更
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
