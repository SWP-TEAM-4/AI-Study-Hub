import { motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Flame,
  GraduationCap,
  Search,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Loading, Notify } from "notiflix";
import CustomSelect from "../components/ui/CustomSelect";
import { academicService, type SubjectDTO, type SemesterDTO } from "../services/academicService";
import {
  communityMarketplaceService,
  type CloneResultDTO,
  type CommunityCategory,
  type CommunitySort,
  type MarketplaceItemDTO,
  type ContributorDTO,
} from "../services/communityMarketplaceService";
import CommunityDetailPage from "./CommunityDetailPage";

type CategoryFilter = CommunityCategory | "leaderboard";

interface Filters {
  search: string;
  category: CategoryFilter;
  subjectId: string;
  academicTermId: string;
  sort: CommunitySort;
}

const CATEGORY_OPTIONS = [
  { label: "Tất cả", value: "all" },
  { label: "Tài liệu", value: "documents" },
  { label: "Quiz", value: "quizzes" },
  { label: "Flashcards", value: "flashcards" },
  { label: "Leaderboard", value: "leaderboard" },
];

const SORT_OPTIONS = [
  { label: "Mới nhất", value: "newest" },
  { label: "Clone nhiều", value: "downloadCount" },
  { label: "Đánh giá cao", value: "acceptPercentage" },
];

const typeStyle = {
  DOCUMENT: {
    icon: FileText,
    label: "Tài liệu",
    tone: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    gradient: "from-amber-400/40 via-yellow-300/30 to-orange-200/20",
    color: "text-amber-600",
  },
  QUIZ: {
    icon: GraduationCap,
    label: "Quiz",
    tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    gradient: "from-emerald-400/40 via-teal-300/30 to-green-200/20",
    color: "text-emerald-600",
  },
  FLASHCARD_DECK: {
    icon: BookOpen,
    label: "Flashcards",
    tone: "bg-sky-500/10 text-sky-600 border-sky-500/20",
    gradient: "from-sky-400/40 via-blue-300/30 to-indigo-200/20",
    color: "text-sky-600",
  },
};


function itemKey(item: MarketplaceItemDTO) {
  return `${item.targetType}:${item.targetId}`;
}

function ratingFromAcceptPercentage(value?: number | string | null) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.min(5, numeric / 20);
}

function formatNumber(value?: number | null) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

