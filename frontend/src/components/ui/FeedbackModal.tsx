import React, { useState } from "react";
import { X, Send, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFeedback("");
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg p-6 bg-card border border-border/60 shadow-2xl rounded-2xl flex flex-col gap-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-foreground tracking-tight">Gửi góp ý hệ thống</h2>
                  <p className="text-sm text-muted-foreground">Chúng tôi luôn lắng nghe để cải thiện trải nghiệm của bạn.</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition-colors outline-none cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {isSuccess ? (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                <div className="size-16 rounded-full bg-success/20 text-success grid place-items-center mb-2">
                  <Send size={24} />
                </div>
                <h3 className="text-lg font-bold text-foreground">Cảm ơn bạn!</h3>
                <p className="text-sm text-muted-foreground">Góp ý của bạn đã được ghi nhận và sẽ được xem xét sớm nhất.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">Nội dung phản hồi <span className="text-destructive">*</span></label>
                  <textarea 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Mô tả lỗi bạn gặp phải hoặc ý tưởng cải tiến của bạn..."
                    className="w-full h-32 p-3 rounded-xl bg-muted/50 border border-border/80 focus:border-primary focus:bg-background outline-none transition-all resize-none text-sm font-medium custom-scrollbar"
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-2">
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !feedback.trim()}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm outline-none cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    <span>{isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
