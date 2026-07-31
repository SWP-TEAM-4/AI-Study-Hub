import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Flame,
  GraduationCap,
  Search,
  Star,
  Trophy,
  Users,
  X,
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
} from "../services/communityMarketplaceService";
import { reputationService, type ReputationLeaderboardItemDTO, type ReputationLeaderboardKind } from "../services/reputationService";
import { communityService, type CommunityProfileDTO } from "../services/communityService";
import type { BadgeDTO } from "../services/badgeService";
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
  },
  QUIZ: {
    icon: GraduationCap,
    label: "Quiz",
    tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  FLASHCARD_DECK: {
    icon: BookOpen,
    label: "Flashcards",
    tone: "bg-sky-500/10 text-sky-600 border-sky-500/20",
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

function ratingFromMarketplaceItem(item: MarketplaceItemDTO) {
  const average = Number(item.communityRatingAvg ?? 0);
  if (Number.isFinite(average) && average > 0) return Math.min(5, average);
  return ratingFromAcceptPercentage(item.acceptPercentage);
}

function formatNumber(value?: number | null) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

function currentPeriodKey() {
  return new Date().toISOString().slice(0, 7);
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

function BadgeChips({ badges, limit = 2 }: { badges?: BadgeDTO[]; limit?: number }) {
  const visible = (badges ?? []).slice(0, limit);
  if (visible.length === 0) {
    return <span className="text-[11px] font-semibold text-muted-foreground">Chưa có huy hiệu</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {visible.map((badge) => (
        <span key={badge.id} className="inline-flex max-w-[150px] items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          {badge.iconUrl ? <img src={badge.iconUrl} alt="" className="size-3 rounded-full object-cover" /> : <Award size={11} />}
          <span className="truncate">{badge.name}</span>
        </span>
      ))}
      {(badges?.length ?? 0) > limit && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
          +{(badges?.length ?? 0) - limit}
        </span>
      )}
    </div>
  );
}

function HonorModal({
  profile,
  loading,
  onClose,
}: {
  profile: CommunityProfileDTO | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-black text-primary">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : (profile.fullName || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg font-bold text-foreground">{profile.fullName || `User #${profile.userId}`}</h3>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                {formatNumber(profile.reputationPoints)} reputation · {profile.joinedAt ? `Tham gia ${new Date(profile.joinedAt).toLocaleDateString("vi-VN")}` : `User #${profile.userId}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="max-h-[72vh] overflow-y-auto p-6">
            <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
              <section>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold"><Award size={15} className="text-amber-500" /> Huy hiệu</h4>
                {profile.badges.length === 0 ? (
                  <p className="rounded-xl border border-border bg-muted/25 p-4 text-sm text-muted-foreground">Thành viên này chưa có huy hiệu công khai.</p>
                ) : (
                  <div className="grid gap-2">
                    {profile.badges.slice(0, 5).map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                          {badge.iconUrl ? <img src={badge.iconUrl} alt="" className="size-5 rounded object-cover" /> : <Award size={16} />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-foreground">{badge.name}</div>
                          <div className="line-clamp-1 text-xs text-muted-foreground">{badge.description || "Danh hiệu cộng đồng"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold"><Trophy size={15} className="text-primary" /> Top môn</h4>
                {profile.topSubjects.length === 0 ? (
                  <p className="rounded-xl border border-border bg-muted/25 p-4 text-sm text-muted-foreground">Chưa có điểm theo môn.</p>
                ) : (
                  <div className="space-y-2">
                    {profile.topSubjects.slice(0, 5).map((subject) => (
                      <div key={subject.subjectId} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">{subject.subjectCode || `Môn #${subject.subjectId}`}</div>
                          <div className="truncate text-xs text-muted-foreground">{subject.subjectName || "Môn học"}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-black text-primary">{formatNumber(subject.score)}</div>
                          <div className="text-[10px] font-semibold text-muted-foreground">{formatNumber(subject.eventCount)} event</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="mt-5">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold"><FileText size={15} className="text-emerald-600" /> Đóng góp gần đây</h4>
              {profile.contributions.length === 0 ? (
                <p className="rounded-xl border border-border bg-muted/25 p-4 text-sm text-muted-foreground">Chưa có nội dung marketplace đã duyệt.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {profile.contributions.slice(0, 6).map((item) => (
                    <div key={`${item.targetType}-${item.targetId}`} className="rounded-xl border border-border bg-muted/15 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{typeStyle[item.targetType]?.label ?? item.targetType}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground">{item.subjectCode || "No subject"}</span>
                      </div>
                      <div className="mt-2 line-clamp-2 text-sm font-bold">{item.title}</div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
                        <span><Download size={11} className="inline" /> {formatNumber(item.downloadCount)}</span>
                        <span><Star size={11} className="inline" /> {Number(item.communityRatingAvg ?? 0).toFixed(1)}</span>
                        <span>{formatNumber(item.communityReviewCount)} review</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-5">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold"><Star size={15} className="text-amber-500" /> Review công khai</h4>
              {profile.reviewHistory.length === 0 ? (
                <p className="rounded-xl border border-border bg-muted/25 p-4 text-sm text-muted-foreground">Chưa có review cộng đồng công khai.</p>
              ) : (
                <div className="space-y-2">
                  {profile.reviewHistory.slice(0, 4).map((review) => (
                    <div key={review.id} className="rounded-xl border border-border bg-muted/15 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-bold">{review.targetTitle || `${review.targetType} #${review.targetId}`}</div>
                        <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                          {review.rating ?? "N/A"} sao
                        </span>
                      </div>
                      {review.content && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{review.content}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ItemCard({
  item,
  subjectLabel,
  cloneResult,
  onOpen,
  onClone,
  onOpenCreator,
}: {
  item: MarketplaceItemDTO;
  subjectLabel: string;
  cloneResult?: CloneResultDTO;
  onOpen: () => void;
  onClone: () => void;
  onOpenCreator: (userId: number, fullName: string) => void;
}) {
  const style = typeStyle[item.targetType] ?? typeStyle.DOCUMENT;
  const Icon = style.icon;
  const rating = ratingFromMarketplaceItem(item);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card group flex min-h-[245px] cursor-pointer flex-col rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
      onClick={onOpen}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl border ${style.tone}`}>
          <Icon size={20} strokeWidth={1.7} />
        </div>
        <div className="flex min-w-0 flex-col items-end gap-2">
          <span className="max-w-[145px] truncate rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold">
            {subjectLabel}
          </span>
          {cloneResult && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              <CheckCircle2 size={11} /> Clone #{cloneResult.id}
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.tone}`}>
          {style.label}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground">Source #{item.targetId}</span>
      </div>

      <h3 className="line-clamp-2 flex-1 font-display text-base font-semibold leading-snug">{item.title}</h3>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (item.creatorId) onOpenCreator(item.creatorId, item.creatorName || "Ẩn danh");
        }}
        disabled={!item.creatorId}
        className="mt-4 flex min-w-0 items-center gap-2 text-left text-xs text-muted-foreground transition-colors hover:text-primary disabled:cursor-default disabled:hover:text-muted-foreground"
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
          {(item.creatorName || "U").slice(0, 2).toUpperCase()}
        </div>
        <span className="truncate">{item.creatorName || "Ẩn danh"}</span>
        {item.creatorId && <Award size={12} className="shrink-0 text-amber-500" />}
      </button>

      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
            <Star size={13} className={rating ? "fill-current" : ""} /> {rating ? rating.toFixed(1) : "N/A"}
          </span>
          <span className="hidden items-center gap-1 text-muted-foreground sm:inline-flex">
            {formatNumber(item.communityReviewCount ?? item.reviewCount)} review
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
    </motion.article>
  );
}

function ItemGrid({
  items,
  subjectMap,
  clonedItems,
  onOpen,
  onClone,
  onOpenCreator,
}: {
  items: MarketplaceItemDTO[];
  subjectMap: Map<number, string>;
  clonedItems: Record<string, CloneResultDTO>;
  onOpen: (item: MarketplaceItemDTO) => void;
  onClone: (item: MarketplaceItemDTO) => void;
  onOpenCreator: (userId: number, fullName: string) => void;
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
          onOpenCreator={onOpenCreator}
        />
      ))}
    </div>
  );
}

function LeaderboardTable({
  items,
  kind,
  periodKey,
  onOpenUser,
}: {
  items: ReputationLeaderboardItemDTO[];
  kind: ReputationLeaderboardKind;
  periodKey: string;
  onOpenUser: (user: ReputationLeaderboardItemDTO) => void;
}) {
  const scoreLabel = kind === "reviewers" ? "Điểm reviewer" : "Điểm đóng góp";
  const eventLabel = kind === "reviewers" ? "Lượt duyệt" : "Sự kiện";

  if (items.length === 0) {
    return (
      <div className="px-6 py-14 text-center text-sm text-muted-foreground">
        Chưa có dữ liệu xếp hạng cho kỳ {periodKey}.
      </div>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-border/50 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
        <tr>
          <th className="w-16 px-6 py-4 text-center">Hạng</th>
          <th className="px-6 py-4">Thành viên</th>
          <th className="px-6 py-4 text-center">{scoreLabel}</th>
          <th className="px-6 py-4 text-center">{eventLabel}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {items.map((item, index) => (
          <tr key={`${kind}-${item.userId}`} className="transition-colors hover:bg-muted/20">
            <td className="px-6 py-4 text-center font-display text-base font-bold">
              {item.rank || index + 1}
            </td>
            <td className="px-6 py-4">
              <button type="button" onClick={() => onOpenUser(item)} className="flex min-w-0 items-center gap-3 text-left">
                <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt={item.fullName} className="h-full w-full object-cover" />
                  ) : (
                    (item.fullName || "U").slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-semibold">{item.fullName || "Ẩn danh"}</div>
                  <div className="text-xs text-muted-foreground">User #{item.userId}</div>
                  <div className="mt-1">
                    <BadgeChips badges={item.badges as BadgeDTO[] | undefined} limit={2} />
                  </div>
                </div>
              </button>
            </td>
            <td className="px-6 py-4 text-center font-semibold">{formatNumber(item.score)}</td>
            <td className="px-6 py-4 text-center font-semibold">{formatNumber(item.eventCount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
  const [leaderboardType, setLeaderboardType] = useState<ReputationLeaderboardKind>("contributors");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState(currentPeriodKey());
  const [leaderboardItems, setLeaderboardItems] = useState<ReputationLeaderboardItemDTO[]>([]);
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [semesters, setSemesters] = useState<SemesterDTO[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItemDTO | null>(null);
  const [selectedCommunityProfile, setSelectedCommunityProfile] = useState<CommunityProfileDTO | null>(null);
  const [loadingHonorUser, setLoadingHonorUser] = useState(false);
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

        const [mainRes, trendingRes, topRatedRes] = await Promise.all([
          communityMarketplaceService.browse({
            category,
            page: 0,
            size: 72,
            keyword: filters.search,
            sort: filters.sort,
            subjectId,
            academicTermId,
          }),
          communityMarketplaceService.browse({ category, page: 0, size: 8, keyword: filters.search, sort: "downloadCount", subjectId, academicTermId }),
          communityMarketplaceService.browse({ category, page: 0, size: 8, keyword: filters.search, sort: "acceptPercentage", subjectId, academicTermId }),
        ]);

        if (!mounted) return;
        setItems(mainRes.data.items ?? []);
        setTrendingItems(trendingRes.data.items ?? []);
        setTopRatedItems(topRatedRes.data.items ?? []);
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
        const subjectId = filters.subjectId !== "all" ? Number(filters.subjectId) : undefined;
        const response = await reputationService.getReputationLeaderboard(leaderboardType, {
          page: 0,
          size: 20,
          subjectId,
          periodKey: leaderboardPeriod,
        });
        if (mounted) setLeaderboardItems(response.data.items ?? []);
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
  }, [filters.category, filters.subjectId, leaderboardPeriod, leaderboardType]);

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
      Notify.failure(err?.message || "Clone thất bại.");
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
      onOpenCreator={openUserHonors}
    />
  );

  async function openUserHonors(userId: number, fullName: string, initialBadges?: BadgeDTO[]) {
    setSelectedCommunityProfile({
      userId,
      fullName,
      avatarUrl: null,
      reputationPoints: 0,
      badges: initialBadges ?? [],
      topSubjects: [],
      contributions: [],
      reviewHistory: [],
    });
    setLoadingHonorUser(true);
    try {
      const response = await communityService.getCommunityProfile(userId);
      setSelectedCommunityProfile(response.data);
    } catch (err: any) {
      Notify.failure(err?.message || "Không tải được hồ sơ cộng đồng.");
    } finally {
      setLoadingHonorUser(false);
    }
  }

  // Show detail page if item selected
  if (selectedItem) {
    const detailItem = {
      id: selectedItem.targetId,
      type: selectedItem.targetType,
      title: selectedItem.title,
      author: selectedItem.creatorName || "Ẩn danh",
      subject: selectedItem.subjectId ? (subjectMap.get(selectedItem.subjectId) || `Môn #${selectedItem.subjectId}`) : "Chưa gắn môn",
      downloads: selectedItem.downloadCount || 0,
      rating: ratingFromMarketplaceItem(selectedItem) || 0,
      kind: (selectedItem.targetType === "DOCUMENT" ? "doc" : selectedItem.targetType === "QUIZ" ? "quiz" : "deck") as "doc" | "quiz" | "deck",
      isVerified: true,
    };
    return <CommunityDetailPage item={detailItem} onBack={() => setSelectedItem(null)} />;
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
              placeholder={
                filters.category === "leaderboard"
                  ? "Leaderboard lọc theo môn và tháng"
                  : t("pages.community.search", "Tìm trong cộng đồng...")
              }
              disabled={filters.category === "leaderboard"}
              autoComplete="off"
              spellCheck="false"
              className="h-11 w-full rounded-xl border border-transparent bg-muted/50 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:bg-card disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:w-auto">
            <CustomSelect
              value={filters.category}
              onChange={(value) => setFilters((current) => ({ ...current, category: value as CategoryFilter }))}
              className="min-w-[150px]"
              data={CATEGORY_OPTIONS}
            />
            <CustomSelect
              value={filters.subjectId}
              onChange={(value) => setFilters((current) => ({ ...current, subjectId: value }))}
              className="min-w-[190px]"
              data={[
                { label: "Tất cả môn", value: "all" },
                ...subjects.map((subject) => ({ label: `${subject.code} · ${subject.name}`, value: String(subject.id) })),
              ]}
            />
            {filters.category !== "leaderboard" && (
              <>
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
            {filters.category === "leaderboard" && (
              <>
                <input
                  type="month"
                  value={leaderboardPeriod}
                  onChange={(event) => setLeaderboardPeriod(event.target.value || currentPeriodKey())}
                  className="h-11 min-w-[145px] rounded-xl border border-transparent bg-muted/50 px-3 text-sm outline-none transition-all focus:border-primary focus:bg-card"
                />
                <div className="flex h-11 rounded-xl border border-border/50 bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setLeaderboardType("contributors")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all ${
                      leaderboardType === "contributors" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <Trophy size={14} /> Contributor
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardType("reviewers")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all ${
                      leaderboardType === "reviewers" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <Star size={14} /> Reviewer
                  </button>
                </div>
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
          <div className="flex flex-col gap-3 border-b border-border/50 bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Trophy size={19} className="text-amber-500" />
                {leaderboardType === "contributors" ? "Top đóng góp" : "Top reviewer"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {filters.subjectId === "all"
                  ? `Toàn bộ môn trong kỳ ${leaderboardPeriod}`
                  : `${subjectMap.get(Number(filters.subjectId)) ?? `Môn #${filters.subjectId}`} · ${leaderboardPeriod}`}
              </p>
            </div>
            <div className="rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-bold text-muted-foreground">
              {formatNumber(leaderboardItems.length)} thành viên
            </div>
          </div>
          {loadingLeaderboard ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-14 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <LeaderboardTable
              items={leaderboardItems}
              kind={leaderboardType}
              periodKey={leaderboardPeriod}
              onOpenUser={(user) => openUserHonors(user.userId, user.fullName || `User #${user.userId}`, user.badges as BadgeDTO[] | undefined)}
            />
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
              subtitle="Dựa trên điểm review cộng đồng, fallback theo tỷ lệ duyệt khi chưa đủ review"
            />
            {renderGrid(topRatedItems.length ? topRatedItems : items.slice(0, 8))}
          </section>

        </div>
      )}
      <AnimatePresence>
        <HonorModal
          profile={selectedCommunityProfile}
          loading={loadingHonorUser}
          onClose={() => {
            setSelectedCommunityProfile(null);
            setLoadingHonorUser(false);
          }}
        />
      </AnimatePresence>
      {/* Detail page is rendered above when selectedItem is set */}
    </motion.div>
  );
}
