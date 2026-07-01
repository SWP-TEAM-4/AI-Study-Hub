import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Star, Download, Search, FileText, GraduationCap, BookOpen,
  Bookmark, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle, Eye, Share2, Award, UserPlus, UserMinus, FilterX, X, Flame, Sparkles, TrendingUp, Wand2
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { marketItems } from "../lib/mock-data";
import { communityService, ContributorDTO } from "../services/communityService";
import CommunityDetailPage, { CommunityDetailItem } from "./CommunityDetailPage";
import CustomSelect from "../components/ui/CustomSelect";
import { Notify, Loading } from "notiflix";
import { 
  useCommunityItems, 
  useCloneItem 
} from "../hooks/useCommunity";
import { motionFadeUp } from "../lib/motion";
import { useInView } from "react-intersection-observer";

// 🎨 SEMANTIC ICON + COLOR MAPPING
const kindStyle: Record<string, {
  icon: typeof FileText;
  bgColor: string;
  iconColor: string;
  label: string;
  badge: string;
}> = {
  doc: {
    icon: FileText,
    bgColor: "oklch(0.85 0.08 50)",
    iconColor: "oklch(0.50 0.15 50)",
    label: "Tài liệu",
    badge: "Docs",
  },
  quiz: {
    icon: GraduationCap,
    bgColor: "oklch(0.85 0.09 90)",
    iconColor: "oklch(0.50 0.16 90)",
    label: "Quiz",
    badge: "Quiz",
  },
  deck: {
    icon: BookOpen,
    bgColor: "oklch(0.80 0.10 240)",
    iconColor: "oklch(0.45 0.15 240)",
    label: "Flashcards",
    badge: "Decks",
  },
};

