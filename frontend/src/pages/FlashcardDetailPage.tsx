"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, Calendar, Eye, Download,
  Star, Layers, RotateCcw, Play, CheckCircle2,
  ChevronLeft, ChevronRight, Globe, Lock, Package,
  RefreshCw, BarChart2, Sparkles
} from "lucide-react";
import { Notify } from "notiflix";
import { FlashcardDeckDTO, FlashcardDTO } from "../services/flashcardService";
import { ReviewsSection } from "../components/ui/ReviewsSection";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const visibilityConfig = {
  PRIVATE: { label: "Riêng tư", icon: Lock, color: "text-muted-foreground bg-muted" },
  WORKSPACE: { label: "Nhóm", icon: Globe, color: "text-blue-400 bg-blue-500/10" },
  MARKETPLACE: { label: "Cộng đồng", icon: Package, color: "text-primary bg-primary/10" },
};

// ─── Flashcard Flip Card ──────────────────────────────────────────────────────

function FlipCard({ card, index, total }: { card: FlashcardDTO; index: number; total: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      onClick={() => setFlipped(f => !f)}
      className="cursor-pointer"
      style={{ perspective: "1000px" }}
    >
      <div
        style={{
          transition: "transform 0.55s cubic-bezier(0.23,1,0.32,1)",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          position: "relative",
          minHeight: "220px",
        }}
      >
        {/* Front */}
        <div
          style={{ backfaceVisibility: "hidden" }}
          className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl border border-border bg-card shadow-lg"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">
            {index + 1} / {total}
          </span>
          <p className="text-xl font-bold text-center text-foreground">{card.frontText}</p>
          <div className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground/50">
            <RotateCcw size={11} />
            <span>Click để lật</span>
          </div>
        </div>
        {/* Back */}
        <div
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl border border-primary/30 bg-primary/5 shadow-lg"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-4">Đáp án</span>
          <p className="text-xl font-bold text-center text-foreground">{card.backText}</p>
          <div className="mt-6 flex items-center gap-1.5 text-xs text-primary/40">
            <CheckCircle2 size={11} />
            <span>Đã lật</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Preview Carousel ───────────────────────────────────────────────────

function CardCarousel({ cards }: { cards: FlashcardDTO[] }) {
  const [idx, setIdx] = useState(0);
  const card = cards[idx];
  if (!card) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Layers size={15} className="text-primary" /> Xem trước thẻ
        </h3>
        <span className="text-xs text-muted-foreground">{idx + 1} / {cards.length}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22 }}
        >
          <FlipCard card={card} index={idx} total={cards.length} />
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="flex-1 h-9 rounded-xl border border-border flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} /> Trước
        </button>
        <button
          onClick={() => setIdx(i => Math.min(cards.length - 1, i + 1))}
          disabled={idx === cards.length - 1}
          className="flex-1 h-9 rounded-xl border border-border flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Sau <ChevronRight size={15} />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {cards.slice(0, Math.min(10, cards.length)).map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`rounded-full transition-all ${i === idx ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`}
          />
        ))}
        {cards.length > 10 && <span className="text-[10px] text-muted-foreground/50">+{cards.length - 10}</span>}
      </div>
    </div>
  );
}

// ─── All Cards List ───────────────────────────────────────────────────────────

function CardsList({ cards }: { cards: FlashcardDTO[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {cards.map((card, i) => (
        <motion.div
          key={card.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.025 }}
          className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden"
        >
          <button
            onClick={() => toggle(card.id)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-foreground truncate">{card.frontText}</span>
            </div>
            <motion.div animate={{ rotate: expanded.has(card.id) ? 180 : 0 }}>
              <ChevronRight size={15} className="text-muted-foreground rotate-90" />
            </motion.div>
          </button>
          <AnimatePresence>
            {expanded.has(card.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-0 border-t border-border/30">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1.5">Đáp án</p>
                  <p className="text-sm text-foreground leading-relaxed">{card.backText}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface FlashcardDetailPageProps {
  deck: FlashcardDeckDTO;
  onBack: () => void;
  onStudy: () => void;
}

type Tab = "preview" | "all-cards" | "reviews";

export default function FlashcardDetailPage({ deck, onBack, onStudy }: FlashcardDetailPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("preview");

  const visCfg = visibilityConfig[deck.visibility] || visibilityConfig.PRIVATE;
  const VisIcon = visCfg.icon;

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "preview", label: "Xem trước", icon: Eye },
    { key: "all-cards", label: "Tất cả thẻ", icon: Layers, count: deck.cards.length },
    { key: "reviews", label: "Đánh giá", icon: Star, count: deck.reviewCount || undefined },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
        Quay lại danh sách
      </button>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 shadow-xl">
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${visCfg.color}`}>
                  <VisIcon size={11} />
                  {visCfg.label}
                </span>
                {deck.subjectId && (
                  <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    Môn #{deck.subjectId}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">{deck.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                <Calendar size={13} className="inline mr-1" />
                Tạo ngày {new Date(deck.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Layers, label: "Số thẻ", value: deck.cards.length, color: "text-primary" },
              { icon: Download, label: "Tải về", value: deck.downloadCount || 0, color: "text-blue-400" },
              { icon: Star, label: "Đánh giá", value: deck.reviewCount || 0, color: "text-amber-400" },
              { icon: BarChart2, label: "Tỷ lệ đúng", value: `${deck.acceptPercentage || 0}%`, color: "text-emerald-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="p-3 rounded-2xl bg-muted/30 border border-border/40 text-center">
                <Icon size={16} className={`${color} mx-auto mb-1`} />
                <div className="font-bold text-foreground text-lg leading-none">{value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex gap-3 flex-wrap">
            <button
              onClick={onStudy}
              className="inline-flex items-center gap-2 px-6 h-11 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Play size={16} /> Bắt đầu học ngay
            </button>
            <button
              onClick={() => Notify.success("Đã thêm vào danh sách học!")}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-2xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-colors border border-border/50"
            >
              <Sparkles size={15} />  Lưu bộ thẻ
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted/40 border border-border/40 rounded-2xl w-fit">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-medium transition-all ${
              activeTab === key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {activeTab === key && (
              <motion.div
                layoutId="flashcard-tab-pill"
                className="absolute inset-0 bg-card border border-border/60 rounded-xl shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon size={14} className="relative z-10" />
            <span className="relative z-10">{label}</span>
            {count !== undefined && (
              <span className="relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "preview" && (
            deck.cards.length > 0
              ? <CardCarousel cards={deck.cards} />
              : (
                <div className="py-16 text-center text-muted-foreground">
                  <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
                  <p>Bộ thẻ này chưa có thẻ nào.</p>
                </div>
              )
          )}
          {activeTab === "all-cards" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Layers size={15} className="text-primary" />
                  Tất cả {deck.cards.length} thẻ
                </h3>
                <button
                  onClick={() => setActiveTab("preview")}
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <RefreshCw size={11} /> Chế độ học
                </button>
              </div>
              <CardsList cards={deck.cards} />
            </div>
          )}
          {activeTab === "reviews" && (
            <ReviewsSection targetType="FLASHCARD_DECK" targetId={deck.id} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
