import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  Clock,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Layers,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import { Notify } from "notiflix";
import { useNavigate } from "react-router-dom";
import {
  marketplaceService,
  type AdminContentDTO,
  type MarketplaceFlashcardDTO,
  type MarketplaceQuestionDTO,
} from "../services/marketplaceService";
import { flashcardService } from "../services/flashcardService";
import { quizService } from "../services/quizService";
import { safeLocalStorage } from "../utils/safeStorage";

type ReviewFilter = "ALL" | AdminContentDTO["targetType"];

const contentMeta: Record<AdminContentDTO["targetType"], {
  label: string;
  shortLabel: string;
  icon: typeof FileText;
  classes: string;
  softClasses: string;
}> = {
  DOCUMENT: {
    label: "Tài liệu",
    shortLabel: "DOC",
    icon: FileText,
    classes: "border-sky-500/25 bg-sky-500/[0.08] text-sky-700",
    softClasses: "border-sky-500/20 bg-sky-500/[0.05]",
  },
  QUIZ: {
    label: "Quiz",
    shortLabel: "QUIZ",
    icon: GraduationCap,
    classes: "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-700",
    softClasses: "border-emerald-500/20 bg-emerald-500/[0.05]",
  },
  FLASHCARD_DECK: {
    label: "Flashcard",
    shortLabel: "DECK",
    icon: BookOpen,
    classes: "border-rose-500/25 bg-rose-500/[0.08] text-rose-700",
    softClasses: "border-rose-500/20 bg-rose-500/[0.05]",
  },
};

