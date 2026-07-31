import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, Plus, Sparkles, MoreHorizontal, Edit, Globe, Tag, Trash2, Eye,
  AlertCircle, RefreshCw, Clock, Users, Loader2, X, Play, CalendarCheck
} from "lucide-react";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useTranslation } from "react-i18next";
import FlashcardStudyPage from "./FlashcardStudyPage";
import FlashcardDetailPage from "./FlashcardDetailPage";
import { Notify, Confirm } from "notiflix";
import CustomSelect from "../components/ui/CustomSelect";
import MarketplacePublishModal, { MarketplacePublishValues } from "../components/ui/MarketplacePublishModal";
import {
  useFlashcardDecks,
  useGenerateFlashcardDeck,
  useDeleteFlashcardDeck
} from "../hooks/useFlashcards";
import { SkeletonCard } from "../components/ui/SkeletonCard";
import { flashcardService, FlashcardDeckDTO, FlashcardDeckPayload, FlashcardProgressDTO } from "../services/flashcardService";
import { useSubjects } from "../hooks/useSubjects";
import { notebookService, NotebookDTO } from "../services/notebookService";

const visibilityLabel: Record<string, { label: string; icon: any; color: string }> = {
  PRIVATE: { label: "Riêng tư", icon: Globe, color: "text-muted-foreground bg-muted" },
  PUBLIC_LINK: { label: "Chia sẻ link", icon: Users, color: "text-blue-400 bg-blue-500/10" },
  MARKETPLACE: { label: "Cộng đồng", icon: Tag, color: "text-primary bg-primary/10" },
};

const marketStatusBadge: Record<string, { label: string; color: string }> = {
  NONE: { label: "", color: "" },
  PENDING: { label: "Chờ duyệt", color: "bg-amber-500/15 text-amber-500" },
  APPROVED: { label: "Đã duyệt", color: "bg-emerald-500/15 text-emerald-500" },
  REJECTED: { label: "Bị từ chối", color: "bg-red-500/15 text-red-500" },
};

interface AIGenerateModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  notebooks: NotebookDTO[];
  onClose: () => void;
  onSubmit: (payload: { notebookId?: number; numberOfCards: number; language: string }) => void;
}

