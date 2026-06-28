import { motion } from "framer-motion";
import { Users, Star, Download, Search, FileText, GraduationCap, BookOpen, Filter, Trophy, Medal, Bookmark, CheckCircle2, ChevronLeft, ChevronRight, SlidersHorizontal, AlertCircle } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { marketItems } from "../lib/mock-data";
import { communityService, ContributorDTO } from "../services/communityService";
import { documentService, DocumentDTO } from "../services/documentService";
import { flashcardService, MarketplaceFlashcardDeckDTO } from "../services/flashcardService";
import CommunityItemModal from "./CommunityItemModal";
import { Notify } from "notiflix";

const kindStyle: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  doc: { icon: FileText, color: "165", label: "Tài liệu" },
  quiz: { icon: GraduationCap, color: "35", label: "Quiz" },
  deck: { icon: BookOpen, color: "250", label: "Flashcards" },
};

export default function CommunityPage() {
  const [tab, setTab] = useState<"all" | "doc" | "quiz" | "deck" | "leaderboard">("all");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "downloaded" | "rated" | "trending">("newest");
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const [isLoading, setIsLoading] = useState(true);

  const [contributors, setContributors] = useState<ContributorDTO[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [communityDocs, setCommunityDocs] = useState<DocumentDTO[]>([]);
  const [communityDecks, setCommunityDecks] = useState<MarketplaceFlashcardDeckDTO[]>([]);

  const [selectedItem, setSelectedItem] = useState<{ id: number; type: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK"; title: string } | null>(null);

  useEffect(() => {
    let timeoutId: any;
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([
        loadCommunityDocs(),
        loadCommunityDecks()
      ]);
      timeoutId = setTimeout(() => setIsLoading(false), 600); // 600ms minimum skeleton time for UX
    };
    fetchAll();
    return () => clearTimeout(timeoutId);
  }, [q]);

  const loadCommunityDocs = async () => {
    try {
      const res = await documentService.getCommunityDocuments(0, 50, q);
      if (res.success) setCommunityDocs(res.data.items);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCommunityDecks = async () => {
    try {
      const res = await flashcardService.getMarketplaceFlashcardDecks(0, 50, q);
      if (res.success) setCommunityDecks(res.data.items);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (tab === "leaderboard" && contributors.length === 0) {
      setLoadingLeaderboard(true);
      communityService.getLeaderboardContributors().then(res => {
        if (res.success) setContributors(res.data.items);
        setLoadingLeaderboard(false);
      });
    }
  }, [tab]);

  const list = useMemo(() => {
    const dynamicDocs = (communityDocs || []).map(d => ({
      id: "doc_" + d.id,
      realId: d.id,
      kind: "doc",
      title: d.title,
      subject: d.subjectId ? `Môn #${d.subjectId}` : "Tài liệu chung",
      author: `User ${d.userId}`,
      isVerified: d.userId % 3 === 0, // Mock verified logic
      rating: d.acceptPercentage ? (d.acceptPercentage / 20).toFixed(1) : "4.8",
      downloads: d.downloadCount,
    }));
    const dynamicDecks = (communityDecks || []).map(d => ({
      id: "deck_" + d.targetId,
      realId: d.targetId,
      kind: "deck",
      title: d.title,
      subject: d.subjectId ? `Môn #${d.subjectId}` : "Flashcards",
      author: d.creatorName,
      isVerified: d.targetId % 2 === 0, // Mock verified logic
      rating: d.acceptPercentage ? (d.acceptPercentage / 20).toFixed(1) : "4.9",
      downloads: d.downloadCount,
    }));

    const staticItems = marketItems.filter(m => m.kind !== "doc" && m.kind !== "deck").map(m => ({
      ...m,
      isVerified: Math.random() > 0.5
    }));
    
    let merged = [...dynamicDocs, ...dynamicDecks, ...staticItems];

    if (tab !== "all") {
      merged = merged.filter(m => m.kind === tab);
    }
    if (q) {
      merged = merged.filter(m => m.title.toLowerCase().includes(q.toLowerCase()));
    }

    if (sortBy === "downloaded") {
      merged.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === "rated") {
      merged.sort((a, b) => parseFloat(String(b.rating)) - parseFloat(String(a.rating)));
    } else if (sortBy === "trending") {
      // Fake trending: High downloads + High rating
      merged.sort((a, b) => (b.downloads * parseFloat(String(b.rating))) - (a.downloads * parseFloat(String(a.rating))));
    }
    
    return merged;
  }, [tab, q, sortBy, communityDocs, communityDecks]);

  const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));
  const paginatedList = useMemo(() => {
    return list.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  }, [list, page, itemsPerPage]);

  useEffect(() => {
    setPage(1); // Reset page when filter/sort changes
  }, [tab, q, sortBy]);

  const handleClone = async (realId: number, kind: string) => {
    try {
      if (kind === "doc") {
        const res = await documentService.cloneMarketplaceDocument(realId);
        if (res.success) Notify.success("Clone tài liệu thành công vào Workspace của bạn!");
      } else if (kind === "deck") {
        const res = await flashcardService.cloneMarketplaceDeck(realId);
        if (res.success) Notify.success("Clone bộ Flashcard thành công!");
      } else {
        Notify.success("Tính năng đang phát triển cho loại này");
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi khi clone");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card gradient-hero p-6 lg:p-8"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Users size={12} /> Marketplace
        </div>
        <h1 className="mt-3 text-3xl font-bold">Học cùng cộng đồng</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Khám phá tài liệu, quiz và flashcard chất lượng được sinh viên khắp nơi đóng góp và duyệt.
        </p>
      </motion.div>

      <div className="surface-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm tài liệu, quiz, flashcard..."
            className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm transition-all"
          />
        </div>
        <div className="flex gap-2 items-center w-full md:w-auto overflow-x-auto scrollbar-hidden pb-1 md:pb-0">
          <div className="relative shrink-0 mr-2 border-r border-border pr-3 flex items-center">
             <select 
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value as any)}
               className="appearance-none bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer pl-7 pr-6 py-2 rounded-lg hover:bg-muted transition-colors"
             >
               <option value="newest">Mới nhất</option>
               <option value="downloaded">Tải nhiều nhất</option>
               <option value="rated">Đánh giá cao</option>
               <option value="trending">Thịnh hành 🔥</option>
             </select>
             <SlidersHorizontal size={14} className="absolute left-2 text-muted-foreground pointer-events-none" />
          </div>

          {(["all", "doc", "quiz", "deck", "leaderboard"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 h-9 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${tab === t ? "bg-ink text-cream" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
            >
              {t === "all" ? "Tất cả" : t === "leaderboard" ? "Xếp hạng" : kindStyle[t as any].label}
            </button>
          ))}
        </div>
      </div>

      {tab === "leaderboard" ? (
        <div className="surface-card p-6 lg:p-8 rounded-2xl border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-12 rounded-xl bg-warning/10 text-warning grid place-items-center">
              <Trophy size={24} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Top Đóng góp</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Vinh danh những thành viên xuất sắc nhất cộng đồng</p>
            </div>
          </div>

          {loadingLeaderboard ? (
            <div className="py-12 flex justify-center"><div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="space-y-3">
              {contributors.map((c, i) => (
                <motion.div
                  key={c.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 border border-border/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-12 rounded-2xl flex items-center justify-center font-display font-bold text-lg ${c.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]' :
                        c.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-[0_0_15px_rgba(148,163,184,0.3)]' :
                          c.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'bg-muted/50 text-muted-foreground'
                      }`}>
                      {c.rank <= 3 ? <Medal size={22} className={c.rank === 1 ? "drop-shadow-sm" : ""} /> : c.rank}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{c.fullName}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{c.approvedContents} tài liệu đã được duyệt</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-black text-primary text-lg">{c.reputationPoints.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-semibold">Điểm uy tín</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card p-5 flex flex-col h-[220px] rounded-3xl border border-border/30 overflow-hidden relative">
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  
                  <div className="flex justify-between mb-3 relative z-10">
                    <div className="size-11 rounded-2xl bg-muted animate-pulse" />
                    <div className="w-16 h-5 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-6 bg-muted rounded-md w-3/4 mb-2 animate-pulse" />
                  <div className="h-4 bg-muted rounded-md w-1/2 mb-auto animate-pulse" />
                  <div className="mt-4 pt-4 border-t border-border flex justify-between relative z-10">
                    <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                    <div className="h-9 bg-muted rounded-xl w-20 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedList.length === 0 ? (
            <div className="surface-card py-20 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-lg font-bold mb-1">Không tìm thấy kết quả nào</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">😢 Có vẻ như không có tài liệu nào phù hợp với bộ lọc và từ khóa của bạn. Hãy thử tìm kiếm khác nhé.</p>
              <button 
                onClick={() => { setQ(""); setTab("all"); setSortBy("newest"); }} 
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:brightness-110 transition-all active:scale-95"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedList.map((m, i) => {
                const k = kindStyle[m.kind];
                const Icon = k.icon;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 30 }}
                    whileHover={{ y: -4, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.96 }}
                    className="bg-card p-5 flex flex-col cursor-pointer group relative overflow-hidden rounded-3xl border border-border/50 hover:border-primary/30 transition-colors shadow-sm"
                    onClick={() => {
                      if ((m as any).realId) {
                        setSelectedItem({
                          id: (m as any).realId,
                          type: m.kind === "doc" ? "DOCUMENT" : m.kind === "deck" ? "FLASHCARD_DECK" : "QUIZ",
                          title: m.title
                        });
                      }
                    }}
                  >
                    <button 
                      className="absolute top-4 right-4 text-muted-foreground hover:text-rose-500 z-10 transition-colors bg-background/50 backdrop-blur p-1.5 rounded-full"
                      onClick={(e) => { e.stopPropagation(); Notify.success("Đã lưu vào bộ sưu tập!"); }}
                      title="Save / Bookmark"
                    >
                      <Bookmark size={16} />
                    </button>
                    
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="size-11 rounded-2xl grid place-items-center"
                        style={{ background: `oklch(0.55 0.14 ${k.color} / 0.15)`, color: `oklch(0.45 0.14 ${k.color})` }}
                      >
                        <Icon size={18} />
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium mr-8">{m.subject}</span>
                    </div>
                    
                    <h3 className="font-display font-semibold leading-snug flex-1 line-clamp-2">{m.title}</h3>
                    
                    <div className="mt-3 flex items-center gap-2.5 text-xs text-muted-foreground">
                      <div className="size-6 rounded-full bg-ink text-cream grid place-items-center text-[10px] font-semibold shrink-0">
                        {m.author.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <span className="truncate">{m.author}</span>
                      {(m as any).isVerified && (
                         <span title="Verified Contributor"><CheckCircle2 size={14} className="text-blue-500 shrink-0" /></span>
                      )}
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 text-warning-foreground font-semibold">
                          <Star size={12} className="fill-warning text-warning" /> {m.rating}
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Download size={12} /> {m.downloads.toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          (m as any).realId ? handleClone((m as any).realId, m.kind) : Notify.success("Tính năng đang phát triển cho loại này");
                        }}
                        className="px-4 h-9 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-bold cursor-pointer transition-colors active:scale-95"
                      >
                        Clone
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!isLoading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="size-9 rounded-xl flex items-center justify-center border border-border/50 bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                     if (page > 3 && page < totalPages - 1) {
                       pageNum = page - 2 + i;
                     } else if (page >= totalPages - 1) {
                       pageNum = totalPages - 4 + i;
                     }
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`size-9 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                        page === pageNum ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="size-9 rounded-xl flex items-center justify-center border border-border/50 bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {selectedItem && (
        <CommunityItemModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          targetId={selectedItem.id}
          targetType={selectedItem.type}
          title={selectedItem.title}
        />
      )}
    </div>
  );
}
