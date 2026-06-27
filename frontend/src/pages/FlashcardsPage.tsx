import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import FlashcardStudyPage from "./FlashcardStudyPage";
import { flashcardService, FlashcardDeckDTO } from "../services/flashcardService";
import { Notify } from "notiflix";

export default function FlashcardsPage() {
  const [q, setQ] = useState("");
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [decksList, setDecksList] = useState<FlashcardDeckDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    setIsLoading(true);
    try {
      const res = await flashcardService.getMyFlashcardDecks(0, 50);
      if (res.success) setDecksList(res.data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const list = useMemo(
    () => decksList.filter((d) => d.title.toLowerCase().includes(q.toLowerCase())),
    [q, decksList],
  );

  const handleGenerateDeck = async () => {
    setIsGenerating(true);
    try {
      const res = await flashcardService.generateFlashcardDeck({ numberOfCards: 20 });
      if (res.success) {
        Notify.success("Đã sinh xong bộ Flashcard bằng AI!");
        setDecksList(prev => [res.data, ...prev]);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi khi sinh Flashcard");
    } finally {
      setIsGenerating(false);
    }
  };

  if (activeDeckId) {
    return <FlashcardStudyPage deckId={activeDeckId} onBack={() => setActiveDeckId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen style={{ color: "var(--color-coral)" }} /> Flashcards
          </h1>
          <p className="text-muted-foreground mt-1">Học lặp lại ngắt quãng theo thuật toán Leitner.</p>
        </div>
        <button 
          onClick={handleGenerateDeck}
          disabled={isGenerating}
          className={`inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium self-start ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
        >
          {isGenerating ? <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Sparkles size={16} />} 
          {isGenerating ? "Đang sinh thẻ..." : "AI tạo deck"}
        </button>
      </div>

      <div className="surface-card p-4 relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm deck..."
          className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {list.map((deck, i) => {
            const masteredCount = Math.floor(deck.cards.length / 2); // Mock mastered count since progress is a separate API
            const pct = deck.cards.length > 0 ? Math.round((masteredCount / deck.cards.length) * 100) : 0;
            return (
              <motion.div
                key={deck.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className="surface-card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">{deck.subjectId ? `Môn #${deck.subjectId}` : "Tự do"}</span>
                  <span className="text-xs text-muted-foreground">{new Date(deck.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-display text-lg font-semibold">{deck.title}</h3>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tiến độ</span>
                  <span className="font-medium">{masteredCount}/{deck.cards.length}</span>
                </div>
                <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(to right, var(--color-coral), var(--color-primary))" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <button
                  onClick={() => setActiveDeckId(deck.id.toString())}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 h-10 rounded-xl text-white text-sm font-medium hover:opacity-90"
                  style={{ background: "var(--color-coral)" }}
                >
                  <Plus size={16} /> Học deck
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
