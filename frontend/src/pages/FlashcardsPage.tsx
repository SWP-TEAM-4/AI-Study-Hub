import { motion, AnimatePresence } from "framer-motion";
<<<<<<< HEAD
import { BookOpen, Search, Plus, Sparkles, MoreHorizontal, Edit, Globe, Tag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, Suspense } from "react";
=======
<<<<<<< HEAD
import { BookOpen, Search, Plus, Sparkles, MoreHorizontal, Edit, Globe, Tag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, Suspense } from "react";
=======
import { BookOpen, Search, Plus, Sparkles, MoreHorizontal, Edit, Globe, Tag, Trash2, Eye } from "lucide-react";
import { useMemo, useState } from "react";
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
import { useTranslation } from "react-i18next";
import FlashcardStudyPage from "./FlashcardStudyPage";
import FlashcardDetailPage from "./FlashcardDetailPage";
import { Notify, Confirm } from "notiflix";
import CustomSelect from "../components/ui/CustomSelect";
import {
  useFlashcardDecks,
  useGenerateFlashcardDeck,
  useDeleteFlashcardDeck
} from "../hooks/useFlashcards";
import { SkeletonCard } from "../components/ui/SkeletonCard";
import { flashcardService, FlashcardDeckDTO, FlashcardDeckPayload, FlashcardProgressDTO } from "../services/flashcardService";
import { useSubjects } from "../hooks/useSubjects";
import { notebookService, NotebookDTO } from "../services/notebookService";

export default function FlashcardsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
<<<<<<< HEAD
  const [detailDeck, setDetailDeck] = useState<FlashcardDeckDTO | null>(null);
  const { data: decksList = [], isLoading, refetch } = useFlashcardDecks();
=======
<<<<<<< HEAD
  const { data: decksList = [], isLoading, refetch } = useFlashcardDecks();
