import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCw, ThumbsUp, ThumbsDown, Trophy } from "lucide-react";
import { useState, useCallback } from "react";
import { flashcardService } from "../services/flashcardService";
import { Notify } from "notiflix";
import { useSuspenseQuery } from "@tanstack/react-query";

interface FlashcardStudyPageProps {
  deckId: string;
  onBack: () => void;
}

export default function FlashcardStudyPage({ deckId, onBack }: FlashcardStudyPageProps) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ known: 0, again: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const { data } = useSuspenseQuery({
    queryKey: ["deckDetails", deckId],
    queryFn: () => flashcardService.getFlashcardDeckDetails(Number(deckId)),
  });

  const cards = data?.data?.cards || [];

  if (cards.length === 0) {
    return <div className="py-20 text-center text-muted-foreground">Bộ thẻ này hiện chưa có thẻ nào. <button onClick={onBack} className="text-primary hover:underline block mx-auto mt-2 min-h-[44px] min-w-[44px] px-3 rounded-lg">Quay lại</button></div>;
  }

  const card = cards[idx];
  const isLast = idx === cards.length - 1;

  const advance = useCallback(async (known: boolean) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await flashcardService.reviewFlashcard(card.id, known);
      setStats((s) => ({ known: s.known + (known ? 1 : 0), again: s.again + (known ? 0 : 1) }));
      
      if (!isLast) {
        setIdx((prevIdx) => prevIdx + 1);
        setFlipped(false);
      } else {
        setIdx((prevIdx) => prevIdx + 1);
      }
    } catch (e) {
      console.error(e);
      Notify.failure("Lỗi khi lưu kết quả ôn tập");
    } finally {
      setIsSaving(false);
    }
  }, [card.id, isLast, isSaving]);

  if (idx >= cards.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-xl mx-auto py-8"
      >
        {/* ── RESULT CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="surface-card p-10 text-center gradient-hero"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="size-20 mx-auto mb-5 rounded-3xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30"
          >
            <Trophy size={36} />
          </motion.div>
          <h1 className="text-3xl font-bold">Hoàn thành deck! 🎉</h1>
          <p className="text-muted-foreground mt-2">Hôm nay bạn đã ôn xong {cards.length} thẻ.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-success">{stats.known}</div>
              <div className="text-xs text-muted-foreground">Đã thuộc</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold" style={{ color: "var(--color-coral)" }}>{stats.again}</div>
              <div className="text-xs text-muted-foreground">Cần ôn lại</div>
            </div>
          </div>
          <button onClick={onBack} className="mt-6 inline-flex px-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground items-center justify-center font-medium text-sm hover:opacity-90 transition-opacity">
            Về danh sách
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1 px-3 min-h-[44px] rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <ArrowLeft size={14} /> Thoát
        </button>
        <div className="text-sm text-muted-foreground">{idx + 1}/{cards.length}</div>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--color-coral)" }}
          initial={false}
          animate={{ width: `${((idx + 1) / cards.length) * 100}%` }}
        />
      </div>

      <div className="relative h-72 lg:h-96" style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className={`absolute inset-0 ${isSaving ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => { if (!isSaving) setFlipped((f) => !f); }}
          >
            <motion.div
              className="relative w-full h-full"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 surface-card flex items-center justify-center p-8 text-center gradient-hero"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div>
                  <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Câu hỏi</div>
                  <div className="text-2xl lg:text-3xl font-display font-semibold leading-tight">{card.frontText}</div>
                  <div className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <RotateCw size={12} /> Bấm để lật thẻ
                  </div>
                </div>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 surface-card flex items-center justify-center p-8 text-center"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "var(--color-ink)", color: "var(--color-cream)" }}
              >
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold mb-3 opacity-60">Đáp án</div>
                  <div className="text-xl lg:text-2xl font-display font-medium leading-snug">{card.backText}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => advance(false)}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 h-12 min-h-[44px] rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ background: "oklch(0.62 0.18 25 / 0.1)", color: "var(--color-coral)" }}
        >
          <ThumbsDown size={16} /> {isSaving ? "Đang lưu..." : "Chưa thuộc"}
        </button>
        <button
          onClick={() => advance(true)}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 h-12 min-h-[44px] rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ background: "var(--color-success)" }}
        >
          <ThumbsUp size={16} /> {isSaving ? "Đang lưu..." : "Đã thuộc"}
        </button>
      </div>
    </div>
  );
}
