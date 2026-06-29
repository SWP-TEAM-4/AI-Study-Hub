import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ScanText, BrainCircuit, FileSearch, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AiProcessModalProps {
  isOpen: boolean;
  fileName: string;
  onComplete: () => void;
}

export default function AiProcessModal({ isOpen, fileName, onComplete }: AiProcessModalProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: <ScanText size={18} />, text: t('components.aiProcessModal.step1', "Đang quét OCR tài liệu...") },
    { icon: <FileSearch size={18} />, text: t('components.aiProcessModal.step2', "Đang trích xuất khái niệm chính...") },
    { icon: <BrainCircuit size={18} />, text: t('components.aiProcessModal.step3', "Đang tạo vector index cho Chatbot...") },
    { icon: <CheckCircle2 size={18} />, text: t('components.aiProcessModal.step4', "Hoàn tất xử lý!") }
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const runSteps = async () => {
      for (let i = 0; i < steps.length - 1; i++) {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
        setCurrentStep(prev => prev + 1);
      }
      await new Promise(r => setTimeout(r, 800));
      onComplete();
    };

    runSteps();
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm bg-card border border-border shadow-2xl rounded-2xl overflow-hidden p-6 text-center flex flex-col items-center"
        >
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
            <Sparkles size={28} className="text-primary animate-pulse" />
            {currentStep < steps.length - 1 && (
              <svg className="absolute inset-0 size-full -rotate-90 animate-spin" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary/20" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="150 300" strokeLinecap="round" className="text-primary" />
              </svg>
            )}
          </div>
          
          <h3 className="font-bold text-lg text-foreground mb-1">{t('components.aiProcessModal.processing', 'AI đang xử lý')}</h3>
          <p className="text-xs text-muted-foreground mb-6 max-w-[250px] truncate">{fileName}</p>

          <div className="w-full space-y-3">
            {steps.map((step, index) => {
              const isPast = index < currentStep;
              const isCurrent = index === currentStep;
              
              if (index > currentStep) return null;
              
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isPast ? 'bg-primary/5 border-primary/20 text-primary/80' : 
                    isCurrent ? 'bg-card border-primary text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.1)]' : ''
                  }`}
                >
                  <div className={isCurrent ? 'animate-pulse' : ''}>
                    {isPast ? <CheckCircle2 size={18} className="text-primary" /> : step.icon}
                  </div>
                  <span className="text-sm font-semibold">{step.text}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
