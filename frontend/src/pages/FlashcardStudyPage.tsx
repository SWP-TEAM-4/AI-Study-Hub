import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, RotateCw, ThumbsUp, ThumbsDown, Trophy, Calendar, Layers, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { flashcardService, ReviewCardResponseDTO, FlashcardDTO } from "../services/flashcardService";
import { Notify } from "notiflix";
import { useQuery } from "@tanstack/react-query";

interface FlashcardStudyPageProps {
  deckId: string;
  onBack: () => void;
  initialMode?: StudyMode | null;
}

type StudyMode = "all" | "due";

interface CardWithMeta extends FlashcardDTO {
  boxLevel?: number;
  nextReviewAt?: string;
}

export default function FlashcardStudyPage({ deckId, onBack, initialMode = null }: FlashcardStudyPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mode, setMode] = useState<StudyMode | null>(initialMode); // null = chọn mode
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ known: 0, again: 0, total: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isFlipAnimating, setIsFlipAnimating] = useState(false);
  const [exitDirection, setExitDirection] = useState<number | null>(null);
  const [lastReview, setLastReview] = useState<ReviewCardResponseDTO | null>(null);
  const [cards, setCards] = useState<CardWithMeta[]>([]);
  const [initialCardCount, setInitialCardCount] = useState(0);
  const [cardSequence, setCardSequence] = useState(0);
  const [loadingCards, setLoadingCards] = useState(Boolean(initialMode));
  const [loadCardsError, setLoadCardsError] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState<string>("");
  const flipLockedRef = useRef(false); // tránh bấm rate khi chưa lật
  const flipAnimationLockRef = useRef(false);
  const flipTimerRef = useRef<number | null>(null);
  const retrySequenceRef = useRef(0);
  const initialCardsRef = useRef<CardWithMeta[]>([]);

  // Lấy thông tin deck (dùng để có title cho màn hình chọn mode)
  const deckInfoQuery = useQuery({
    queryKey: ["deckDetails", deckId, "info"],
    queryFn: async () => {
      const res = await flashcardService.getFlashcardDeckDetails(Number(deckId));
      if (res.success) {
        setDeckTitle(res.data.title);
      }
      return res;
    },
    enabled: !mode,
    staleTime: 60_000,
  });

  const loadCards = useCallback(
    async (selectedMode: StudyMode) => {
      setLoadingCards(true);
      setLoadCardsError(null);
      try {
        let loadedCards: CardWithMeta[] = [];
        if (selectedMode === "due") {
          const res = await flashcardService.getFlashcardsDue(Number(deckId));
          if (res.success) {
            loadedCards = res.data ?? [];
          } else {
            setLoadCardsError(res.message || "Không thể tải thẻ đến hạn.");
          }
        } else {
          const res = await flashcardService.getFlashcardDeckDetails(Number(deckId));
          if (res.success) {
            setDeckTitle(res.data.title);
            loadedCards = res.data.cards ?? [];
          } else {
            setLoadCardsError(res.message || "Không thể tải bộ thẻ.");
          }
        }
        initialCardsRef.current = loadedCards;
        setCards(loadedCards);
        setInitialCardCount(loadedCards.length);
        setCardSequence(0);
        setFlipped(false);
        setStats({ known: 0, again: 0, total: 0 });
        setLastReview(null);
        retrySequenceRef.current = 0;
        flipLockedRef.current = true; // bắt buộc lật trước khi chấm
      } catch (e: any) {
        setLoadCardsError(e?.message || "Lỗi khi tải danh sách thẻ.");
      } finally {
        setLoadingCards(false);
      }
    },
    [deckId],
  );

  useEffect(() => {
    if (mode) {
      loadCards(mode);
    }
  }, [mode, loadCards]);

  useEffect(() => () => {
    if (flipTimerRef.current !== null) {
      window.clearTimeout(flipTimerRef.current);
    }
  }, []);

  const handleFlip = useCallback(() => {
    if (isSaving || flipAnimationLockRef.current) return;
    flipAnimationLockRef.current = true;
    setIsFlipAnimating(true);
    setFlipped((f) => {
      const next = !f;
      flipLockedRef.current = !next; // chỉ cho phép chấm khi mặt đáp án đang hiển thị
      return next;
    });
    if (flipTimerRef.current !== null) {
      window.clearTimeout(flipTimerRef.current);
    }
    flipTimerRef.current = window.setTimeout(() => {
      flipAnimationLockRef.current = false;
      setIsFlipAnimating(false);
      flipTimerRef.current = null;
    }, shouldReduceMotion ? 40 : 210);
  }, [isSaving, shouldReduceMotion]);

  const advance = useCallback(
    async (known: boolean) => {
      if (isSaving || flipAnimationLockRef.current) return;
      const card = cards[0];
      if (!card) return;
      if (flipLockedRef.current) {
        Notify.warning("Vui lòng lật thẻ trước khi chấm điểm.");
        return;
      }
      setExitDirection(known ? 1 : -1);
      setIsSaving(true);
      try {
        const res = await flashcardService.reviewFlashcard(card.id, known);
        if (!res.success) {
          throw new Error(res.message || "Không thể lưu kết quả ôn tập");
        }
        setLastReview(res.data);
        setStats((s) => ({
          known: s.known + (known ? 1 : 0),
          again: s.again + (known ? 0 : 1),
          total: s.total + 1,
        }));
        await new Promise((resolve) => window.setTimeout(resolve, shouldReduceMotion ? 20 : 150));
        setCards((currentQueue) => {
          const nextQueue = currentQueue.slice(1);
          if (!known && mode === "all") {
            const requeueDistance = 2 + (retrySequenceRef.current % 2);
            retrySequenceRef.current += 1;
            nextQueue.splice(Math.min(requeueDistance, nextQueue.length), 0, card);
          }
          return nextQueue;
        });
        setCardSequence((value) => value + 1);
        setFlipped(false);
        setExitDirection(null);
        flipLockedRef.current = true;
      } catch (e) {
        console.error(e);
        Notify.failure("Lỗi khi lưu kết quả ôn tập");
        setExitDirection(null);
      } finally {
        setIsSaving(false);
      }
    },
    [cards, isSaving, mode, shouldReduceMotion],
  );

  // Phím tắt
  useEffect(() => {
    if (!mode) return;
    if (cards.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (isSaving || flipAnimationLockRef.current) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "1" || e.key === "ArrowLeft") {
        e.preventDefault();
        advance(false);
      } else if (e.key === "2" || e.key === "ArrowRight") {
        e.preventDefault();
        advance(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, cards.length, isSaving, handleFlip, advance, onBack]);

  // ─── Màn hình chọn mode ────────────────────────────────────────────────────
  if (!mode) {
    const totalCards = deckInfoQuery.data?.data?.cards?.length ?? 0;
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 px-3 min-h-[44px] rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft size={14} /> Thoát
          </button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="surface-card p-8 rounded-3xl border border-border shadow-lg"
        >
          <h1 className="text-2xl font-bold">{deckTitle || "Bộ thẻ"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalCards > 0 ? `${totalCards} thẻ trong bộ` : "Đang tải..."}
          </p>

          {deckInfoQuery.isError && (
            <div className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertCircle size={16} /> Không thể tải thông tin bộ thẻ.
            </div>
          )}

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                setLoadingCards(true);
                setMode("all");
              }}
              disabled={deckInfoQuery.isLoading}
              className="group text-left p-5 rounded-2xl border-2 border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              <div className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center mb-3">
                <Layers size={18} />
              </div>
              <div className="font-bold">Học nhanh</div>
              <p className="text-xs text-muted-foreground mt-1">
                Học {totalCards || ""} thẻ; thẻ chưa thuộc sẽ quay lại sau vài thẻ khác.
              </p>
            </button>
            <button
              onClick={() => {
                setLoadingCards(true);
                setMode("due");
              }}
              disabled={deckInfoQuery.isLoading}
              className="group text-left p-5 rounded-2xl border-2 border-border hover:border-primary/60 bg-card hover:bg-muted/40 transition-colors disabled:opacity-50"
            >
              <div className="size-10 rounded-xl bg-muted text-foreground grid place-items-center mb-3">
                <Sparkles size={18} />
              </div>
              <div className="font-bold">Ôn thẻ đến hạn</div>
              <p className="text-xs text-muted-foreground mt-1">
                Chỉ học những thẻ đã đến hạn theo lịch Leitner hiện tại.
              </p>
            </button>
          </div>

          <div className="mt-5 text-[11px] text-muted-foreground">
            <strong>Phím tắt:</strong> Space / Enter lật thẻ · 1 hoặc ← Chưa thuộc · 2 hoặc → Đã thuộc · Esc thoát
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loadingCards) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 size={28} className="mx-auto mb-3 animate-spin text-primary" />
        Đang tải danh sách thẻ...
      </div>
    );
  }

  if (loadCardsError) {
    return (
      <div className="py-20 text-center space-y-3">
        <AlertCircle size={32} className="mx-auto text-destructive/70" />
        <p className="font-medium text-foreground">{loadCardsError}</p>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setMode(null)}
            className="h-9 px-4 rounded-xl bg-muted text-sm font-medium"
          >
            Quay lại
          </button>
          <button
            onClick={() => loadCards(mode)}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // ─── Trống ────────────────────────────────────────────────────────────────
  if (cards.length === 0 && initialCardCount === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center text-muted-foreground space-y-3">
        <p className="text-base font-medium">
          {mode === "due" ? "Không có thẻ nào đến hạn hôm nay. Hoàn hảo!" : "Bộ thẻ này chưa có thẻ nào."}
        </p>
        <button
          onClick={onBack}
          className="text-primary hover:underline min-h-[44px] px-3 rounded-lg"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const card = cards[0];

  // ─── Hoàn thành ───────────────────────────────────────────────────────────
  if (!card) {
    return (
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.22, ease: "easeOut" }}
        className="max-w-xl mx-auto py-8"
      >
        <div className="surface-card p-8 sm:p-10 text-center gradient-hero rounded-3xl border border-border shadow-lg">
          <div className="size-16 mx-auto mb-5 rounded-2xl bg-primary text-primary-foreground grid place-items-center">
            <Trophy size={36} />
          </div>
          <h1 className="text-3xl font-bold">Hoàn thành phiên học</h1>
          <p className="text-muted-foreground mt-2">
            {mode === "all"
              ? `Bạn đã thuộc toàn bộ ${initialCardCount} thẻ trong hàng đợi.`
              : `Bạn đã xử lý ${initialCardCount} thẻ đến hạn.`}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-success">{stats.known}</div>
              <div className="text-xs text-muted-foreground">Đã thuộc</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold" style={{ color: "var(--color-coral)" }}>{stats.again}</div>
              <div className="text-xs text-muted-foreground">Lần học lại</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Tổng lượt</div>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => {
                setCards([...initialCardsRef.current]);
                setStats({ known: 0, again: 0, total: 0 });
                setLastReview(null);
                setFlipped(false);
                setCardSequence(0);
                retrySequenceRef.current = 0;
                flipLockedRef.current = true;
              }}
              className="inline-flex px-5 min-h-[44px] rounded-xl bg-muted text-foreground items-center justify-center font-medium text-sm hover:bg-muted/80 transition-colors gap-2"
            >
              <RotateCw size={14} /> Ôn lại từ đầu
            </button>
            <button
              onClick={onBack}
              className="inline-flex px-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground items-center justify-center font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Về danh sách
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const completedCards = mode === "all" ? stats.known : stats.total;
  const progressPercentage = initialCardCount > 0
    ? Math.min(100, Math.round((completedCards / initialCardCount) * 100))
    : 0;

  // ─── Màn hình học ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 px-3 min-h-[44px] rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft size={14} /> Thoát
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {mode === "due" ? "Ôn đến hạn" : "Học nhanh"}
          </span>
          <div className="text-sm text-muted-foreground">
            Đã thuộc {stats.known} · Còn {cards.length}
          </div>
        </div>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--color-coral)" }}
          initial={false}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, ease: "easeOut" }}
        />
      </div>

      <div className="relative h-72 lg:h-96" style={{ perspective: 1400 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${card.id}-${cardSequence}`}
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: shouldReduceMotion ? 0 : 12 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.15, ease: "easeOut" }}
            className={`absolute inset-0 ${isSaving || isFlipAnimating ? "cursor-not-allowed" : "cursor-pointer"}`}
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                handleFlip();
              }
            }}
            aria-label={flipped ? "Đáp án" : "Câu hỏi - bấm để lật"}
            aria-pressed={flipped}
          >
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                transformStyle: "preserve-3d",
                willChange: isFlipAnimating ? "transform" : "auto",
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 surface-card overflow-hidden rounded-2xl border-2 shadow-lg"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(0deg) translateZ(0.1px)",
                  borderColor:
                    exitDirection === -1
                      ? "oklch(0.62 0.18 25)"
                      : exitDirection === 1
                        ? "var(--color-success)"
                        : "var(--border)",
                }}
              >
                <div className="h-full overflow-y-auto flex items-center justify-center p-8 text-center gradient-hero">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Câu hỏi</div>
                    <div className="text-2xl lg:text-3xl font-display font-semibold leading-tight break-words">{card.frontText}</div>
                    <div className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <RotateCw size={12} /> Bấm để lật thẻ
                    </div>
                  </div>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 surface-card overflow-hidden rounded-2xl border-2 shadow-lg"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg) translateZ(0.1px)",
                  background: "var(--color-ink)",
                  color: "var(--color-cream)",
                  borderColor:
                    exitDirection === -1
                      ? "oklch(0.62 0.18 25)"
                      : exitDirection === 1
                        ? "var(--color-success)"
                        : "var(--border)",
                }}
              >
                <div className="h-full overflow-y-auto flex items-center justify-center p-8 text-center">
                  <div>
                    <div className="text-xs uppercase tracking-wider font-semibold mb-3 opacity-60">Đáp án</div>
                    <div className="text-xl lg:text-2xl font-display font-medium leading-snug break-words">{card.backText}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {lastReview && lastReview.nextReviewAt && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5"
        >
          <Calendar size={12} />
          Lịch ôn tiếp theo: {new Date(lastReview.nextReviewAt).toLocaleString("vi-VN")}
          {typeof lastReview.boxLevel === "number" && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              Hộp {lastReview.boxLevel}
            </span>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => advance(false)}
          disabled={isSaving || isFlipAnimating || flipLockedRef.current}
          className="inline-flex items-center justify-center gap-2 h-12 min-h-[44px] rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ background: "oklch(0.62 0.18 25 / 0.1)", color: "var(--color-coral)" }}
        >
          <ThumbsDown size={16} />
          {isSaving ? "Đang lưu..." : flipLockedRef.current ? "Lật thẻ trước (1)" : "Chưa thuộc (1)"}
        </button>
        <button
          onClick={() => advance(true)}
          disabled={isSaving || isFlipAnimating || flipLockedRef.current}
          className="inline-flex items-center justify-center gap-2 h-12 min-h-[44px] rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ background: "var(--color-success)" }}
        >
          <ThumbsUp size={16} />
          {isSaving ? "Đang lưu..." : flipLockedRef.current ? "Lật thẻ trước (2)" : "Đã thuộc (2)"}
        </button>
      </div>
    </div>
  );
}