export default function CommunityPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    semester: "all",
    subject: "all",
    difficulty: "all",
    verified: false,
    sort: "newest",
    savedOnly: false
  });
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Custom Hooks to query Community items
  const { data: communityDocsResult, isLoading: loadingDocs } = useCommunityItems("documents", { search: filters.search });
  const { data: communityDecksResult, isLoading: loadingDecks } = useCommunityItems("flashcards", { search: filters.search });

  const communityDocs = communityDocsResult?.data?.items || [];
  const communityDecks = communityDecksResult?.data?.items || [];
  const isLoading = loadingDocs || loadingDecks;

  const [contributors, setContributors] = useState<ContributorDTO[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CommunityDetailItem | null>(null);
  
  // State quản lý danh sách Yêu thích & Theo dõi
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<number[]>([]);

  useEffect(() => {
    if (filters.category === "leaderboard" && contributors.length === 0) {
      setLoadingLeaderboard(true);
      communityService.getLeaderboardContributors().then((res) => {
        if (res.success) setContributors(res.data.items);
        setLoadingLeaderboard(false);
      });
    }
  }, [filters.category]);

  const list = useMemo(() => {
    const dynamicDocs = (communityDocs || []).map((d: any) => ({
      id: "doc_" + (d.targetId || d.id),
      realId: (d.targetId || d.id),
      kind: "doc",
      title: d.title,
      subject: d.subjectId ? `Môn #${d.subjectId}` : "Tài liệu chung",
      author: d.creatorName || `User ${d.userId || d.targetId}`,
      userId: d.userId || (d.targetId ? d.targetId + 200 : 0),
      isVerified: (d.userId || d.targetId || 0) % 3 === 0,
      rating: d.acceptPercentage ? (d.acceptPercentage / 20).toFixed(1) : "4.8",
      downloads: d.downloadCount,
    }));
    const dynamicDecks = (communityDecks || []).map((d: any) => ({
      id: "deck_" + d.targetId,
      realId: d.targetId,
      kind: "deck",
      title: d.title,
      subject: d.subjectId ? `Môn #${d.subjectId}` : "Flashcards",
      author: d.creatorName,
      userId: d.targetId + 100, // Mock userId cho deck
      isVerified: d.targetId % 2 === 0,
      rating: d.acceptPercentage ? (d.acceptPercentage / 20).toFixed(1) : "4.9",
      downloads: d.downloadCount,
    }));

    const staticItems = marketItems
      .filter((m) => m.kind !== "doc" && m.kind !== "deck")
      .map((m) => ({ ...m, realId: m.id, userId: Number(m.id) + 200, isVerified: Number(m.id) % 2 === 0 }));

    const mockSubjects = ["SWP391", "PRN212", "MAD101", "PRO192", "DBI202"];

    let merged = [...dynamicDocs, ...dynamicDecks, ...staticItems].map((m) => {
      // Mock Semester and Subject if they are generic strings
      let sem = (m as any).semester;
      let subj = m.subject;
      if (!sem) {
        sem = `S${(Number(m.realId) % 9) + 1}`;
      }
      if (subj.includes("Tài liệu") || subj.includes("Môn") || subj.includes("Flashcards")) {
        subj = mockSubjects[Number(m.realId) % 5];
      }
      return { ...m, semester: sem, subject: subj };
    });

    if (filters.savedOnly) {
      merged = merged.filter((m) => savedIds.includes(String(m.id)));
    } 
    
    if (filters.category !== "all" && filters.category !== "leaderboard") {
      merged = merged.filter((m) => m.kind === filters.category);
    }

    if (filters.semester !== "all") {
      merged = merged.filter(m => m.semester === filters.semester);
    }

    if (filters.subject !== "all") {
      merged = merged.filter(m => m.subject.includes(filters.subject));
    }

    if (filters.verified) {
      merged = merged.filter(m => m.isVerified);
    }

    if (filters.search) {
      merged = merged.filter(
        (m) =>
          m.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          m.subject.toLowerCase().includes(filters.search.toLowerCase()),
      );
    }

    // Sắp xếp
    if (filters.sort === "downloaded") {
      merged.sort((a, b) => b.downloads - a.downloads);
    } else if (filters.sort === "rated") {
      merged.sort((a, b) => parseFloat(String(b.rating)) - parseFloat(String(a.rating)));
    } else if (filters.sort === "trending") {
      merged.sort(
        (a, b) =>
          b.downloads * parseFloat(String(b.rating)) -
          a.downloads * parseFloat(String(a.rating)),
      );
    } else if (filters.sort === "ai_picks") {
      merged.sort((a, b) => {
        const scoreA = (a.isVerified ? 5 : 0) + parseFloat(String(a.rating)) + (Number(a.realId) % 5);
        const scoreB = (b.isVerified ? 5 : 0) + parseFloat(String(b.rating)) + (Number(b.realId) % 5);
        return scoreB - scoreA;
      });
    }

    return merged;
  }, [filters, communityDocs, communityDecks, savedIds]);

  const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));
  const paginatedList = useMemo(
    () => list.slice(0, page * itemsPerPage),
    [list, page, itemsPerPage],
  );

  const { ref, inView } = useInView({
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView && page < totalPages) {
      setPage(p => p + 1);
    }
  }, [inView, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const toggleBookmark = (id: string) => {
    setSavedIds((prev) => {
      const isSaved = prev.includes(id);
      if (isSaved) {
        Notify.success("Đã xóa khỏi bộ sưu tập yêu thích");
        return prev.filter((item) => item !== id);
      } else {
        Notify.success("Đã lưu vào bộ sưu tập yêu thích thành công!");
        return [...prev, id];
      }
    });
  };

  const toggleFollowContributor = (userId: number, name: string) => {
    setFollowedUsers((prev) => {
      const isFollowing = prev.includes(userId);
      if (isFollowing) {
        Notify.success(`Đã hủy theo dõi ${name}`);
        return prev.filter((id) => id !== userId);
      } else {
        Notify.success(`Đã theo dõi ${name}. Bạn sẽ nhận được thông báo khi có tài liệu mới!`);
        return [...prev, userId];
      }
    });
  };

  const cloneMutation = useCloneItem();

  const handleClone = async (realId: number, kind: string) => {
    cloneMutation.mutate({
      type: kind === "doc" ? "documents" : "flashcards",
      id: realId
    });
  };

  const handleDirectDownload = (title: string) => {
    Loading.circle("Đang nén dữ liệu để tải xuống...");
    setTimeout(() => {
      Loading.remove();
      Notify.success(`Đã tải xuống thành công file: ${title}`);
    }, 1200);
  };

  const getBadgeIcon = (index: number) => {
    if (index === 0) return { label: "Gold", color: "text-amber-500 bg-amber-500/10" };
    if (index === 1) return { label: "Silver", color: "text-slate-400 bg-slate-400/10" };
    if (index === 2) return { label: "Bronze", color: "text-amber-700 bg-amber-700/10" };
    return { label: "Expert", color: "text-primary bg-primary/10" };
  };

  // Show detail page if item selected
  if (selectedItem) {
    return <CommunityDetailPage item={selectedItem} onBack={() => setSelectedItem(null)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users style={{ color: "var(--color-coral)" }} /> {t('pages.community.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('pages.community.desc')}
          </p>
        </div>
      </div>

      {/* STATS HEADER */}
      {filters.category !== "leaderboard" && (
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground bg-muted/20 px-4 py-2.5 rounded-xl border border-border/30 w-max max-w-full">
          <span className="text-foreground font-bold">{list.length} Resources</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{list.filter(x => x.kind === 'doc').length} Documents</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{list.filter(x => x.kind === 'quiz').length} Quizzes</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{list.filter(x => x.kind === 'deck').length} Flashcards</span>
        </div>
      )}

      {/* SEARCH + FILTER BAR */}
      <div className="surface-card p-3 rounded-2xl flex flex-col gap-3 relative z-30">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative flex items-center w-full">
            <Search className="absolute left-4 text-muted-foreground" size={16} />
            <input
              value={filters.search}
              onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
              placeholder={t('pages.community.search')}
              autoComplete="off"
              spellCheck="false"
              className="w-full pl-10 pr-4 h-11 bg-muted/50 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-sm rounded-xl"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <CustomSelect
              value={filters.category}
              onChange={(v) => setFilters(p => ({ ...p, category: v as any }))}
              className="flex-1 md:flex-none min-w-[140px]"
              data={[
                { label: "All Categories", value: "all" },
                { label: "Tài liệu", value: "doc" },
                { label: "Quiz", value: "quiz" },
                { label: "Flashcards", value: "deck" },
                { label: "Leaderboard", value: "leaderboard" }
              ]}
            />
            {filters.category !== "leaderboard" && (
              <>
                <CustomSelect
                  value={filters.semester}
                  onChange={(v) => setFilters(p => ({ ...p, semester: v as any }))}
                  className="flex-1 md:flex-none min-w-[130px]"
                  data={[
                    { label: t("filters.allSemesters"), value: "all" },
                    { label: t("filters.semester1"), value: "S1" },
                    { label: t("filters.semester2"), value: "S2" },
                    { label: t("filters.semester3"), value: "S3" },
                    { label: t("filters.semester4"), value: "S4" },
                    { label: t("filters.semester5"), value: "S5" },
                    { label: t("filters.semester6"), value: "S6" },
                    { label: t("filters.semester7"), value: "S7" },
                    { label: t("filters.semester8"), value: "S8" },
                    { label: t("filters.semester9"), value: "S9" },
                  ]}
                />
                <CustomSelect
                  value={filters.subject}
                  onChange={(v) => setFilters(p => ({ ...p, subject: v as any }))}
                  className="flex-1 md:flex-none min-w-[140px]"
                  data={[
                    { label: "All Subjects", value: "all" },
                    { label: "SWP391", value: "SWP391" },
                    { label: "PRN212", value: "PRN212" },
                    { label: "MAD101", value: "MAD101" },
                    { label: "PRO192", value: "PRO192" },
                    { label: "DBI202", value: "DBI202" },
                  ]}
                />
                <CustomSelect
                  value={filters.sort}
                  onChange={(v) => setFilters(p => ({ ...p, sort: v as any }))}
                  className="flex-1 md:flex-none min-w-[140px]"
                  data={[
                    { label: "Mới nhất", value: "newest" },
                    { label: "Tải nhiều", value: "downloaded" },
                    { label: "Đánh giá cao", value: "rated" },
                  ]}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* CHIPS FILTER (UNDER SEARCH) */}
      {filters.category !== "leaderboard" && (
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setFilters(p => ({ ...p, sort: p.sort === "trending" ? "newest" : "trending" }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filters.sort === "trending" ? "bg-rose-500/15 text-rose-400 border-rose-500/30" : "bg-card border-border hover:bg-muted"}`}
          >
            <TrendingUp size={13} /> Trending
          </button>
          
          <button 
            onClick={() => setFilters(p => ({ ...p, sort: p.sort === "ai_picks" ? "newest" : "ai_picks" }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filters.sort === "ai_picks" ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" : "bg-card border-border hover:bg-muted"}`}
          >
            <Wand2 size={13} /> AI Picks
          </button>

          <button 
            onClick={() => setFilters(p => ({ ...p, sort: p.sort === "rated" ? "newest" : "rated" }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filters.sort === "rated" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-card border-border hover:bg-muted"}`}
          >
            <Star size={13} className={filters.sort === "rated" ? "fill-current" : ""} /> Rated
          </button>

          <button 
            onClick={() => setFilters(p => ({ ...p, verified: !p.verified }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filters.verified ? "bg-blue-500/15 text-blue-400 border-blue-500/30" : "bg-card border-border hover:bg-muted"}`}
          >
            <CheckCircle2 size={13} /> Verified Only
          </button>

          <button 
            onClick={() => setFilters(p => ({ ...p, savedOnly: !p.savedOnly }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filters.savedOnly ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-card border-border hover:bg-muted"}`}
          >
            <Bookmark size={13} className={filters.savedOnly ? "fill-current" : ""} /> Saved
          </button>
        </div>
      )}

      {/* ACTIVE TAGS */}
      {filters.category !== "leaderboard" && (filters.semester !== "all" || filters.subject !== "all") && (
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <span className="text-xs text-muted-foreground mr-1">Active filters:</span>
          
          {filters.semester !== "all" && (
            <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-lg text-xs font-medium">
              {filters.semester}
              <button onClick={() => setFilters(p => ({ ...p, semester: "all" }))} className="hover:text-destructive"><X size={12} /></button>
            </span>
          )}
          
          {filters.subject !== "all" && (
            <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-lg text-xs font-medium">
              {filters.subject}
              <button onClick={() => setFilters(p => ({ ...p, subject: "all" }))} className="hover:text-destructive"><X size={12} /></button>
            </span>
          )}
          
          <button 
            onClick={() => setFilters(p => ({ ...p, semester: "all", subject: "all", difficulty: "all", verified: false, savedOnly: false, sort: "newest" }))} 
            className="text-xs text-muted-foreground hover:text-foreground ml-2 transition-colors flex items-center gap-1"
          >
            <FilterX size={12} /> Clear all
          </button>
        </div>
      )}

      {/* RENDER CONTENT DYNAMICALLY */}
      <div className="min-h-[600px]">
        {filters.category === "leaderboard" ? (
        // ────── LEADERBOARD VIEW ──────
        loadingLeaderboard ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="surface-card p-5 h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="surface-card overflow-hidden border border-border/40 shadow-sm rounded-2xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground tracking-wider border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 text-center w-16">Hạng</th>
                  <th className="px-6 py-4">Contributor</th>
                  <th className="px-6 py-4 text-center">Danh hiệu</th>
                  <th className="px-6 py-4 text-center">Lượt tải tài liệu</th>
                  <th className="px-6 py-4 text-center">Đánh giá chung</th>
                  <th className="px-6 py-4 text-right">Tương tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {contributors.map((c, idx) => {
                  const badge = getBadgeIcon(idx);
                  const isFollowing = followedUsers.includes(c.userId || idx);
                  return (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 text-center font-display font-bold text-base">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {c.fullName?.[0] || "C"}
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-1.5">
                              {c.fullName || `Contributor #${idx + 1}`}
                              <CheckCircle2 size={14} className="text-blue-500" />
                            </div>
                            <div className="text-xs text-muted-foreground">ID: SE19{100 + idx}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${badge.color}`}>
                          <Award size={12} /> {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-foreground/90">{(idx * 150 + 245).toLocaleString()} tải</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                          <Star size={13} className="fill-current" /> {(4.9 - idx * 0.05).toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleFollowContributor(c.userId || idx, c.fullName || `Contributor #${idx + 1}`)}
                          className={`inline-flex items-center gap-1 px-3 h-8 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                            isFollowing
                              ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              : "bg-primary text-primary-foreground hover:opacity-90"
                          }`}
                        >
                          {isFollowing ? (
                            <>
                              <UserMinus size={12} /> Hủy theo dõi
                            </>
                          ) : (
                            <>
                              <UserPlus size={12} /> Theo dõi
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        // ────── COMMUNITY ITEMS GRID VIEW ──────
        isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="surface-card p-5 flex flex-col h-[260px] animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="size-12 rounded-xl bg-muted" />
                  <div className="w-14 h-5 bg-muted rounded" />
                </div>
                <div className="h-5 bg-muted rounded-md w-3/4 mb-3" />
                <div className="h-4 bg-muted rounded-md w-1/2 mb-auto" />
                <div className="mt-6 pt-4 border-t border-border flex justify-between">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-9 bg-muted rounded-lg w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="surface-card py-20 flex flex-col items-center justify-center text-center rounded-2xl">
            <div className="size-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-muted-foreground opacity-50" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">Không tìm thấy dữ liệu</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Thử điều chỉnh tìm kiếm hoặc bộ lọc để tìm nội dung phù hợp.
            </p>
            <button
              onClick={() => {
                setFilters({
                  search: "", category: "all", semester: "all", subject: "all", difficulty: "all", verified: false, sort: "newest", savedOnly: false
                });
              }}
              className="inline-flex items-center justify-center px-5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all active:scale-95"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedList.map((m, i) => {
              const k = kindStyle[m.kind] || kindStyle.doc;
              const Icon = k.icon;
              const isSaved = savedIds.includes(String(m.id));

              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="surface-card p-5 flex flex-col cursor-pointer group relative"
                  onClick={() => {
                    if ((m as any).realId) {
                      setSelectedItem({
                        id: (m as any).realId,
                        type: m.kind === "doc" ? "DOCUMENT" : m.kind === "deck" ? "FLASHCARD_DECK" : "QUIZ",
                        title: m.title,
                        author: m.author,
                        subject: m.subject,
                        semester: (m as any).semester,
                        rating: m.rating,
                        downloads: m.downloads,
                        isVerified: (m as any).isVerified,
                        kind: m.kind as "doc" | "quiz" | "deck",
                      });
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="size-12 rounded-xl flex items-center justify-center"
                      style={{ background: k.bgColor, color: k.iconColor }}
                    >
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-md bg-muted font-medium truncate max-w-[110px]">
                        {m.subject}
                      </span>
                      {/* Nút lưu yêu thích */}
                      <button
                        className={`size-8 rounded-full flex items-center justify-center border transition-all ${
                          isSaved 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
                            : 'bg-muted/40 text-muted-foreground border-border/40 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(String(m.id));
                        }}
                        title={isSaved ? "Bỏ yêu thích" : "Lưu vào bộ sưu tập"}
                      >
                        <Bookmark size={14} className={isSaved ? "fill-current" : ""} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-display text-base font-semibold leading-snug flex-1 line-clamp-2">
                    {m.title}
                  </h3>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <div className="size-6 rounded-full bg-gradient-to-br from-primary/60 to-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {m.author.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
                    </div>
                    <span className="truncate max-w-[90px] text-xs">{m.author}</span>
                    {(m as any).isVerified && (
                      <span title="Đã xác minh" className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full text-[10px] font-medium border border-blue-500/20">
                        <CheckCircle2 size={11} className="shrink-0" /> Verified
                      </span>
                    )}
                    {m.semester && (
                      <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded">
                        {m.semester}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                        <Star size={13} className="fill-current" /> {m.rating}
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Download size={13} /> {(m.downloads as any)?.toLocaleString?.() || m.downloads}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDirectDownload(m.title)}
                        className="size-8 rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground flex items-center justify-center transition-colors"
                        title="Tải xuống trực tiếp bản cứng"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        onClick={() => {
                          (m as any).realId
                            ? handleClone((m as any).realId, m.kind)
                            : Notify.success("Sắp ra mắt");
                        }}
                        className="px-3 h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-colors active:scale-95"
                      >
                        Clone
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}
      </div>

      {/* INFINITE SCROLL TRIGGER */}
      {filters.category !== "leaderboard" && !isLoading && page < totalPages && (
        <div ref={ref} className="mt-8 flex justify-center py-4">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Detail page is rendered above when selectedItem is set */}
    </motion.div>
  );
}