function asMarketplaceCategory(category: CategoryFilter): CommunityCategory {
  return category === "leaderboard" ? "all" : category;
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="surface-card flex flex-col items-center justify-center rounded-2xl py-20 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/40">
        <AlertCircle size={32} className="text-muted-foreground opacity-50" />
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold">Không tìm thấy nội dung</h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">Thử đổi từ khóa, môn học hoặc loại tài nguyên.</p>
      <button
        onClick={onReset}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-95"
      >
        Đặt lại bộ lọc
      </button>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function ItemCard({
  item,
  subjectLabel,
  cloneResult,
  onOpen,
  onClone,
}: {
  item: MarketplaceItemDTO;
  subjectLabel: string;
  cloneResult?: CloneResultDTO;
  onOpen: () => void;
  onClone: () => void;
}) {
  const style = typeStyle[item.targetType] ?? typeStyle.DOCUMENT;
  const Icon = style.icon;
  const rating = ratingFromAcceptPercentage(item.acceptPercentage);
  const displayRating = (item.reviewCount != null && item.reviewCount > 0) ? rating.toFixed(1) : "N/A";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card group flex min-h-[260px] cursor-pointer flex-col rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md overflow-hidden ring-1 ring-border/50"
      onClick={onOpen}
    >
      <div className={`h-24 w-full bg-gradient-to-br ${style.gradient} flex items-center p-4 relative`}>
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[1px]" />
        
        <div className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm border ${style.tone}`}>
          <Icon size={22} strokeWidth={1.8} className={style.color} />
        </div>
        
        <div className="relative z-10 ml-auto flex flex-col items-end gap-2">
          <span className={`rounded-full bg-background/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm border ${style.tone}`}>
            {style.label}
          </span>
          {cloneResult && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              <CheckCircle2 size={11} /> Đã Clone
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5 pt-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="max-w-[145px] truncate rounded-lg bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {subjectLabel}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground/60">Source #{item.targetId}</span>
        </div>
        <h3 className="line-clamp-2 flex-1 font-display text-base font-semibold leading-snug">{item.title}</h3>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
          {(item.creatorName || "U").slice(0, 2).toUpperCase()}
        </div>
        <span className="truncate">{item.creatorName || "Ẩn danh"}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
            <Star size={13} className={(item.reviewCount != null && item.reviewCount > 0) ? "fill-current" : ""} /> {displayRating}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Download size={13} /> {formatNumber(item.downloadCount)}
          </span>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onClone();
          }}
          className="h-8 rounded-xl bg-primary/10 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
        >
          Clone
        </button>
      </div>
      </div>
    </motion.article>
  );
}

function ItemGrid({
  items,
  subjectMap,
  clonedItems,
  onOpen,
  onClone,
}: {
  items: MarketplaceItemDTO[];
  subjectMap: Map<number, string>;
  clonedItems: Record<string, CloneResultDTO>;
  onOpen: (item: MarketplaceItemDTO) => void;
  onClone: (item: MarketplaceItemDTO) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <ItemCard
          key={itemKey(item)}
          item={item}
          subjectLabel={item.subjectId ? subjectMap.get(item.subjectId) ?? `Môn #${item.subjectId}` : "Chưa gắn môn"}
          cloneResult={clonedItems[itemKey(item)]}
          onOpen={() => onOpen(item)}
          onClone={() => onClone(item)}
        />
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "all",
    subjectId: "all",
    academicTermId: "all",
    sort: "newest",
  });
  const [items, setItems] = useState<MarketplaceItemDTO[]>([]);
  const [trendingItems, setTrendingItems] = useState<MarketplaceItemDTO[]>([]);
  const [topRatedItems, setTopRatedItems] = useState<MarketplaceItemDTO[]>([]);
  const [latestDocuments, setLatestDocuments] = useState<MarketplaceItemDTO[]>([]);
  const [latestQuizzes, setLatestQuizzes] = useState<MarketplaceItemDTO[]>([]);
  const [latestFlashcards, setLatestFlashcards] = useState<MarketplaceItemDTO[]>([]);
  const [contributors, setContributors] = useState<ContributorDTO[]>([]);
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [semesters, setSemesters] = useState<SemesterDTO[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItemDTO | null>(null);
  const [clonedItems, setClonedItems] = useState<Record<string, CloneResultDTO>>({});
  const [loading, setLoading] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const subjectMap = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, `${subject.code} · ${subject.name}`])),
    [subjects],
  );

  const categoryCounts = useMemo(() => {
    return {
      all: items.length,
      documents: items.filter((item) => item.targetType === "DOCUMENT").length,
      quizzes: items.filter((item) => item.targetType === "QUIZ").length,
      flashcards: items.filter((item) => item.targetType === "FLASHCARD_DECK").length,
    };
  }, [items]);

  useEffect(() => {
    let mounted = true;

    async function loadMasterData() {
      try {
        const [subjectsRes, semestersRes] = await Promise.all([
          academicService.getSubjects(),
          academicService.getSemesters(),
        ]);
        if (!mounted) return;
        setSubjects(subjectsRes.data ?? []);
        setSemesters(semestersRes.data ?? []);
      } catch (err: any) {
        Notify.failure(err?.message || "Không tải được dữ liệu môn học/học kỳ.");
      }
    }

    loadMasterData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (filters.category === "leaderboard") return;

    let mounted = true;
    async function loadMarketplace() {
      setLoading(true);
      try {
        const subjectId = filters.subjectId !== "all" ? Number(filters.subjectId) : undefined;
        const academicTermId = filters.academicTermId !== "all" ? Number(filters.academicTermId) : undefined;
        const category = asMarketplaceCategory(filters.category);

        const [mainRes, trendingRes, topRatedRes, docRes, quizRes, flashRes] = await Promise.all([
          communityMarketplaceService.browse({
            category,
            page: 0,
            size: 72,
            keyword: filters.search,
            sort: filters.sort,
            subjectId,
            academicTermId,
          }),
          communityMarketplaceService.browse({ category: "all", page: 0, size: 8, keyword: filters.search, sort: "downloadCount", subjectId }),
          communityMarketplaceService.browse({ category: "all", page: 0, size: 8, keyword: filters.search, sort: "acceptPercentage", subjectId }),
          communityMarketplaceService.browse({ category: "documents", page: 0, size: 4, keyword: filters.search, sort: "newest", subjectId }),
          communityMarketplaceService.browse({ category: "quizzes", page: 0, size: 4, keyword: filters.search, sort: "newest", subjectId, academicTermId }),
          communityMarketplaceService.browse({ category: "flashcards", page: 0, size: 4, keyword: filters.search, sort: "newest", subjectId }),
        ]);

        if (!mounted) return;
        setItems(mainRes.data.items ?? []);
        setTrendingItems(trendingRes.data.items ?? []);
        setTopRatedItems(topRatedRes.data.items ?? []);
        setLatestDocuments(docRes.data.items ?? []);
        setLatestQuizzes(quizRes.data.items ?? []);
        setLatestFlashcards(flashRes.data.items ?? []);
      } catch (err: any) {
        if (mounted) {
          setItems([]);
          Notify.failure(err?.message || "Không tải được marketplace.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMarketplace();
    return () => {
      mounted = false;
    };
  }, [filters]);

  useEffect(() => {
    if (filters.category !== "leaderboard") return;

    let mounted = true;
    async function loadLeaderboard() {
      setLoadingLeaderboard(true);
      try {
        const response = await communityMarketplaceService.getLeaderboard(0, 20);
        if (mounted) setContributors(response.data.items ?? []);
      } catch (err: any) {
        Notify.failure(err?.message || "Không tải được leaderboard.");
      } finally {
        if (mounted) setLoadingLeaderboard(false);
      }
    }

    loadLeaderboard();
    return () => {
      mounted = false;
    };
  }, [filters.category]);

  const resetFilters = () => {
    setFilters({
      search: "",
      category: "all",
      subjectId: "all",
      academicTermId: "all",
      sort: "newest",
    });
  };

  const cloneItem = async (item: MarketplaceItemDTO) => {
    Loading.circle("Đang clone nội dung về workspace...");
    try {
      const response = await communityMarketplaceService.clone(item.targetType, item.targetId);
      const cloneResult = {
        ...response.data,
        targetType: item.targetType,
      };
      setClonedItems((current) => ({ ...current, [itemKey(item)]: cloneResult }));
      Notify.success(
        `Đã clone ${typeStyle[item.targetType].label}: bản sao #${cloneResult.id}, nguồn #${cloneResult.clonedFromId ?? item.targetId}.`,
      );
    } catch (err: any) {
      const errCode = err?.response?.data?.code || err?.code || "";
      if (errCode === "DUPLICATE_CLONE" || err?.response?.status === 409) {
        Notify.warning("⚠️ Bạn đã clone tài nguyên này rồi! Không thể clone lại.");
      } else {
        Notify.failure(err?.message || "Clone thất bại.");
      }
    } finally {
      Loading.remove();
    }
  };

  const renderGrid = (sectionItems: MarketplaceItemDTO[]) => (
    <ItemGrid
      items={sectionItems}
      subjectMap={subjectMap}
      clonedItems={clonedItems}
      onOpen={setSelectedItem}
      onClone={cloneItem}
    />
  );

  // Show detail page if item selected
  if (selectedItem) {
    const detailItem = {
      id: selectedItem.targetId,
      type: selectedItem.targetType,
      title: selectedItem.title,
      author: selectedItem.creatorName || "Ẩn danh",
      subject: selectedItem.subjectId ? (subjectMap.get(selectedItem.subjectId) || `Môn #${selectedItem.subjectId}`) : "Chưa gắn môn",
      downloads: selectedItem.downloadCount || 0,
      rating: (selectedItem.reviewCount != null && selectedItem.reviewCount > 0) ? ratingFromAcceptPercentage(selectedItem.acceptPercentage) : "N/A",
      reviewCount: selectedItem.reviewCount || 0,
      acceptPercentage: selectedItem.acceptPercentage || 0,
      kind: (selectedItem.targetType === "DOCUMENT" ? "doc" : selectedItem.targetType === "QUIZ" ? "quiz" : "deck") as "doc" | "quiz" | "deck",
      isVerified: true,
    };
    return <CommunityDetailPage item={detailItem} onBack={() => setSelectedItem(null)} onClone={() => cloneItem(selectedItem)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Users style={{ color: "var(--color-coral)" }} /> {t("pages.community.title", "Cộng đồng học tập")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("pages.community.desc", "Khám phá tài liệu, quiz và flashcard đã được duyệt trên marketplace.")}
          </p>
        </div>
      </div>

      <div className="surface-card relative z-30 flex flex-col gap-3 rounded-2xl p-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex w-full flex-1 items-center">
            <Search className="absolute left-4 text-muted-foreground" size={16} />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder={t("pages.community.search", "Tìm trong cộng đồng...")}
              autoComplete="off"
              spellCheck="false"
              className="h-11 w-full rounded-xl border border-transparent bg-muted/50 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:bg-card"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:w-auto">
            <CustomSelect
              value={filters.category}
              onChange={(value) => setFilters((current) => ({ ...current, category: value as CategoryFilter }))}
              className="min-w-[150px]"
              data={CATEGORY_OPTIONS}
            />
            {filters.category !== "leaderboard" && (
              <>
                <CustomSelect
                  value={filters.subjectId}
                  onChange={(value) => setFilters((current) => ({ ...current, subjectId: value }))}
                  className="min-w-[190px]"
                  data={[
                    { label: "Tất cả môn", value: "all" },
                    ...subjects.map((subject) => ({ label: `${subject.code} · ${subject.name}`, value: String(subject.id) })),
                  ]}
                />
                <CustomSelect
                  value={filters.academicTermId}
                  onChange={(value) => setFilters((current) => ({ ...current, academicTermId: value }))}
                  className="min-w-[160px]"
                  data={[
                    { label: "Tất cả học kỳ", value: "all" },
                    ...semesters.map((semester) => ({ label: `${semester.code} · ${semester.name}`, value: String(semester.id) })),
                  ]}
                />
                <CustomSelect
                  value={filters.sort}
                  onChange={(value) => setFilters((current) => ({ ...current, sort: value as CommunitySort }))}
                  className="min-w-[150px]"
                  data={SORT_OPTIONS}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {filters.category !== "leaderboard" && (
        <div className="flex w-max max-w-full flex-wrap items-center gap-4 rounded-xl border border-border/30 bg-muted/20 px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <span className="font-bold text-foreground">{categoryCounts.all} Resources</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{categoryCounts.documents} Documents</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{categoryCounts.quizzes} Quizzes</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{categoryCounts.flashcards} Flashcards</span>
        </div>
      )}

      {filters.category === "leaderboard" ? (
        <div className="surface-card overflow-hidden rounded-2xl border border-border/40 shadow-sm">
          {loadingLeaderboard ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-14 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/50 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-16 px-6 py-4 text-center">Hạng</th>
                  <th className="px-6 py-4">Contributor</th>
                  <th className="px-6 py-4 text-center">Nội dung duyệt</th>
                  <th className="px-6 py-4 text-center">Reputation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {contributors.map((contributor, index) => (
                  <tr key={contributor.userId} className="transition-colors hover:bg-muted/20">
                    <td className="px-6 py-4 text-center font-display text-base font-bold">
                      {contributor.rank || index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {(contributor.fullName || "C").slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-semibold">{contributor.fullName}</div>
                          <div className="text-xs text-muted-foreground">User #{contributor.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">{formatNumber(contributor.approvedContents)}</td>
                    <td className="px-6 py-4 text-center font-semibold">{formatNumber(contributor.reputationPoints)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="surface-card h-[245px] animate-pulse rounded-2xl p-5">
              <div className="mb-5 flex justify-between">
                <div className="size-12 rounded-xl bg-muted" />
                <div className="h-6 w-24 rounded-lg bg-muted" />
              </div>
              <div className="mb-3 h-5 w-3/4 rounded-md bg-muted" />
              <div className="h-4 w-1/2 rounded-md bg-muted" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState onReset={resetFilters} />
      ) : (
        <div className="space-y-8">
          <section>
            <SectionHeader
              icon={<Flame size={19} className="text-rose-500" />}
              title="Top trending"
              subtitle="Sắp xếp theo lượt clone/download thật từ marketplace"
            />
            {renderGrid(trendingItems.length ? trendingItems : items.slice(0, 8))}
          </section>

          <section>
            <SectionHeader
              icon={<Star size={19} className="fill-amber-500 text-amber-500" />}
              title="Top rated"
              subtitle="Dựa trên acceptPercentage/review score từ backend"
            />
            {renderGrid(topRatedItems.length ? topRatedItems : items.slice(0, 8))}
          </section>

          {filters.category === "all" && (
            <div className="space-y-8">
              <section>
                <SectionHeader icon={<FileText size={18} />} title="Latest Documents" />
                {renderGrid(latestDocuments)}
              </section>
              <section>
                <SectionHeader icon={<GraduationCap size={18} />} title="Latest Quiz" />
                {renderGrid(latestQuizzes)}
              </section>
              <section>
                <SectionHeader icon={<BookOpen size={18} />} title="Latest Flashcards" />
                {renderGrid(latestFlashcards)}
              </section>
            </div>
          )}

          <section>
            <SectionHeader
              icon={<TrendingUp size={19} className="text-primary" />}
              title="Kết quả theo bộ lọc"
              subtitle="Danh sách đang áp dụng category, môn, học kỳ và sort ở thanh lọc"
            />
            {renderGrid(items)}
          </section>
        </div>
      )}
      {/* Detail page is rendered above when selectedItem is set */}
    </motion.div>
  );
}
