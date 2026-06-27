import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCw, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState, useEffect } from "react";
import { flashcardService, FlashcardDTO } from "../services/flashcardService";
import { Notify } from "notiflix";

interface FlashcardStudyPageProps {
  deckId: string;
  onBack: () => void;
}

export default function FlashcardStudyPage({ deckId, onBack }: FlashcardStudyPageProps) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ known: 0, again: 0 });
  const [cards, setCards] = useState<FlashcardDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    flashcardService.getFlashcardDeckDetails(Number(deckId)).then(res => {
      if (res.success && res.data.cards) {
        setCards(res.data.cards);
      }
      setIsLoading(false);
    }).catch(err => {
      Notify.failure("Lỗi tải bộ thẻ");
      setIsLoading(false);
    });
  }, [deckId]);

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground"><div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />Đang tải dữ liệu bộ thẻ...</div>;
  }

  if (cards.length === 0) {
    return <div className="py-20 text-center text-muted-foreground">Bộ thẻ này hiện chưa có thẻ nào. <button onClick={onBack} className="text-primary hover:underline block mx-auto mt-2">Quay lại</button></div>;
  }

  const card = cards[idx];
  const isLast = idx === cards.length - 1;

  const advance = async (known: boolean) => {
    setStats((s) => ({ known: s.known + (known ? 1 : 0), again: s.again + (known ? 0 : 1) }));
    try {
      await flashcardService.reviewFlashcard(card.id, known);
    } catch (e) {
      console.error(e);
    }
    
    if (!isLast) {
      setIdx(idx + 1);
      setFlipped(false);
    } else {
      setIdx(idx + 1);
    }
  };

  if (idx >= cards.length) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="surface-card p-10 gradient-hero">
          <h1 className="text-3xl font-bold">Hoàn thành deck! </h1>
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
          <button onClick={onBack} className="mt-6 inline-flex px-4 h-10 rounded-xl bg-primary text-primary-foreground items-center font-medium text-sm">
            Về danh sách
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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
            className="absolute inset-0 cursor-pointer"
            onClick={() => setFlipped((f) => !f)}
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
          className="inline-flex items-center justify-center gap-2 h-12 rounded-xl font-medium hover:opacity-90"
          style={{ background: "oklch(0.62 0.18 25 / 0.1)", color: "var(--color-coral)" }}
        >
          <ThumbsDown size={16} /> Chưa thuộc
        </button>
        <button
          onClick={() => advance(true)}
          className="inline-flex items-center justify-center gap-2 h-12 rounded-xl text-white font-medium hover:opacity-90"
          style={{ background: "var(--color-success)" }}
        >
          <ThumbsUp size={16} /> Đã thuộc
        </button>
      </div>
    </div>
  );
}