const filterOptions: Array<{ id: ReviewFilter; label: string }> = [
  { id: "ALL", label: "Tất cả" },
  { id: "DOCUMENT", label: "Tài liệu" },
  { id: "QUIZ", label: "Quiz" },
  { id: "FLASHCARD_DECK", label: "Flashcard" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa rõ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function firstNonBlank(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function mergeReviewerDetail(base: AdminContentDTO, detail?: Partial<AdminContentDTO> | null): AdminContentDTO {
  const merged = { ...base, ...(detail ?? {}) } as AdminContentDTO & {
    submitNote?: string | null;
    reviewNote?: string | null;
    note?: string | null;
  };

  return {
    ...merged,
    submissionNote: firstNonBlank(
      merged.submissionNote,
      merged.submitNote,
      merged.reviewNote,
      merged.note,
      base.submissionNote,
      (base as any).submitNote,
      (base as any).reviewNote,
      (base as any).note,
    ),
  };
}

function questionTypeLabel(value?: string | null) {
  switch (value) {
    case "SINGLE_CHOICE":
      return "Một đáp án";
    case "MULTIPLE_CHOICE":
      return "Nhiều đáp án";
    case "FILL_IN_THE_BLANK":
      return "Điền khuyết";
    default:
      return value || "Câu hỏi";
  }
}

function DetailMetric({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/[0.18] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <Icon size={12} className="text-primary" />
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-extrabold text-foreground">{value}</div>
    </div>
  );
}

function EmptyPreview({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function QuizPreview({ questions }: { questions?: MarketplaceQuestionDTO[] }) {
  const items = questions ?? [];

  if (items.length === 0) {
    return <EmptyPreview message="Quiz này chưa có câu hỏi để xem trước." />;
  }

  return (
    <div className="space-y-3">
      {items.map((question, index) => (
        <div key={question.id ?? index} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Câu {index + 1} · {questionTypeLabel(question.questionType)}
              </div>
              <div className="mt-1 text-sm font-extrabold leading-6 text-foreground">{question.questionText}</div>
            </div>
            <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              {(question.options ?? []).filter((option) => option.isCorrect).length} đáp án đúng
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(question.options ?? []).map((option, optionIndex) => (
              <div
                key={option.id ?? optionIndex}
                className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-5 ${
                  option.isCorrect
                    ? "border-emerald-500/35 bg-emerald-500/[0.06] text-emerald-800"
                    : "border-border/60 bg-muted/[0.16] text-foreground"
                }`}
              >
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-extrabold ${
                  option.isCorrect ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" : "border-border text-muted-foreground"
                }`}>
                  {option.isCorrect ? <Check size={12} /> : optionIndex + 1}
                </span>
                <span>{option.optionText}</span>
              </div>
            ))}
          </div>

          {question.explanation && (
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs leading-5 text-muted-foreground">
              <span className="font-bold text-foreground">Giải thích:</span> {question.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FlashcardPreview({ cards }: { cards?: MarketplaceFlashcardDTO[] }) {
  const items = cards ?? [];

  if (items.length === 0) {
    return <EmptyPreview message="Bộ flashcard này chưa có thẻ để xem trước." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((card, index) => (
        <div key={card.id ?? index} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Thẻ {index + 1}</div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">ID #{card.id ?? "-"}</span>
          </div>
          <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-3">
            <div className="text-[10px] font-bold uppercase text-rose-700">Mặt trước</div>
            <div className="mt-1 text-sm font-extrabold leading-6 text-foreground">{card.frontText}</div>
          </div>
          <div className="my-3 border-t border-dashed border-border" />
          <div className="rounded-xl border border-border/60 bg-muted/[0.16] p-3">
            <div className="text-[10px] font-bold uppercase text-muted-foreground">Mặt sau</div>
            <div className="mt-1 text-sm leading-6 text-foreground">{card.backText}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentPreview({ item, onOpenDocument }: { item: AdminContentDTO; onOpenDocument: () => void }) {
  const meta = contentMeta[item.targetType];
  const Icon = meta.icon;

  return (
    <section className={`rounded-2xl border ${meta.softClasses}`}>
      <div className="flex flex-col gap-3 border-b border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid size-10 shrink-0 place-items-center rounded-xl border ${meta.classes}`}>
            <Icon size={19} />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-foreground">Xem trước {meta.label.toLowerCase()}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Kiểm tra nội dung trước khi gửi quyết định duyệt.
            </p>
          </div>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${meta.classes}`}>
          {item.targetType === "QUIZ"
            ? `${item.questions?.length ?? 0} câu hỏi`
            : item.targetType === "FLASHCARD_DECK"
              ? `${item.cards?.length ?? 0} thẻ`
              : item.fileType || "Document"}
        </span>
      </div>

      <div className="max-h-[430px] overflow-y-auto p-4 custom-scrollbar">
        {item.targetType === "DOCUMENT" && (
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-500/[0.08] text-sky-700">
                  <FileText size={24} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-foreground">Tài liệu đã chunking</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.fileUrl ? "Có thể mở viewer chunking để kiểm tra đoạn trích và nguồn." : "Chưa có liên kết file để xem trực tiếp."}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenDocument}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold text-primary-foreground transition-all hover:brightness-110"
              >
                <Eye size={15} />
                Xem chunking
              </button>
            </div>
          </div>
        )}

        {item.targetType === "QUIZ" && <QuizPreview questions={item.questions} />}
        {item.targetType === "FLASHCARD_DECK" && <FlashcardPreview cards={item.cards} />}
      </div>
    </section>
  );
}

export default function ReviewerPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [filterType, setFilterType] = useState<ReviewFilter>("ALL");
  const [queue, setQueue] = useState<AdminContentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AdminContentDTO | null>(null);
  const [detailedInfo, setDetailedInfo] = useState<AdminContentDTO | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const [subjectsMap, setSubjectsMap] = useState<Record<number, string>>({});
  const [lastVoteReward, setLastVoteReward] = useState<{
    pointsDelta?: number | null;
    title?: string | null;
    message?: string | null;
    targetTitle: string;
    subjectLabel: string;
  } | null>(null);

  const resolveSubjectLabel = (item?: any) => {
    if (!item) return "Không rõ môn";
    if (item.subject?.code) return item.subject.code;
    if (item.subjectCode) return item.subjectCode;
    if (item.subjectId) return subjectsMap[item.subjectId] || `Môn #${item.subjectId}`;
    return "Không rõ môn";
  };

  const queueCounts = useMemo(() => {
    const counts: Record<ReviewFilter, number> = {
      ALL: queue.length,
      DOCUMENT: 0,
      QUIZ: 0,
      FLASHCARD_DECK: 0,
    };
    queue.forEach((item) => {
      counts[item.targetType] += 1;
    });
    return counts;
  }, [queue]);

  const activeDetail = detailedInfo ?? selectedItem;
  const selectedKey = selectedItem ? `${selectedItem.targetType}_${selectedItem.targetId}` : null;

  const hydrateReviewerPreview = async (item: AdminContentDTO): Promise<AdminContentDTO> => {
    if (item.targetType === "QUIZ" && (!item.questions || item.questions.length === 0)) {
      try {
        const questionsResponse = await quizService.getQuizQuestions(item.targetId);
        return { ...item, questions: questionsResponse.data as MarketplaceQuestionDTO[] };
      } catch (error) {
        console.warn("Không thể hydrate câu hỏi quiz cho reviewer preview:", error);
        return item;
      }
    }

    if (item.targetType === "FLASHCARD_DECK" && (!item.cards || item.cards.length === 0)) {
      try {
        const deckResponse = await flashcardService.getFlashcardDeckDetails(item.targetId);
        return { ...item, cards: deckResponse.data.cards as MarketplaceFlashcardDTO[] };
      } catch (error) {
        console.warn("Không thể hydrate flashcard cho reviewer preview:", error);
        return item;
      }
    }

    return item;
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = safeLocalStorage.getItem("auth_token")?.replace(/['"]+/g, "");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch("/api/subjects?keyword=", { headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const map: Record<number, string> = {};
          json.data.forEach((subject: any) => {
            map[subject.id] = subject.code;
          });
          setSubjectsMap(map);
        }
      } catch (error) {
        console.warn("Không thể tải danh mục môn học:", error);
      }
    };
    void fetchSubjects();
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [keyword, filterType]);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const res = await marketplaceService.getReviewerPending(0, 100, keyword);
      if (res.success) {
        let items = res.data.items || [];
        if (filterType !== "ALL") {
          items = items.filter((item) => item.targetType === filterType);
        }
        setQueue(items);
      }
    } catch (err: any) {
      console.error("Lỗi tải hàng chờ kiểm duyệt:", err);
      Notify.failure(err.message || "Không thể tải hàng chờ kiểm duyệt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = async (item: AdminContentDTO) => {
    setSelectedItem(item);
    setDetailedInfo(null);
    setReviewNote("");
    setIsDetailLoading(true);
    try {
      const res = await marketplaceService.getReviewerContentDetails(item.targetType, item.targetId);
      const merged = mergeReviewerDetail(item, res.success ? res.data : null);
      const hydrated = await hydrateReviewerPreview(merged);
      setDetailedInfo(hydrated);
    } catch (err: any) {
      console.error("Lỗi lấy chi tiết nội dung:", err);
      Notify.failure(err.message || "Không thể tải preview nội dung");
      const hydrated = await hydrateReviewerPreview(mergeReviewerDetail(item));
      setDetailedInfo(hydrated);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleVote = async (voteResult: "APPROVED" | "REJECTED") => {
    if (!selectedItem) return;

    setIsVoting(true);
    try {
      const fallbackNote = voteResult === "APPROVED"
        ? "Nội dung đạt yêu cầu kiểm duyệt."
        : "Nội dung chưa đạt yêu cầu kiểm duyệt.";
      const res = await marketplaceService.voteReviewerContent(
        selectedItem.targetType,
        selectedItem.targetId,
        voteResult,
        reviewNote.trim() || fallbackNote,
      );

      if (res.success) {
        const rewardDelta = res.data.reviewerRewardPointsDelta;
        if (rewardDelta !== undefined && rewardDelta !== null) {
          setLastVoteReward({
            pointsDelta: rewardDelta,
            title: res.data.reviewerRewardTitle,
            message: res.data.reviewerRewardMessage,
            targetTitle: detailedInfo?.title || selectedItem.title,
            subjectLabel: resolveSubjectLabel(detailedInfo || selectedItem),
          });
        }

        if (res.data.decisionReached) {
          Notify.success(res.data.submissionStatus === "APPROVED"
            ? `Nội dung đã đủ điều kiện và được xuất bản.${rewardDelta ? ` Bạn nhận ${rewardDelta > 0 ? "+" : ""}${rewardDelta} điểm.` : ""}`
            : `Nội dung đã đủ điều kiện và bị từ chối.${rewardDelta ? ` Bạn nhận ${rewardDelta > 0 ? "+" : ""}${rewardDelta} điểm.` : ""}`);
        } else {
          Notify.info(`Đã ghi nhận vote (${res.data.totalVotes}/${res.data.requiredVotes}).${rewardDelta ? ` Bạn nhận ${rewardDelta > 0 ? "+" : ""}${rewardDelta} điểm.` : ""}`);
        }

        setQueue((prev) => prev.filter((item) => !(item.targetType === selectedItem.targetType && item.targetId === selectedItem.targetId)));
        setSelectedItem(null);
        setDetailedInfo(null);
        setReviewNote("");
      }
    } catch (err: any) {
      console.error("Lỗi biểu quyết kiểm duyệt:", err);
      Notify.failure(err.message || "Không thể gửi quyết định kiểm duyệt");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="space-y-5 app-shell-font">
      <div className="surface-card border border-border/60 bg-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-extrabold text-primary">
              <ShieldCheck size={18} />
              Reviewer Workspace
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">Kiểm duyệt marketplace</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Xem trước tài liệu, quiz, flashcard và ghi chú người gửi trước khi đưa ra quyết định.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadQueue()}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-xs font-extrabold text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            Tải lại hàng chờ
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {filterOptions.map((filter) => {
            const isAll = filter.id === "ALL";
            const meta = !isAll ? contentMeta[filter.id as AdminContentDTO["targetType"]] : null;
            const Icon = meta?.icon ?? Layers;
            return (
              <div key={filter.id} className={`rounded-xl border p-4 ${meta?.softClasses ?? "border-border/60 bg-muted/[0.18]"}`}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                  <Icon size={15} className={!isAll ? meta?.classes.split(" ").at(-1) : "text-primary"} />
                  {filter.label}
                </div>
                <div className="mt-2 text-2xl font-extrabold">{queueCounts[filter.id]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {lastVoteReward && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-foreground">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-bold text-emerald-700">
                <Award size={16} />
                {lastVoteReward.title || "Đã ghi nhận điểm reviewer"}
              </div>
              <div className="mt-1 truncate text-xs font-semibold text-muted-foreground">
                {lastVoteReward.targetTitle} · {lastVoteReward.subjectLabel}
              </div>
            </div>
            <div className="shrink-0 rounded-lg bg-card px-3 py-1 text-right font-mono text-base font-black text-emerald-700">
              {lastVoteReward.pointsDelta && lastVoteReward.pointsDelta > 0 ? "+" : ""}
              {lastVoteReward.pointsDelta ?? 0} điểm
            </div>
          </div>
          {lastVoteReward.message && <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{lastVoteReward.message}</div>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <section className="xl:col-span-4">
          <div className="surface-card overflow-hidden border border-border/60 bg-card">
            <div className="border-b border-border/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-extrabold">
                    <Layers size={17} className="text-primary" />
                    Hàng chờ
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{queue.length} nội dung đang hiển thị</p>
                </div>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1 text-xs font-bold text-amber-700">
                  Pending
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm theo tên nội dung..."
                    className="h-10 w-full rounded-xl border border-border bg-muted/30 pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {filterOptions.map((filter) => {
                    const active = filterType === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setFilterType(filter.id)}
                        className={`h-9 shrink-0 rounded-xl border px-3 text-xs font-extrabold transition-all ${
                          active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-primary"
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="h-[560px] overflow-y-auto p-3 custom-scrollbar">
              {isLoading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                  <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Đang tải hàng chờ...
                </div>
              ) : queue.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <Clock size={26} className="opacity-50" />
                  Không có nội dung chờ duyệt.
                </div>
              ) : (
                <div className="space-y-2">
                  {queue.map((item, index) => {
                    const meta = contentMeta[item.targetType];
                    const Icon = meta.icon;
                    const isSelected = selectedKey === `${item.targetType}_${item.targetId}`;

                    return (
                      <motion.button
                        key={`${item.targetType}_${item.targetId}`}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.025 }}
                        onClick={() => void handleSelectItem(item)}
                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? "border-primary/50 bg-primary/[0.06] shadow-sm"
                            : "border-border/60 bg-muted/[0.12] hover:border-primary/25 hover:bg-primary/[0.03]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border ${meta.classes}`}>
                            <Icon size={17} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.classes}`}>
                                {meta.shortLabel}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground">#{item.targetId}</span>
                              {item.adminRequired && (
                                <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                  Cần admin
                                </span>
                              )}
                            </div>
                            <h3 className="mt-1 line-clamp-2 text-sm font-extrabold leading-5 text-foreground">{item.title}</h3>
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-muted-foreground">
                              <span>{resolveSubjectLabel(item)}</span>
                              <span>{formatDateTime(item.submittedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="xl:col-span-8">
          <div className="surface-card min-h-[680px] overflow-hidden border border-border/60 bg-card">
            <AnimatePresence mode="wait">
              {!selectedItem ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid min-h-[680px] place-items-center p-8 text-center"
                >
                  <div className="max-w-md">
                    <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <ShieldCheck size={30} />
                    </div>
                    <h2 className="mt-5 text-xl font-extrabold">Chọn nội dung để kiểm duyệt</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Reviewer có thể xem trước quiz, flashcard, tài liệu đã chunking và ghi chú người gửi ngay tại đây.
                    </p>
                  </div>
                </motion.div>
              ) : isDetailLoading || !activeDetail ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid min-h-[680px] place-items-center p-8 text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="animate-spin text-primary" size={26} />
                    Đang tải preview nội dung...
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`${activeDetail.targetType}_${activeDetail.targetId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex min-h-[680px] flex-col"
                >
                  <div className="border-b border-border/60 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${contentMeta[activeDetail.targetType].classes}`}>
                            {contentMeta[activeDetail.targetType].label}
                          </span>
                          <span className="rounded-full border border-border bg-muted/[0.22] px-3 py-1 text-xs font-bold text-muted-foreground">
                            ID #{activeDetail.targetId}
                          </span>
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1 text-xs font-bold text-amber-700">
                            {activeDetail.marketStatus || "PENDING"}
                          </span>
                        </div>
                        <h2 className="mt-3 text-xl font-extrabold leading-7 text-foreground">{activeDetail.title}</h2>
                        {activeDetail.description && (
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{activeDetail.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/[0.05] px-4 py-3">
                        <div className="text-[10px] font-bold uppercase text-primary">Chính sách duyệt</div>
                        <div className="mt-1 text-sm font-extrabold">
                          {(activeDetail.policyMode || selectedItem.policyMode) === "QUORUM" ? "Biểu quyết nhiều reviewer" : "Một reviewer"}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Cần {activeDetail.requiredVotes ?? selectedItem.requiredVotes ?? 1} vote
                          {activeDetail.approvalPercentageRequired ? ` · ${activeDetail.approvalPercentageRequired}% đồng thuận` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <DetailMetric icon={User} label="Người tạo" value={activeDetail.creatorName || "Chưa rõ"} />
                      <DetailMetric icon={BookOpen} label="Môn học" value={resolveSubjectLabel(activeDetail)} />
                      <DetailMetric icon={Clock} label="Ngày gửi" value={formatDateTime(activeDetail.submittedAt)} />
                      <DetailMetric icon={Download} label="Lượt tải" value={formatNumber(activeDetail.downloadCount)} />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto p-5 custom-scrollbar">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
                      <div className="rounded-2xl border border-border/60 bg-muted/[0.14] p-4">
                        <div className="flex items-center gap-2 font-extrabold text-foreground">
                          <MessageSquareText size={17} className="text-primary" />
                          Ghi chú người gửi
                        </div>
                        {activeDetail.submissionNote ? (
                          <p className="mt-3 whitespace-pre-wrap rounded-xl border border-border/60 bg-card p-3 text-sm leading-6 text-foreground">
                            {activeDetail.submissionNote}
                          </p>
                        ) : (
                          <p className="mt-3 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
                            Người gửi không để lại ghi chú cho lần submit này.
                          </p>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <DetailMetric icon={TrendingUp} label="Đồng thuận" value={activeDetail.acceptPercentage !== undefined ? `${activeDetail.acceptPercentage}%` : "0%"} />
                        <DetailMetric icon={Star} label="Đánh giá cộng đồng" value={activeDetail.communityRatingAvg !== undefined ? `${activeDetail.communityRatingAvg}/5` : "0/5"} />
                        <DetailMetric icon={Sparkles} label="Loại nội dung" value={activeDetail.examType || contentMeta[activeDetail.targetType].label} />
                      </div>
                    </div>

                    {activeDetail.adminRequired && (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] p-4 text-sm leading-6 text-amber-800">
                        <div className="flex items-center gap-2 font-extrabold">
                          <AlertTriangle size={17} />
                          Nội dung này có thể cần admin xử lý
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Hệ thống ghi nhận thiếu reviewer đủ scope hoặc policy cần nhiều vote hơn số reviewer hiện có.
                        </p>
                      </div>
                    )}

                    <ContentPreview
                      item={activeDetail}
                      onOpenDocument={() => navigate(`/reviewer/documents/${activeDetail.targetId}`)}
                    />

                    <section className="rounded-2xl border border-border/60 bg-card p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-extrabold text-foreground">Ghi chú phản hồi của reviewer</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Nội dung này sẽ lưu vào lịch sử kiểm duyệt và gửi kèm quyết định.
                          </p>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">{reviewNote.length}/1000</span>
                      </div>
                      <textarea
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value.slice(0, 1000))}
                        placeholder="Nhập nhận xét: nội dung đúng môn, chất lượng câu hỏi/thẻ, lỗi cần sửa..."
                        className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-border bg-muted/[0.16] px-4 py-3 text-sm leading-6 outline-none transition-colors focus:border-primary focus:bg-card"
                        disabled={isVoting}
                      />
                    </section>
                  </div>

                  <div className="grid gap-3 border-t border-border/60 bg-muted/[0.14] p-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void handleVote("REJECTED")}
                      disabled={isVoting}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 text-sm font-extrabold text-destructive transition-all hover:bg-destructive/15 disabled:opacity-50"
                    >
                      <XCircle size={17} />
                      {isVoting ? "Đang gửi..." : "Từ chối"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleVote("APPROVED")}
                      disabled={isVoting}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-600 text-sm font-extrabold text-white transition-all hover:brightness-110 disabled:opacity-50"
                    >
                      <ShieldCheck size={17} />
                      {isVoting ? "Đang gửi..." : "Duyệt nội dung"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}