function AIGenerateModal({ isOpen, isGenerating, notebooks, onClose, onSubmit }: AIGenerateModalProps) {
  const [notebookId, setNotebookId] = useState<string>("");
  const [numberOfCards, setNumberOfCards] = useState<number>(15);
  const [language, setLanguage] = useState<string>("vi");

  useEffect(() => {
    if (isOpen) {
      setNotebookId("");
      setNumberOfCards(15);
      setLanguage("vi");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!notebookId) {
      Notify.warning("Vui lòng chọn một notebook để AI đọc tài liệu và sinh thẻ.");
      return;
    }
    if (numberOfCards < 5 || numberOfCards > 50) {
      Notify.warning("Số thẻ phải nằm trong khoảng 5 - 50.");
      return;
    }
    onSubmit({ notebookId: Number(notebookId), numberOfCards, language });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="AI tạo bộ thẻ"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="surface-card w-full max-w-md p-6 rounded-2xl border border-border bg-card"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> AI tạo bộ thẻ
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Hệ thống sẽ đọc tài liệu trong notebook và tự động sinh các thẻ học.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="size-8 rounded-lg bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Notebook nguồn <span className="text-destructive">*</span>
            </label>
            <CustomSelect
              value={notebookId}
              onChange={setNotebookId}
              searchable={true}
              searchPlaceholder="Tìm notebook theo tên..."
              emptyText="Không tìm thấy notebook phù hợp"
              placeholder="-- Chọn notebook --"
              data={notebooks.map((nb) => ({
                label: nb.title,
                value: String(nb.id),
              }))}
            />
            {notebooks.length === 0 && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Bạn chưa có notebook nào. Hãy tạo notebook và upload tài liệu trước.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Số thẻ cần sinh: <span className="text-foreground">{numberOfCards}</span>
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={numberOfCards}
              onChange={(e) => setNumberOfCards(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>5</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Ngôn ngữ</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !notebookId}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isGenerating && <Loader2 size={14} className="animate-spin" />}
            {isGenerating ? "Đang sinh thẻ..." : "Bắt đầu sinh"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function FlashcardsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [activeStudyMode, setActiveStudyMode] = useState<"all" | "due" | null>(null);
  const [detailDeckId, setDetailDeckId] = useState<number | null>(null);
  const [detailDeckCache, setDetailDeckCache] = useState<FlashcardDeckDTO | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [publishDeck, setPublishDeck] = useState<FlashcardDeckDTO | null>(null);
  const [isPublishingDeck, setIsPublishingDeck] = useState(false);

  const { data: decksList = [], isLoading, isError, error, refetch } = useFlashcardDecks();
  const generateMutation = useGenerateFlashcardDeck();
  const isGenerating = generateMutation.isPending;
  const [progressMap, setProgressMap] = useState<Record<number, FlashcardProgressDTO>>({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeckDTO | null>(null);
  const [deckForm, setDeckForm] = useState<FlashcardDeckPayload>({ title: "" });
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const { subjects, subjectMap, isLoading: isLoadingSubjects } = useSubjects();
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
    setDeckForm({ title: "" });
    setIsEditorOpen(true);
  };

  const toNullableNumber = (value: string) => (value ? Number(value) : null);

  const handleEdit = (deck: FlashcardDeckDTO) => {
    setEditingDeck(deck);
    setDeckForm({
      title: deck.title,
      notebookId: deck.notebookId,
      subjectId: deck.subjectId,
    });
    setIsEditorOpen(true);
  };

  const handleSaveDeck = async () => {
    const title = deckForm.title.trim();
    if (!title) {
      Notify.warning("Tên bộ thẻ không được để trống");
      return;
    }
    if (title.length > 255) {
      Notify.warning("Tên bộ thẻ tối đa 255 ký tự");
      return;
    }
    setIsSavingDeck(true);
    try {
      if (editingDeck) {
        await flashcardService.updateFlashcardDeck(editingDeck.id, { ...deckForm, title });
        Notify.success("Đã cập nhật bộ thẻ");
      } else {
        await flashcardService.createFlashcardDeck({ ...deckForm, title });
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

  const handlePublish = (deck: FlashcardDeckDTO) => {
    if (deck.clonedFromId) {
      Notify.warning("Bộ Flashcard clone từ Marketplace không thể đăng lại lên cộng đồng.");
      return;
    }

    const cardCount = progressMap[deck.id]?.totalCards ?? deck.cards.length;
    if (cardCount <= 0) {
      Notify.warning("Bộ Flashcard cần có ít nhất một thẻ trước khi đăng lên cộng đồng.");
      return;
    }

    setPublishDeck(deck);
  };

  const submitDeckToMarketplace = async (values: MarketplacePublishValues) => {
    if (!publishDeck) return;
    setIsPublishingDeck(true);
    try {
      const metadataChanged = publishDeck.title !== values.title || publishDeck.subjectId !== values.subjectId;
      if (metadataChanged) {
        await flashcardService.updateFlashcardDeck(publishDeck.id, {
          title: values.title,
          notebookId: publishDeck.notebookId,
          subjectId: values.subjectId,
        });
      }
      await flashcardService.submitToMarketplace(publishDeck.id, values.reviewNote);
      setPublishDeck(null);
      Notify.success(`Đã gửi “${values.title}” lên Marketplace. Trạng thái: Chờ duyệt.`);
      await refetch();
    } catch (e: any) {
      Notify.failure(e.message || "Không thể gửi bộ thẻ lên Marketplace");
    } finally {
      setIsPublishingDeck(false);
    }
  };
  const handleAddTag = () => Notify.warning("Backend hiện chưa có API gắn tag cho Flashcard Deck. API tag hiện chỉ hỗ trợ Document.");

  const deleteMutation = useDeleteFlashcardDeck();
  const handleDeleteDeck = (id: number, title: string) => {
    Confirm.show(
      "Xóa bộ thẻ",
      `Bạn chắc chắn muốn xóa vĩnh viễn bộ thẻ "${title}"? Hành động này không thể hoàn tác.`,
      "Xóa vĩnh viễn",
      "Hủy",
      () => deleteMutation.mutate(id),
    );
  };

  const handleViewDetail = (deck: FlashcardDeckDTO) => {
    setDetailDeckCache(deck);
    setDetailDeckId(deck.id);
  };

  const startStudy = (deckId: number, mode: "all" | "due") => {
    setActiveStudyMode(mode);
    setActiveDeckId(deckId.toString());
  };

  const list = useMemo(
    () => {
      let result = decksList.filter((d) => {
        const matchSearch = !q || d.title.toLowerCase().includes(q.toLowerCase());
        const matchSubject = filterSubject === "all" || d.subjectId === Number(filterSubject);
        const matchVis = filterVisibility === "all" || d.visibility === filterVisibility;
        const matchStatus = filterStatus === "all" || d.marketStatus === filterStatus;
        return matchSearch && matchSubject && matchVis && matchStatus;
      });

      if (sortBy === "newest") {
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortBy === "oldest") {
        result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (sortBy === "az") {
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
      }

      return result;
    },
    [q, filterSubject, filterVisibility, filterStatus, sortBy, decksList],
  );

  const handleGenerateDeck = (payload: { notebookId?: number; numberOfCards: number; language: string }) => {
    generateMutation.mutate(
      { notebookId: payload.notebookId, numberOfCards: payload.numberOfCards },
      {
        onSuccess: () => {
          setIsAIModalOpen(false);
        },
      },
    );
  };

  if (activeDeckId) {
    return (
      <Suspense fallback={<div className="py-20 text-center text-muted-foreground"><div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />Đang tải dữ liệu bộ thẻ...</div>}>
        <FlashcardStudyPage
          deckId={activeDeckId}
          initialMode={activeStudyMode}
          onBack={() => {
            setActiveDeckId(null);
            setActiveStudyMode(null);
          }}
        />
      </Suspense>
    );
  }

  if (detailDeckId !== null) {
    return (
      <FlashcardDetailPage
        deck={detailDeckCache}
        deckId={detailDeckId}
        onBack={() => {
          setDetailDeckId(null);
          setDetailDeckCache(null);
          refetch();
        }}
        onStudy={() => {
          setActiveStudyMode(null);
          setActiveDeckId(detailDeckId.toString());
          setDetailDeckId(null);
        }}
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
      <AnimatePresence>
        {isAIModalOpen && (
          <AIGenerateModal
            isOpen={isAIModalOpen}
            isGenerating={isGenerating}
            notebooks={notebooks}
            onClose={() => !isGenerating && setIsAIModalOpen(false)}
            onSubmit={handleGenerateDeck}
          />
        )}
      </AnimatePresence>

      <MarketplacePublishModal
        isOpen={Boolean(publishDeck)}
        kind="FLASHCARD_DECK"
        target={publishDeck ? {
          id: publishDeck.id,
          title: publishDeck.title,
          subjectId: publishDeck.subjectId,
          itemCount: progressMap[publishDeck.id]?.totalCards ?? publishDeck.cards.length,
          isResubmission: publishDeck.marketStatus === "REJECTED",
        } : null}
        subjects={subjects}
        isSubmitting={isPublishingDeck}
        onClose={() => !isPublishingDeck && setPublishDeck(null)}
        onSubmit={submitDeckToMarketplace}
      />

      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingDeck ? "Sửa bộ thẻ" : "Tạo bộ thẻ mới"}
          onClick={() => !isSavingDeck && setIsEditorOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="surface-card w-full max-w-lg p-5 rounded-2xl border border-border bg-card"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold">{editingDeck ? "Sửa bộ thẻ" : "Tạo bộ thẻ mới"}</h2>
                <p className="text-sm text-muted-foreground">Lưu trực tiếp vào backend Flashcard Deck.</p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                aria-label="Đóng"
                className="size-8 rounded-lg bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Tên bộ thẻ <span className="text-destructive">*</span>
                </label>
                <input
                  value={deckForm.title}
                  onChange={(e) => setDeckForm((prev: FlashcardDeckPayload) => ({ ...prev, title: e.target.value }))}
                  maxLength={255}
                  className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm"
                  placeholder="Ví dụ: Từ vựng tiếng Anh Unit 3"
                />
                <div className="text-[10px] text-muted-foreground text-right mt-1">
                  {deckForm.title.length}/255
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Môn học</label>
                  <CustomSelect
                    value={deckForm.subjectId ? String(deckForm.subjectId) : ""}
                    onChange={(v) =>
                      setDeckForm((prev: FlashcardDeckPayload) => ({ ...prev, subjectId: toNullableNumber(v) }))
                    }
                    searchable={true}
                    searchPlaceholder="Tìm môn học..."
                    emptyText="Không tìm thấy môn phù hợp"
                    placeholder="Chọn môn học"
                    allowEmpty={true}
                    emptyOptionLabel="Không chọn môn"
                    data={subjects.map((s) => ({
                      label: `${s.code} - ${s.name}`,
                      value: String(s.id),
                    }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Notebook</label>
                  <CustomSelect
                    value={deckForm.notebookId ? String(deckForm.notebookId) : ""}
                    onChange={(v) =>
                      setDeckForm((prev: FlashcardDeckPayload) => ({ ...prev, notebookId: toNullableNumber(v) }))
                    }
                    searchable={true}
                    searchPlaceholder="Tìm notebook..."
                    emptyText="Không tìm thấy notebook phù hợp"
                    placeholder="Chọn notebook"
                    allowEmpty={true}
                    emptyOptionLabel="Không gắn notebook"
                    data={notebooks.map((n) => ({
                      label: n.title,
                      value: String(n.id),
                    }))}
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsEditorOpen(false)}
                disabled={isSavingDeck}
                className="h-10 px-4 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                disabled={isSavingDeck}
                onClick={handleSaveDeck}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isSavingDeck && <Loader2 size={14} className="animate-spin" />}
                {isSavingDeck ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen style={{ color: "var(--color-coral)" }} /> {t('pages.flashcards.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('pages.flashcards.desc')}</p>
        </div>
        <div className="flex gap-2 self-start">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80"
          >
            <Plus size={16} /> Tạo thủ công
          </button>
          <button
            onClick={() => setIsAIModalOpen(true)}
            disabled={isGenerating}
            className={`inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGenerating ? t('components.aiConfigModal.processing', "Đang xử lý...") : "AI tạo bộ thẻ"}
          </button>
        </div>
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
            searchable={true}
            searchPlaceholder="Tìm môn học..."
            emptyText="Không tìm thấy môn phù hợp"
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
              { label: "Riêng tư", value: "PRIVATE" },
              { label: "Chia sẻ link", value: "PUBLIC_LINK" },
              { label: "Cộng đồng", value: "MARKETPLACE" },
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
              { label: t("filters.rejected"), value: "REJECTED" },
            ]}
          />
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            className="flex-1 md:flex-none w-full md:w-[140px]"
            data={[
              { label: t("filters.sortNewest"), value: "newest" },
              { label: t("filters.sortOldest"), value: "oldest" },
              { label: t("filters.sortAZ"), value: "az" },
            ]}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {isError ? (
            <div className="col-span-full py-12 text-center bg-muted/25 rounded-2xl border border-dashed border-border/60 space-y-3">
              <AlertCircle size={32} className="mx-auto text-destructive/70" />
              <p className="font-medium text-foreground">Không thể tải danh sách bộ thẻ</p>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || "Đã có lỗi xảy ra. Vui lòng thử lại."}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
              >
                <RefreshCw size={14} /> Thử lại
              </button>
            </div>
          ) : isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : list.length > 0 ? (
            list.map((deck, i) => {
              const progress = progressMap[deck.id];
              const studiedCount = progress?.reviewedCards ?? 0;
              const totalCards = progress?.totalCards ?? deck.cards.length;
              const studiedPct = totalCards > 0 ? Math.min(100, Math.round((studiedCount / totalCards) * 100)) : 0;
              const subject = deck.subjectId ? subjectMap[deck.subjectId] : null;
              const visKey = (deck.visibility as string) || "PRIVATE";
              const visBadge = visibilityLabel[visKey] || visibilityLabel.PRIVATE;
              const VisIcon = visBadge.icon;
              const mBadge = marketStatusBadge[deck.marketStatus] || marketStatusBadge.NONE;
              return (
                <motion.div
                  key={deck.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => handleViewDetail(deck)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleViewDetail(deck);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Xem chi tiết bộ flashcard ${deck.title}`}
                  className="surface-card p-5 !overflow-visible flex h-full flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span
                        className={`inline-flex min-h-6 items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${visBadge.color}`}
                      >
                        <VisIcon size={12} />
                        {visBadge.label}
                      </span>
                      <span
                        title={subject ? `${subject.code} - ${subject.name}` : "Tự do"}
                        className="max-w-full truncate text-xs px-2.5 py-1 rounded-full bg-muted font-medium text-muted-foreground"
                      >
                        {subject ? `${subject.code} - ${subject.name}` : "Tự do"}
                      </span>
                      {mBadge.label && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${mBadge.color}`}>
                          {mBadge.label}
                        </span>
                      )}
                    </div>

                    {/* Action Dropdown */}
                    <div className="relative group/menu shrink-0">
                      <button
                        aria-label="Mở menu thao tác"
                        onClick={(event) => event.stopPropagation()}
                        className="grid size-11 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      <div
                        className="absolute right-0 mt-1 w-44 bg-card border border-border shadow-lg rounded-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible group-focus-within/menu:opacity-100 group-focus-within/menu:visible transition-all z-20 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleViewDetail(deck)}
                          className="flex min-h-11 items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50"
                        >
                          <Eye size={14} /> Xem chi tiết
                        </button>
                        <button
                          onClick={() => handleEdit(deck)}
                          className="flex min-h-11 items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50"
                        >
                          <Edit size={14} /> {t('pages.flashcards.edit')}
                        </button>
                        <button
                          onClick={handleAddTag}
                          className="flex min-h-11 items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50"
                        >
                          <Tag size={14} /> {t('pages.flashcards.addTag')}
                        </button>
                        {!deck.clonedFromId && deck.marketStatus !== "PENDING" && deck.marketStatus !== "APPROVED" && (
                          <button
                            onClick={() => handlePublish(deck)}
                            className="flex min-h-11 items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10"
                          >
                            <Globe size={14} /> {t('pages.flashcards.publish')}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDeck(deck.id, deck.title)}
                          className="flex min-h-11 items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 border-t border-border/50"
                        >
                          <Trash2 size={14} /> {t('pages.flashcards.delete', "Xóa bộ thẻ")}
                        </button>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-semibold leading-snug line-clamp-2 min-h-[3.1rem]">
                    {deck.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen size={13} /> {totalCards} thẻ
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} /> Tạo {new Date(deck.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      {deck.clonedFromId ? "Từ Marketplace" : "Tự tạo"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      Đã học
                    </span>
                    <span className="font-medium">
                      {studiedCount}/{totalCards}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(to right, var(--color-coral), var(--color-primary))" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${studiedPct}%` }}
                      transition={{ duration: 0.35, delay: i * 0.03, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-auto pt-5 grid grid-cols-2 gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        startStudy(deck.id, "all");
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <Play size={15} fill="currentColor" /> Học nhanh
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        startStudy(deck.id, "due");
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
                    >
                      <CalendarCheck size={15} /> Ôn đến hạn
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/25 rounded-2xl border border-dashed border-border/60">
              <p className="text-base font-medium">Kho flashcard của bạn đang trống.</p>
              <p className="text-sm opacity-70 mt-1">
                Hãy thử đổi bộ lọc hoặc bấm nút "Tạo thủ công" / "AI tạo bộ thẻ" phía trên để bắt đầu nhé!
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
