import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, BrainCircuit, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Notify } from "notiflix";

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "quiz" | "flashcard";
  onGenerate: (config: any) => void;
}

export default function AiConfigModal({ isOpen, onClose, type, onGenerate }: AiConfigModalProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(10);
  const [level, setLevel] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      // Mock API delay to simulate AI configuration preparation
      await new Promise((r) => setTimeout(r, 1000));
      onGenerate({ amount, level, type });
      onClose();
    } catch (err: any) {
      Notify.failure(t('components.aiConfigModal.error', "Có lỗi xảy ra khi cấu hình!"));
    } finally {
      setIsGenerating(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Settings2 size={20} />
              </div>
              <h3 className="font-bold text-lg text-foreground">
                {t('components.aiConfigModal.title')} {type === "quiz" ? "Quiz" : "Flashcard"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleStart} className="p-5 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('components.aiConfigModal.amount')} {type === "quiz" ? t('components.aiConfigModal.question') : t('components.aiConfigModal.card')}
              </label>
              <div className="flex items-center justify-between bg-muted/30 border border-border rounded-xl p-1">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAmount(num)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                      amount === num
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('components.aiConfigModal.difficulty')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLevel("easy")}
                  className={`py-2.5 border rounded-xl text-sm font-bold transition-all ${
                    level === "easy"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t('components.aiConfigModal.easy', 'Dễ')}
                </button>
                <button
                  type="button"
                  onClick={() => setLevel("medium")}
                  className={`py-2.5 border rounded-xl text-sm font-bold transition-all ${
                    level === "medium"
                      ? "border-amber-500 bg-amber-500/10 text-amber-500"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t('components.aiConfigModal.medium', 'Vừa')}
                </button>
                <button
                  type="button"
                  onClick={() => setLevel("hard")}
                  className={`py-2.5 border rounded-xl text-sm font-bold transition-all ${
                    level === "hard"
                      ? "border-rose-500 bg-rose-500/10 text-rose-500"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t('components.aiConfigModal.hard', 'Khó')}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full mt-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('components.aiConfigModal.processing', 'Đang xử lý...')}
                </>
              ) : (
                <>
                  <BrainCircuit size={18} />
                  {t('components.aiConfigModal.createWithAi', 'Tạo bằng AI')}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