=======
  const [detailDeck, setDetailDeck] = useState<FlashcardDeckDTO | null>(null);
  const { data: decksList = [], isLoading } = useFlashcardDecks();
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
  const generateMutation = useGenerateFlashcardDeck();
  const isGenerating = generateMutation.isPending;
  const [progressMap, setProgressMap] = useState<Record<number, FlashcardProgressDTO>>({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeckDTO | null>(null);
  const [deckForm, setDeckForm] = useState<FlashcardDeckPayload>({ title: "", visibility: "PRIVATE" });
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const { subjects, isLoading: isLoadingSubjects } = useSubjects();
  const [notebooks, setNotebooks] = useState<NotebookDTO[]>([]);

  useEffect(() => {
    if (decksList.length === 0) return;
    let cancelled = false;
    Promise.all(
      decksList.map(async (deck) => {
        try {
          const res = await flashcardService.getFlashcardDeckProgress(deck.id);
          return [deck.id, res.data] as const;
        } catch {
          return null;
        }
      }),
    ).then((items) => {
      if (cancelled) return;
      setProgressMap(
        items.reduce<Record<number, FlashcardProgressDTO>>((acc, item) => {
          if (item) acc[item[0]] = item[1];
          return acc;
        }, {}),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [decksList]);

  useEffect(() => {
    notebookService.getNotebooks(0, 100)
      .then((res) => {
        if (res.success) setNotebooks(res.data.items);
      })
      .catch(() => {
        setNotebooks([]);
      });
  }, []);

  const openCreateModal = () => {
    setEditingDeck(null);
    setDeckForm({ title: "", visibility: "PRIVATE" });
    setIsEditorOpen(true);
  };

  const toNullableNumber = (value: string) => (value ? Number(value) : null);

  const handleEdit = (deck: FlashcardDeckDTO) => {
    setEditingDeck(deck);
    setDeckForm({
      title: deck.title,
      notebookId: deck.notebookId,
      subjectId: deck.subjectId,
      visibility: deck.visibility,
    });
    setIsEditorOpen(true);
  };

  const handleSaveDeck = async () => {
    if (!deckForm.title.trim()) {
      Notify.warning("Tên bộ thẻ không được để trống");
      return;
    }
    setIsSavingDeck(true);
    try {
      if (editingDeck) {
        await flashcardService.updateFlashcardDeck(editingDeck.id, deckForm);
        Notify.success("Đã cập nhật bộ thẻ");
      } else {
        await flashcardService.createFlashcardDeck(deckForm);
        Notify.success("Đã tạo bộ thẻ mới");
      }
      setIsEditorOpen(false);
      await refetch();
    } catch (e: any) {
      Notify.failure(e.message || "Không thể lưu bộ thẻ");
    } finally {
      setIsSavingDeck(false);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await flashcardService.submitToMarketplace(id);
      Notify.success("Đã gửi bộ thẻ lên Marketplace. Trạng thái: Chờ duyệt.");
      await refetch();
    } catch (e: any) {
      Notify.failure(e.message || "Không thể gửi bộ thẻ lên Marketplace");
    }
  };
  const handleAddTag = () => Notify.warning("Backend hiện chưa có API gắn tag cho Flashcard Deck. API tag hiện chỉ hỗ trợ Document.");

  const deleteMutation = useDeleteFlashcardDeck();
  const handleDeleteDeck = (id: number) => {
    Confirm.show(
      "Xóa bộ thẻ",
      "Bạn chắc chắn muốn xóa bộ flashcard này?",
      "Xóa",
      "Hủy",
      () => deleteMutation.mutate(id),
    );
  };

  const list = useMemo(
    () => {
      let result = decksList.filter((d) => {
        const matchSearch = d.title.toLowerCase().includes(q.toLowerCase());
        const matchSubject = filterSubject === "all" || d.subjectId === Number(filterSubject);
        const matchVis = filterVisibility === "all" || d.visibility === filterVisibility;
        const matchStatus = filterStatus === "all" || d.marketStatus === filterStatus;
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
    return (
      <Suspense fallback={<div className="py-20 text-center text-muted-foreground"><div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />Đang tải dữ liệu bộ thẻ...</div>}>
        <FlashcardStudyPage deckId={activeDeckId} onBack={() => setActiveDeckId(null)} />
      </Suspense>
    );
  }

  if (detailDeck) {
    return (
      <FlashcardDetailPage
        deck={detailDeck}
        onBack={() => setDetailDeck(null)}
        onStudy={() => { setActiveDeckId(detailDeck.id.toString()); setDetailDeck(null); }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface-card w-full max-w-lg p-5 rounded-2xl border border-border bg-card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold">{editingDeck ? "Sửa bộ thẻ" : "Tạo bộ thẻ mới"}</h2>
                <p className="text-sm text-muted-foreground">Lưu trực tiếp vào backend Flashcard Deck.</p>
              </div>
              <button onClick={() => setIsEditorOpen(false)} className="size-8 rounded-lg bg-muted text-muted-foreground hover:text-foreground">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tên bộ thẻ</label>
                <input
                  value={deckForm.title}
                  onChange={(e) => setDeckForm((prev: FlashcardDeckPayload) => ({ ...prev, title: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Môn học</label>
                  <select
                    value={deckForm.subjectId ?? ""}
                    onChange={(e) => setDeckForm((prev: FlashcardDeckPayload) => ({ ...prev, subjectId: toNullableNumber(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm"
                    disabled={isLoadingSubjects}
                  >
                    <option value="">Không chọn môn</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Notebook</label>
                  <select
                    value={deckForm.notebookId ?? ""}
                    onChange={(e) => setDeckForm((prev: FlashcardDeckPayload) => ({ ...prev, notebookId: toNullableNumber(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm"
                  >
                    <option value="">Không gắn notebook</option>
                    {notebooks.map((notebook) => (
                      <option key={notebook.id} value={notebook.id}>
                        {notebook.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Hiển thị</label>
                  <select
                    value={deckForm.visibility || "PRIVATE"}
                    onChange={(e) => setDeckForm((prev: FlashcardDeckPayload) => ({ ...prev, visibility: e.target.value as FlashcardDeckPayload["visibility"] }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm"
                  >
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="WORKSPACE">WORKSPACE</option>
                    <option value="MARKETPLACE">MARKETPLACE</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setIsEditorOpen(false)} className="h-10 px-4 rounded-xl bg-muted text-sm font-medium">Hủy</button>
              <button disabled={isSavingDeck} onClick={handleSaveDeck} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                {isSavingDeck ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
<<<<<<< HEAD
=======
=======
      <MockFeatureModal
        isOpen={mockModal.isOpen}
        onClose={() => setMockModal({ isOpen: false, type: "EDIT" })}
        type={mockModal.type}
        itemName="Flashcard Deck"
      />
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen style={{ color: "var(--color-coral)" }} /> {t('pages.flashcards.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('pages.flashcards.desc')}</p>
        </div>
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
        <div className="flex gap-2 self-start">
          <button onClick={openCreateModal} className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80">
            <Plus size={16} /> Tạo thủ công
          </button>
          <button 
            onClick={handleGenerateDeck}
            disabled={isGenerating}
            className={`inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            {isGenerating ? <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Sparkles size={16} />} 
            {isGenerating ? t('components.aiConfigModal.processing', "Đang xử lý...") : "AI tạo bộ thẻ"}
          </button>
        </div>
<<<<<<< HEAD
=======
=======
        <button
          onClick={handleGenerateDeck}
          disabled={isGenerating}
          className={`inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium self-start ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
        >
          {isGenerating ? <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Sparkles size={16} />}
          {isGenerating ? t('components.aiConfigModal.processing', "Đang xử lý...") : t('pages.flashcards.addDeck', "+ Tạo Bộ Thẻ")}
        </button>
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
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
              ...subjects.map((subject) => ({
                label: `${subject.code} - ${subject.name}`,
                value: String(subject.id),
              })),
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
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
          ) : list.map((deck, i) => {
            const progress = progressMap[deck.id];
            const masteredCount = progress?.reviewedCards ?? 0;
            const totalCards = progress?.totalCards ?? deck.cards.length;
            const pct = totalCards > 0 ? Math.round(progress?.rememberedRate ?? 0) : 0;
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
                  
                  {/* Action Dropdown */}
                  <div className="relative group/menu">
                    <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50">
                      <MoreHorizontal size={16} />
                    </button>
                    <div className="absolute right-0 mt-1 w-40 bg-card border border-border shadow-lg rounded-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleEdit(deck)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                        <Edit size={14} /> {t('pages.flashcards.edit')}
                      </button>
                      <button onClick={handleAddTag} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
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
                  <span className="font-medium">{masteredCount}/{totalCards}</span>
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
<<<<<<< HEAD
=======
=======
          ) : list.length > 0 ? (
            list.map((deck, i) => {
              const masteredCount = Math.floor(deck.cards.length / 2);
              const pct = deck.cards.length > 0 ? Math.round((masteredCount / deck.cards.length) * 100) : 0;
              return (
                <motion.div key={deck.id} layout className="surface-card p-5 !overflow-visible">
                  {/* ...Giữ nguyên toàn bộ code render bộ thẻ hiện tại của bạn... */}
                </motion.div>
              );
            })
          ) : (
            /* --- THÊM ĐOẠN ĐIỀU KIỆN NÀY VÀO --- */
            <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/25 rounded-2xl border border-dashed border-border/60">
              <p className="text-base font-medium">Kho flashcard của bạn đang trống.</p>
              <p className="text-sm opacity-70 mt-1">Hãy thử đổi bộ lọc hoặc bấm nút "+ Tạo Bộ Thẻ" phía trên để bắt đầu nhé!</p>
            </div>
          )}
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
