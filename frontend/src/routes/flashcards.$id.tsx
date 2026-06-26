import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCw, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { sampleCards } from "@/lib/mock-data";

export const Route = createFileRoute("/flashcards/$id")({
  head: () => ({
    meta: [{ title: "Học flashcard — Stitch" }],
  }),
  component: FlashcardStudy,
});

function FlashcardStudy() {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ known: 0, again: 0 });

  const card = sampleCards[idx];
  const isLast = idx === sampleCards.length - 1;

  const advance = (known: boolean) => {
    setStats((s) => ({ known: s.known + (known ? 1 : 0), again: s.again + (known ? 0 : 1) }));
    if (!isLast) {
      setIdx(idx + 1);
      setFlipped(false);
    } else {
      setIdx(idx + 1);
    }
  };

  if (idx >= sampleCards.length) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="surface-card p-10 gradient-hero">
          <h1 className="text-3xl font-bold">Hoàn thành deck! 🎯</h1>
          <p className="text-muted-foreground mt-2">Hôm nay bạn đã ôn xong {sampleCards.length} thẻ.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-success">{stats.known}</div>
              <div className="text-xs text-muted-foreground">Đã thuộc</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-coral">{stats.again}</div>
              <div className="text-xs text-muted-foreground">Cần ôn lại</div>
            </div>
          </div>
          <Link to="/flashcards" className="mt-6 inline-flex px-4 h-10 rounded-xl bg-primary text-primary-foreground items-center font-medium text-sm">
            Về danh sách
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/flashcards" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft size={14} /> Thoát
        </Link>
        <div className="text-sm text-muted-foreground">
          {idx + 1}/{sampleCards.length}
        </div>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div className="h-full bg-coral" initial={false} animate={{ width: `${((idx + 1) / sampleCards.length) * 100}%` }} />
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
                  <div className="text-2xl lg:text-3xl font-display font-semibold leading-tight">{card.front}</div>
                  <div className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <RotateCw size={12} /> Bấm để lật thẻ
                  </div>
                </div>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 surface-card flex items-center justify-center p-8 text-center bg-ink text-cream"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div>
                  <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Đáp án</div>
                  <div className="text-xl lg:text-2xl font-display font-medium leading-snug">{card.back}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => advance(false)}
          className="inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-coral/10 text-coral font-medium hover:bg-coral/20"
        >
          <ThumbsDown size={16} /> Chưa thuộc
        </button>
        <button
          onClick={() => advance(true)}
          className="inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-success text-white font-medium hover:opacity-90"
        >
          <ThumbsUp size={16} /> Đã thuộc
        </button>
      </div>
    </div>
  );
}
