import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingStep {
  title: string;
  content: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: OnboardingStep[];
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, steps }) => {
  const [currentStep, setCurrentStep] = React.useState(0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-[#1c1c1e] rounded-3xl shadow-2xl dark:shadow-none border border-gray-100 dark:border-white/10 w-full max-w-lg p-8 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{steps[currentStep].title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{steps[currentStep].content}</p>

          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div key={index} className={`h-2 w-2 rounded-full transition-colors ${index === currentStep ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-white/10'}`} />
              ))}
            </div>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(prev => prev - 1)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold transition-colors">
                  上一步
                </button>
              )}
              {currentStep < steps.length - 1 ? (
                <button onClick={() => setCurrentStep(prev => prev + 1)} className="flex items-center gap-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-bold transition-colors">
                  下一步 <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-bold transition-colors">
                  開始上架
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
