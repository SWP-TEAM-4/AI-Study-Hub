import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Plus, Sparkles, MoreHorizontal, Edit, Globe, Tag } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import FlashcardStudyPage from "./FlashcardStudyPage";
import { flashcardService, FlashcardDeckDTO } from "../services/flashcardService";
import { Notify } from "notiflix";
import { MockFeatureModal } from "../components/ui/MockFeatureModal";
import CustomSelect from "../components/ui/CustomSelect";

export default function FlashcardsPage() {
  const [q, setQ] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [decksList, setDecksList] = useState<FlashcardDeckDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [mockModal, setMockModal] = useState<{ isOpen: boolean; type: "EDIT" | "TAG" }>({ isOpen: false, type: "EDIT" });

  // Mock functions for missing features
  const handleEdit = (id: number) => setMockModal({ isOpen: true, type: "EDIT" });
  const handlePublish = (id: number) => {
    Notify.success("Đã gửi lên cộng đồng! Trạng thái: Chờ duyệt.");
    // In real app: call API to update visibility to MARKETPLACE
  };
  const handleAddTag = (id: number) => setMockModal({ isOpen: true, type: "TAG" });

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
      <MockFeatureModal 
        isOpen={mockModal.isOpen} 
        onClose={() => setMockModal({ isOpen: false, type: "EDIT" })} 
        type={mockModal.type} 
        itemName="Flashcard Deck" 
      />
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

      <div className="surface-card p-3 rounded-2xl flex flex-col lg:flex-row gap-3 items-center relative z-30">
        <div className="flex-1 relative flex items-center w-full">
          <Search className="absolute left-4 text-muted-foreground" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm deck theo tên..."
            className="w-full pl-10 pr-4 h-11 bg-muted/50 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-sm rounded-xl"
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto">
          <CustomSelect
            value={filterSubject}
            onChange={setFilterSubject}
            className="flex-1 md:flex-none min-w-[140px]"
            data={[
              { label: "Tất cả môn học", value: "all" },
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
            className="flex-1 md:flex-none min-w-[140px]"
            data={[
              { label: "Tất cả hiển thị", value: "all" },
              { label: "Riêng tư", value: "PRIVATE" },
              { label: "Workspace", value: "WORKSPACE" },
              { label: "Marketplace", value: "MARKETPLACE" }
            ]}
          />
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            className="flex-1 md:flex-none min-w-[140px]"
            data={[
              { label: "Tất cả trạng thái", value: "all" },
              { label: "Chờ duyệt", value: "PENDING" },
              { label: "Đã duyệt", value: "APPROVED" },
              { label: "Từ chối", value: "REJECTED" }
            ]}
          />
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            className="flex-1 md:flex-none min-w-[130px]"
            data={[
              { label: "Mới nhất", value: "newest" },
              { label: "Cũ nhất", value: "oldest" },
              { label: "A-Z", value: "az" }
            ]}
          />
        </div>
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
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium mr-2">{deck.subjectId ? `Môn #${deck.subjectId}` : "Tự do"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(deck.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Action Dropdown (Mocked) */}
                  <div className="relative group/menu">
                    <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50">
                      <MoreHorizontal size={16} />
                    </button>
                    <div className="absolute right-0 mt-1 w-40 bg-card border border-border shadow-lg rounded-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleEdit(deck.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                        <Edit size={14} /> Sửa
                      </button>
                      <button onClick={() => handleAddTag(deck.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                        <Tag size={14} /> Gắn thẻ
                      </button>
                      <button onClick={() => handlePublish(deck.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10">
                        <Globe size={14} /> Đăng cộng đồng
                      </button>
                    </div>
                  </div>
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
