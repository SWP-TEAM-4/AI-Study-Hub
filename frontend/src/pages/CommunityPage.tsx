import { motion } from "framer-motion";
import { Users, Star, Download, Search, FileText, GraduationCap, BookOpen, Filter, Trophy, Medal } from "lucide-react";
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
  const [contributors, setContributors] = useState<ContributorDTO[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [communityDocs, setCommunityDocs] = useState<DocumentDTO[]>([]);
  const [communityDecks, setCommunityDecks] = useState<MarketplaceFlashcardDeckDTO[]>([]);

  const [selectedItem, setSelectedItem] = useState<{ id: number; type: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK"; title: string } | null>(null);

  useEffect(() => {
    loadCommunityDocs();
    loadCommunityDecks();
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
    const dynamicDocs = communityDocs.map(d => ({
      id: "doc_" + d.id,
      realId: d.id,
      kind: "doc",
      title: d.title,
      subject: d.subjectId ? `Môn #${d.subjectId}` : "Tài liệu chung",
      author: `User ${d.userId}`,
      rating: d.acceptPercentage ? (d.acceptPercentage / 20).toFixed(1) : "4.8",
      downloads: d.downloadCount,
    }));
    const dynamicDecks = communityDecks.map(d => ({
      id: "deck_" + d.targetId,
      realId: d.targetId,
      kind: "deck",
      title: d.title,
      subject: d.subjectId ? `Môn #${d.subjectId}` : "Flashcards",
      author: d.creatorName,
      rating: d.acceptPercentage ? (d.acceptPercentage / 20).toFixed(1) : "4.9",
      downloads: d.downloadCount,
    }));

    const staticItems = marketItems.filter(m => m.kind !== "doc" && m.kind !== "deck");
    const merged = [...dynamicDocs, ...dynamicDecks, ...staticItems];

    return merged.filter(
      (m) => (tab === "all" || m.kind === tab) && m.title.toLowerCase().includes(q.toLowerCase()),
    );
  }, [tab, q, communityDocs, communityDecks]);

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

      <div className="surface-card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo môn, từ khóa..."
            className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
          <Filter size={14} className="text-muted-foreground self-center shrink-0" />
          {(["all", "doc", "quiz", "deck", "leaderboard"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 h-9 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${tab === t ? "bg-ink text-cream" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
            >
              {t === "all" ? "Tất cả" : t === "leaderboard" ? "Bảng xếp hạng" : kindStyle[t as any].label}
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((m, i) => {
            const k = kindStyle[m.kind];
            const Icon = k.icon;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className="surface-card p-5 flex flex-col cursor-pointer"
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
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="size-11 rounded-2xl grid place-items-center"
                    style={{ background: `oklch(0.55 0.14 ${k.color} / 0.15)`, color: `oklch(0.45 0.14 ${k.color})` }}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">{m.subject}</span>
                </div>
                <h3 className="font-display font-semibold leading-snug flex-1">{m.title}</h3>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="size-6 rounded-full bg-ink text-cream grid place-items-center text-[10px] font-semibold">
                    {m.author
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <span>{m.author}</span>
                </div>
                <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-warning-foreground">
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
                    className="px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                  >
                    Clone
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
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
