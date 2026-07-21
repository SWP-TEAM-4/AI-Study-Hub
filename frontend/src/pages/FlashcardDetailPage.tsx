"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, Calendar, Eye, Download,
  Star, Layers, RotateCcw, Play, CheckCircle2,
  ChevronLeft, ChevronRight, Globe, Lock, Package,
  RefreshCw, BarChart2, Sparkles, Plus, Pencil, Trash2,
  Loader2, AlertCircle, X, Save
} from "lucide-react";
import { Notify, Confirm } from "notiflix";
import {
  flashcardService,
  FlashcardDeckDTO,
  FlashcardDTO,
  FlashcardProgressDTO,
} from "../services/flashcardService";
import { useAuthStore } from "../store/useAuthStore";
import { ReviewsSection } from "../components/ui/ReviewsSection";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const visibilityConfig: Record<string, { label: string; icon: any; color: string }> = {
  PRIVATE: { label: "Riêng tư", icon: Lock, color: "text-muted-foreground bg-muted" },
  PUBLIC_LINK: { label: "Chia sẻ link", icon: Globe, color: "text-blue-400 bg-blue-500/10" },
  MARKETPLACE: { label: "Cộng đồng", icon: Package, color: "text-primary bg-primary/10" },
};

// ─── Flashcard Flip Card ──────────────────────────────────────────────────────

function FlipCard({ card, index, total }: { card: FlashcardDTO; index: number; total: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setFlipped((f) => !f)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
      aria-label={flipped ? "Đáp án" : "Câu hỏi - bấm Enter hoặc Space để lật"}
      className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
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

  const totalDots = Math.min(20, cards.length);

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
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="flex-1 h-9 rounded-xl border border-border flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} /> Trước
        </button>
        <button
          onClick={() => setIdx((i) => Math.min(cards.length - 1, i + 1))}
          disabled={idx === cards.length - 1}
          className="flex-1 h-9 rounded-xl border border-border flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Sau <ChevronRight size={15} />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1 flex-wrap">
        {Array.from({ length: totalDots }).map((_, i) => {
          const step = cards.length > totalDots ? Math.floor(cards.length / totalDots) : 1;
          const targetIdx = Math.min(i * step, cards.length - 1);
          const isActive = i === Math.floor((idx / Math.max(1, cards.length - 1)) * (totalDots - 1));
          return (
            <button
              key={i}
              onClick={() => setIdx(targetIdx)}
              aria-label={`Đi tới thẻ ${targetIdx + 1}`}
              className={`rounded-full transition-all ${isActive ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`}
            />
          );
        })}
        {cards.length > totalDots && (
          <span className="text-[10px] text-muted-foreground/50">+{cards.length - totalDots}</span>
        )}
      </div>
    </div>
  );
}

// ─── Card Editor Modal ────────────────────────────────────────────────────────

interface CardEditorProps {
  open: boolean;
  initial: { id?: number; frontText: string; backText: string } | null;
  onClose: () => void;
  onSave: (payload: { id?: number; frontText: string; backText: string }) => Promise<void>;
  isSaving: boolean;
}

