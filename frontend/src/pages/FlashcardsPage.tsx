import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Plus, Sparkles, MoreHorizontal, Edit, Globe, Tag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import FlashcardStudyPage from "./FlashcardStudyPage";
import { Notify, Confirm } from "notiflix";
import { MockFeatureModal } from "../components/ui/MockFeatureModal";
import CustomSelect from "../components/ui/CustomSelect";
import { 
  useFlashcardDecks, 
  useGenerateFlashcardDeck,
  useDeleteFlashcardDeck
} from "../hooks/useFlashcards";
import { SkeletonCard } from "../components/ui/SkeletonCard";
import { motionFadeUp } from "../lib/motion";

export default function FlashcardsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const { data: decksList = [], isLoading } = useFlashcardDecks();
  const generateMutation = useGenerateFlashcardDeck();
  const isGenerating = generateMutation.isPending;

  const [mockModal, setMockModal] = useState<{ isOpen: boolean; type: "EDIT" | "TAG" }>({ isOpen: false, type: "EDIT" });

  // Mock functions for missing features
  const handleEdit = (id: number) => setMockModal({ isOpen: true, type: "EDIT" });
  const handlePublish = (id: number) => {
    Notify.success("Đã gửi lên cộng đồng! Trạng thái: Chờ duyệt.");
  };
  const handleAddTag = (id: number) => setMockModal({ isOpen: true, type: "TAG" });

  const deleteMutation = useDeleteFlashcardDeck();
  const handleDeleteDeck = (id: number) => {
    deleteMutation.mutate(id);
  };

  const list = useMemo(
    () => {
      let result = decksList.filter((d) => {
        const matchSearch = d.title.toLowerCase().includes(q.toLowerCase());
        const matchSubject = filterSubject === "all" || d.subjectId === Number(filterSubject);
        const matchVis = filterVisibility === "all" || d.visibility === filterVisibility;
        const matchStatus = filterStatus === "all" || true;
        return matchSearch && matchSubject && matchVis && matchStatus;
      });

      if (sortBy === "newest") {
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortBy === "oldest") {
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (sortBy === "az") {
        result.sort((a, b) => a.title.localeCompare(b.title));
      }

      return result;
    },
    [q, filterSubject, filterVisibility, filterStatus, sortBy, decksList],
  );

  const handleGenerateDeck = () => {
    generateMutation.mutate({ numberOfCards: 20 });
  };

  if (activeDeckId) {
    return <FlashcardStudyPage deckId={activeDeckId} onBack={() => setActiveDeckId(null)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <MockFeatureModal 
        isOpen={mockModal.isOpen} 
        onClose={() => setMockModal({ isOpen: false, type: "EDIT" })} 
        type={mockModal.type} 
        itemName="Flashcard Deck" 
      />
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen style={{ color: "var(--color-coral)" }} /> {t('pages.flashcards.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('pages.flashcards.desc')}</p>
        </div>
        <button 
          onClick={handleGenerateDeck}
          disabled={isGenerating}
          className={`inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium self-start ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
        >
          {isGenerating ? <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Sparkles size={16} />} 
          {isGenerating ? t('components.aiConfigModal.processing', "Đang xử lý...") : t('pages.flashcards.addDeck', "+ Tạo Bộ Thẻ")}
        </button>
      </div>

      <div className="surface-card p-3 rounded-2xl flex flex-col lg:flex-row gap-3 items-center relative z-30">
        <div className="flex-1 relative flex items-center w-full">
          <Search className="absolute left-4 text-muted-foreground" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('pages.flashcards.search')}
            className="w-full pl-10 pr-4 h-11 bg-muted/50 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-sm rounded-xl"
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto">
          <CustomSelect
            value={filterSubject}
            onChange={setFilterSubject}
            className="flex-1 md:flex-none w-full md:w-[170px]"
            data={[
              { label: t("filters.allSubjects"), value: "all" },
              {
                label: "Semester 5",
                options: [
                  { label: "SWP391", value: "SWP391" },
                  { label: "SWT301", value: "SWT301" },
                  { label: "SWR302", value: "SWR302" }
                ]
              },
              {
                label: "Semester 4",
                options: [
                  { label: "PRN221", value: "PRN221" },
                  { label: "PRJ301", value: "PRJ301" }
                ]
              }
            ]}
          />
          <CustomSelect
            value={filterVisibility}
            onChange={setFilterVisibility}
            className="flex-1 md:flex-none w-full md:w-[170px]"
            data={[
              { label: t("filters.allVisibility"), value: "all" },
              { label: t("filters.private"), value: "PRIVATE" },
              { label: t("filters.workspace"), value: "WORKSPACE" },
              { label: t("filters.marketplace"), value: "MARKETPLACE" }
            ]}
          />
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            className="flex-1 md:flex-none w-full md:w-[170px]"
            data={[
              { label: t("filters.allStatus"), value: "all" },
              { label: t("filters.pending"), value: "PENDING" },
              { label: t("filters.approved"), value: "APPROVED" },
              { label: t("filters.rejected"), value: "REJECTED" }
            ]}
          />
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            className="flex-1 md:flex-none w-full md:w-[140px]"
            data={[
              { label: t("filters.sortNewest"), value: "newest" },
              { label: t("filters.sortOldest"), value: "oldest" },
              { label: t("filters.sortAZ"), value: "az" }
            ]}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : list.map((deck, i) => {
            const masteredCount = Math.floor(deck.cards.length / 2); // Mock mastered count since progress is a separate API
            const pct = deck.cards.length > 0 ? Math.round((masteredCount / deck.cards.length) * 100) : 0;
            return (
              <motion.div
                key={deck.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="surface-card p-5 !overflow-visible"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-medium mr-2">{deck.subjectId ? `Môn #${deck.subjectId}` : "Tự do"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(deck.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Action Dropdown (Mocked) */}
                  <div className="relative group/menu">
                    <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50">
                      <MoreHorizontal size={16} />
                    </button>
                    <div className="absolute right-0 mt-1 w-40 bg-card border border-border shadow-lg rounded-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleEdit(deck.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                        <Edit size={14} /> {t('pages.flashcards.edit')}
                      </button>
                      <button onClick={() => handleAddTag(deck.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                        <Tag size={14} /> {t('pages.flashcards.addTag')}
                      </button>
                      <button onClick={() => handlePublish(deck.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10">
                        <Globe size={14} /> {t('pages.flashcards.publish')}
                      </button>
                      <button onClick={() => handleDeleteDeck(deck.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 border-t border-border/50">
                        <Trash2 size={14} /> {t('pages.flashcards.delete', "Xóa bộ thẻ")}
                      </button>
                    </div>
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold">{deck.title}</h3>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('pages.flashcards.progress')}</span>
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
                  <Plus size={16} /> {t('pages.flashcards.studyNow')}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