function CardEditorModal({ open, initial, onClose, onSave, isSaving }: CardEditorProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  useEffect(() => {
    if (open) {
      setFront(initial?.frontText ?? "");
      setBack(initial?.backText ?? "");
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSave = async () => {
    const f = front.trim();
    const b = back.trim();
    if (!f || !b) {
      Notify.warning("Vui lòng nhập đầy đủ mặt trước và mặt sau.");
      return;
    }
    try {
      await onSave({ id: initial?.id, frontText: f, backText: b });
    } catch {
      /* parent handles */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initial?.id ? "Sửa thẻ" : "Thêm thẻ mới"}
      onClick={() => !isSaving && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="surface-card w-full max-w-lg p-6 rounded-2xl border border-border bg-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            {initial?.id ? <Pencil size={15} /> : <Plus size={15} />}
            {initial?.id ? "Sửa thẻ" : "Thêm thẻ mới"}
          </h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            aria-label="Đóng"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mặt trước (câu hỏi)</label>
            <textarea
              rows={3}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="w-full p-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm resize-none"
              placeholder="Ví dụ: Photosynthesis là gì?"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mặt sau (đáp án)</label>
            <textarea
              rows={3}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="w-full p-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm resize-none"
              placeholder="Ví dụ: Quá trình thực vật chuyển hóa ánh sáng thành năng lượng hóa học."
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="h-10 px-4 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isSaving ? "Đang lưu..." : "Lưu thẻ"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── All Cards List ───────────────────────────────────────────────────────────

interface CardsListProps {
  cards: FlashcardDTO[];
  isOwner: boolean;
  onEdit: (card: FlashcardDTO) => void;
  onDelete: (card: FlashcardDTO) => void;
  isMutating: boolean;
}

function CardsList({ cards, isOwner, onEdit, onDelete, isMutating }: CardsListProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (id: number) => {
    setExpanded((prev) => {
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
          <div className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors">
            <button
              onClick={() => toggle(card.id)}
              className="flex items-center gap-3 min-w-0 flex-1 text-left"
            >
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-foreground truncate">{card.frontText}</span>
            </button>
            {isOwner && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(card)}
                  disabled={isMutating}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                  aria-label="Sửa thẻ"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(card)}
                  disabled={isMutating}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  aria-label="Xóa thẻ"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
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
  deck: FlashcardDeckDTO | null;
  deckId: number;
  onBack: () => void;
  onStudy: () => void;
}

type Tab = "preview" | "all-cards" | "reviews";

export default function FlashcardDetailPage({ deck: initialDeck, deckId, onBack, onStudy }: FlashcardDetailPageProps) {
  const { user: authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [deck, setDeck] = useState<FlashcardDeckDTO | null>(initialDeck);
  const [isLoadingDetail, setIsLoadingDetail] = useState(!initialDeck);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [progress, setProgress] = useState<FlashcardProgressDTO | null>(null);

  const [cardEditor, setCardEditor] = useState<{ open: boolean; card: FlashcardDTO | null }>({
    open: false,
    card: null,
  });
  const [isSavingCard, setIsSavingCard] = useState(false);

  const loadDeck = useCallback(async () => {
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await flashcardService.getFlashcardDeckDetails(deckId);
      if (res.success) {
        setDeck(res.data);
      } else {
        setDetailError(res.message || "Không thể tải chi tiết bộ thẻ.");
      }
    } catch (e: any) {
      setDetailError(e?.message || "Lỗi khi tải chi tiết bộ thẻ.");
    } finally {
      setIsLoadingDetail(false);
    }
  }, [deckId]);

  useEffect(() => {
    if (!initialDeck || initialDeck.id !== deckId) {
      loadDeck();
    } else {
      setIsLoadingDetail(false);
    }
  }, [deckId, initialDeck, loadDeck]);

  useEffect(() => {
    if (deckId) {
      flashcardService
        .getFlashcardDeckProgress(deckId)
        .then((res) => {
          if (res.success) setProgress(res.data);
        })
        .catch(() => setProgress(null));
    }
  }, [deckId, deck?.cards?.length]);

  const isOwner = !!authUser && !!deck && (authUser.userId ?? (authUser as any).id) === deck.userId;

  const handleAddCard = () => {
    setCardEditor({ open: true, card: null });
  };

  const handleEditCard = (card: FlashcardDTO) => {
    setCardEditor({ open: true, card });
  };

  const handleDeleteCard = (card: FlashcardDTO) => {
    Confirm.show(
      "Xóa thẻ",
      `Bạn chắc chắn muốn xóa thẻ "${card.frontText.slice(0, 50)}${card.frontText.length > 50 ? "..." : ""}"?`,
      "Xóa",
      "Hủy",
      async () => {
        try {
          await flashcardService.deleteCard(card.id);
          Notify.success("Đã xóa thẻ");
          await loadDeck();
        } catch (e: any) {
          Notify.failure(e?.message || "Lỗi khi xóa thẻ");
        }
      },
    );
  };

  const handleSaveCard = async (payload: { id?: number; frontText: string; backText: string }) => {
    setIsSavingCard(true);
    try {
      if (payload.id) {
        await flashcardService.updateCard(payload.id, payload.frontText, payload.backText);
        Notify.success("Đã cập nhật thẻ");
      } else {
        await flashcardService.addCardToDeck(deckId, payload.frontText, payload.backText);
        Notify.success("Đã thêm thẻ mới");
      }
      setCardEditor({ open: false, card: null });
      await loadDeck();
    } catch (e: any) {
      Notify.failure(e?.message || "Lỗi khi lưu thẻ");
      throw e;
    } finally {
      setIsSavingCard(false);
    }
  };

  if (isLoadingDetail) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 size={28} className="mx-auto mb-3 animate-spin text-primary" />
        Đang tải chi tiết bộ thẻ...
      </div>
    );
  }

  if (detailError || !deck) {
    return (
      <div className="py-20 text-center space-y-3">
        <AlertCircle size={32} className="mx-auto text-destructive/70" />
        <p className="font-medium text-foreground">{detailError || "Không tìm thấy bộ thẻ."}</p>
        <div className="flex justify-center gap-2">
          <button
            onClick={onBack}
            className="h-9 px-4 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80"
          >
            Quay lại
          </button>
          <button
            onClick={loadDeck}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  const visCfg = visibilityConfig[deck.visibility] || visibilityConfig.PRIVATE;
  const VisIcon = visCfg.icon;

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
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
      <CardEditorModal
        open={cardEditor.open}
        initial={cardEditor.card ? { id: cardEditor.card.id, frontText: cardEditor.card.frontText, backText: cardEditor.card.backText } : null}
        onClose={() => !isSavingCard && setCardEditor({ open: false, card: null })}
        onSave={handleSaveCard}
        isSaving={isSavingCard}
      />

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
              <div className="flex items-center gap-2 mb-3 flex-wrap">
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
              {
                icon: BarChart2,
                label: progress ? `Tiến độ (${progress.rememberedRate ?? 0}%)` : "Tỷ lệ duyệt",
                value: progress
                  ? `${progress.reviewedCards}/${progress.totalCards}`
                  : `${deck.acceptPercentage || 0}%`,
                color: "text-emerald-400",
              },
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
              onClick={() => {
                setActiveTab("all-cards");
                setTimeout(() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }, 50);
              }}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-2xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-colors border border-border/50"
            >
              <Sparkles size={15} />  Ôn thẻ đến hạn
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
                  {isOwner && (
                    <button
                      onClick={handleAddCard}
                      className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                    >
                      <Plus size={14} /> Thêm thẻ đầu tiên
                    </button>
                  )}
                </div>
              )
          )}
          {activeTab === "all-cards" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Layers size={15} className="text-primary" />
                  Tất cả {deck.cards.length} thẻ
                </h3>
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <button
                      onClick={handleAddCard}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                    >
                      <Plus size={12} /> Thêm thẻ
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("preview")}
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw size={11} /> Chế độ học
                  </button>
                </div>
              </div>
              {deck.cards.length > 0 ? (
                <CardsList
                  cards={deck.cards}
                  isOwner={isOwner}
                  onEdit={handleEditCard}
                  onDelete={handleDeleteCard}
                  isMutating={isSavingCard}
                />
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                  {isOwner ? "Hãy thêm thẻ đầu tiên cho bộ này." : "Bộ thẻ chưa có thẻ nào."}
                </div>
              )}
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
