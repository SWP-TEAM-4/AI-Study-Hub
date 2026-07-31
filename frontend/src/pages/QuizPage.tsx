import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  FilePenLine,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Trophy,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Confirm, Notify } from "notiflix";
import QuizEditorModal, { QuizEditorMode } from "../components/Quiz/QuizEditorModal";
import CustomSelect from "../components/ui/CustomSelect";
import MarketplacePublishModal, { MarketplacePublishValues } from "../components/ui/MarketplacePublishModal";
import { useSubjects } from "../hooks/useSubjects";
import { academicService } from "../services/academicService";
import { notebookService } from "../services/notebookService";
import { QuizDTO, QuizPayload, quizService, StartTestPayload, TestDTO } from "../services/quizService";
import QuizBankDetailPage from "./QuizBankDetailPage";
import QuizPracticePage from "./QuizPracticePage";

const PAGE_SIZE = 12;

const examTypeStyles: Record<string, string> = {
  MIDTERM: "border border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  FINAL: "border border-purple-500/25 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  PRACTICE: "border border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  QUIZ: "border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

const examTypeLabels: Record<string, string> = {
  PRACTICE: "Luyện tập",
  QUIZ: "Quiz",
  MIDTERM: "Giữa kỳ",
  FINAL: "Cuối kỳ",
};

const visibilityLabels: Record<string, string> = {
  PRIVATE: "Riêng tư",
  PUBLIC_LINK: "Có liên kết",
  MARKETPLACE: "Marketplace",
};

const marketStatusLabels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
};

interface EditorState {
  mode: QuizEditorMode;
  quiz?: QuizDTO;
}

interface QuizCardProps {
  quiz: QuizDTO;
  subjectLabel: string;
  index: number;
  isDeleting: boolean;
  isSubmitting: boolean;
  onOpen: () => void;
  onPlay: () => void;
  onRename: () => void;
  onEdit: () => void;
  onSubmitToMarketplace: () => void;
  onDelete: () => void;
}

function formatScore(value?: number) {
  const score = Number(value ?? 0);
  return Number.isInteger(score) ? String(score) : score.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function QuizCard({
  quiz,
  subjectLabel,
  index,
  isDeleting,
  isSubmitting,
  onOpen,
  onPlay,
  onRename,
  onEdit,
  onSubmitToMarketplace,
  onDelete,
}: QuizCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const questionCount = quiz.questionCount ?? 0;
  const statusLabel = quiz.marketStatus && quiz.marketStatus !== "NONE"
    ? marketStatusLabels[quiz.marketStatus] || quiz.marketStatus
    : visibilityLabels[quiz.visibility || "PRIVATE"] || "Riêng tư";

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const runMenuAction = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: Math.min(index * 0.035, 0.2), duration: 0.25 }}
      className={`surface-card group relative flex min-h-[300px] flex-col rounded-2xl border border-border/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg ${isMenuOpen ? "z-20 !overflow-visible" : "z-0 !overflow-visible"}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="max-w-[150px] truncate rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground" title={subjectLabel}>
            {subjectLabel}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${examTypeStyles[quiz.examType || "PRACTICE"] || examTypeStyles.PRACTICE}`}>
            {examTypeLabels[quiz.examType || "PRACTICE"] || quiz.examType || "Luyện tập"}
          </span>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Thao tác với ${quiz.title}`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <MoreHorizontal size={18} />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: 5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-border bg-card py-1.5 shadow-xl"
              >
                <button role="menuitem" type="button" onClick={() => runMenuAction(onRename)} className="flex h-10 w-full items-center gap-2.5 px-3.5 text-left text-sm transition-colors hover:bg-muted">
                  <Pencil size={15} className="text-muted-foreground" /> Đổi tên
                </button>
                <button role="menuitem" type="button" onClick={() => runMenuAction(onEdit)} className="flex h-10 w-full items-center gap-2.5 px-3.5 text-left text-sm transition-colors hover:bg-muted">
                  <FilePenLine size={15} className="text-muted-foreground" /> Chỉnh thông tin
                </button>
                <button role="menuitem" type="button" onClick={() => runMenuAction(onOpen)} className="flex h-10 w-full items-center gap-2.5 px-3.5 text-left text-sm transition-colors hover:bg-muted">
                  <BookOpen size={15} className="text-muted-foreground" /> Quản lý câu hỏi
                </button>
                {!quiz.clonedFromId && (!quiz.marketStatus || quiz.marketStatus === "NONE" || quiz.marketStatus === "REJECTED") && (
                  <button
                    role="menuitem"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => runMenuAction(onSubmitToMarketplace)}
                    className="flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-wait disabled:opacity-50"
                  >
                    <Send size={15} />
                    {isSubmitting ? "Đang gửi..." : quiz.marketStatus === "REJECTED" ? "Gửi duyệt lại" : "Đăng lên cộng đồng"}
                  </button>
                )}
                <div className="my-1 border-t border-border/70" />
                <button
                  role="menuitem"
                  type="button"
                  disabled={isDeleting}
                  onClick={() => runMenuAction(onDelete)}
                  className="flex h-10 w-full items-center gap-2.5 px-3.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Trash2 size={15} /> {isDeleting ? "Đang xóa..." : "Xóa Quiz Bank"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button type="button" onClick={onOpen} className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <h2 className="line-clamp-2 font-display text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{quiz.title}</h2>
      </button>
      <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
        {quiz.description ? <span className="line-clamp-2">{quiz.description}</span> : <span className="italic opacity-70">Chưa có mô tả</span>}
      </p>

      <div className="mt-4 grid grid-cols-3 divide-x divide-border/70 rounded-xl border border-border/60 bg-muted/30 py-3">
        <div className="px-2 text-center">
          <CircleHelp size={15} className="mx-auto mb-1 text-primary" />
          <div className="text-sm font-bold text-foreground">{questionCount}</div>
          <div className="text-[10px] text-muted-foreground">Câu hỏi</div>
        </div>
        <div className="px-2 text-center">
          <Trophy size={15} className="mx-auto mb-1 text-amber-500" />
          <div className="text-sm font-bold text-foreground">{formatScore(quiz.bestScore)}/10</div>
          <div className="text-[10px] text-muted-foreground">Cao nhất</div>
        </div>
        <div className="px-2 text-center">
          <Clock3 size={15} className="mx-auto mb-1 text-blue-500" />
          <div className="text-sm font-bold text-foreground">{quiz.attemptCount ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Lượt làm</div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-muted-foreground" title={statusLabel}>
          <ShieldCheck size={14} className="shrink-0" /> {statusLabel}
        </span>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={onOpen} className="inline-flex h-10 items-center justify-center rounded-xl bg-muted px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80">
            Chi tiết
          </button>
          <button
            type="button"
            onClick={onPlay}
            disabled={questionCount === 0}
            title={questionCount === 0 ? "Hãy thêm câu hỏi trước khi làm bài" : "Làm bài ngay"}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Play size={14} fill="currentColor" /> Làm bài
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function QuizSkeleton() {
  return (
    <div className="surface-card min-h-[300px] animate-pulse rounded-2xl border border-border/50 p-5">
      <div className="mb-5 flex justify-between"><div className="h-6 w-32 rounded-full bg-muted" /><div className="size-9 rounded-xl bg-muted" /></div>
      <div className="h-5 w-3/4 rounded bg-muted" />
      <div className="mt-3 h-4 w-full rounded bg-muted/70" />
      <div className="mt-1.5 h-4 w-2/3 rounded bg-muted/70" />
      <div className="mt-5 h-20 rounded-xl bg-muted/70" />
      <div className="mt-5 h-10 rounded-xl bg-muted/70" />
    </div>
  );
}

export default function QuizPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [activeTestConfig, setActiveTestConfig] = useState<StartTestPayload | null>(null);
  const [activeTestSession, setActiveTestSession] = useState<TestDTO | null>(null);
  const [activeDetailId, setActiveDetailId] = useState<number | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [publishQuiz, setPublishQuiz] = useState<QuizDTO | null>(null);
  const isStartingTest = useRef(false);
  const { subjects, subjectMap } = useSubjects();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(q.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [q]);

  const sort = sortBy === "oldest" ? "createdAt,asc" : sortBy === "az" ? "title,asc" : "createdAt,desc";
  const quizQuery = useQuery({
    queryKey: ["quizzes", "mine", page, debouncedQuery, filterSubject, filterLevel, filterStatus, sort],
    queryFn: () => quizService.getQuizzes({
      page,
      size: PAGE_SIZE,
      keyword: debouncedQuery || undefined,
      subjectId: filterSubject === "all" ? undefined : Number(filterSubject),
      examType: filterLevel === "all" ? undefined : filterLevel,
      marketStatus: filterStatus === "all" ? undefined : filterStatus,
      sort,
    }),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    refetchOnMount: "always",
  });

  const editorNeedsOptions = Boolean(editorState && editorState.mode !== "rename");
  const semestersQuery = useQuery({
    queryKey: ["academic", "semesters"],
    queryFn: () => academicService.getSemesters(),
    select: (response) => response.data ?? [],
    enabled: editorNeedsOptions,
    staleTime: 10 * 60 * 1000,
  });
  const notebooksQuery = useQuery({
    queryKey: ["notebooks", "quiz-editor", 100],
    queryFn: () => notebookService.getNotebooks(0, 100),
    select: (response) => response.data?.items ?? [],
    enabled: editorNeedsOptions,
    staleTime: 5 * 60 * 1000,
  });

  const list: QuizDTO[] = quizQuery.data?.data?.items ?? [];
  const totalElements = quizQuery.data?.data?.totalElements ?? 0;
  const totalPages = quizQuery.data?.data?.totalPages ?? 0;
  const subjectOptions = useMemo(() => [
    { label: t("filters.allSubjects"), value: "all" },
    ...subjects.map((subject) => ({ label: `${subject.code} — ${subject.name}`, value: String(subject.id) })),
  ], [subjects, t]);

  const saveMutation = useMutation({
    mutationFn: ({ state, payload }: { state: EditorState; payload: QuizPayload }) => (
      state.mode === "create"
        ? quizService.createQuiz(payload)
        : quizService.updateQuiz(state.quiz!.id, payload)
    ),
    onSuccess: async (_response, variables) => {
      setEditorState(null);
      if (variables.state.mode === "create") setPage(0);
      await queryClient.invalidateQueries({ queryKey: ["quizzes", "mine"] });
      Notify.success(variables.state.mode === "create" ? "Đã tạo Quiz Bank" : variables.state.mode === "rename" ? "Đã đổi tên Quiz Bank" : "Đã cập nhật Quiz Bank");
    },
    onError: (error: any) => Notify.failure(error?.message || "Không thể lưu Quiz Bank"),
  });

  const deleteMutation = useMutation({
    mutationFn: (quiz: QuizDTO) => quizService.deleteQuiz(quiz.id),
    onSuccess: async (_response, quiz) => {
      if (list.length === 1 && page > 0) setPage((current) => Math.max(0, current - 1));
      await queryClient.invalidateQueries({ queryKey: ["quizzes", "mine"] });
      Notify.success(`Đã xóa “${quiz.title}”`);
    },
    onError: (error: any) => Notify.failure(error?.message || "Không thể xóa Quiz Bank"),
  });

  const submitMarketplaceMutation = useMutation({
    mutationFn: async ({ quiz, values }: { quiz: QuizDTO; values: MarketplacePublishValues }) => {
      const description = values.description || "";
      const examType = values.examType || "PRACTICE";
      const metadataChanged = quiz.title !== values.title
        || quiz.subjectId !== values.subjectId
        || (quiz.description || "") !== description
        || (quiz.examType || "PRACTICE") !== examType;

      if (metadataChanged) {
        await quizService.updateQuiz(quiz.id, {
          title: values.title,
          description,
          notebookId: quiz.notebookId,
          subjectId: values.subjectId,
          academicTermId: quiz.academicTermId,
          examType,
        });
      }

      return quizService.submitQuizToMarketplace(quiz.id, values.reviewNote);
    },
    onSuccess: async (_response, variables) => {
      setPublishQuiz(null);
      await queryClient.invalidateQueries({ queryKey: ["quizzes", "mine"] });
      Notify.success(`Đã gửi “${variables.values.title}” lên cộng đồng và đang chờ duyệt.`);
    },
    onError: (error: any) => Notify.failure(error?.message || "Không thể đăng Quiz Bank lên cộng đồng"),
  });

  const submitEditor = (payload: QuizPayload) => {
    if (!editorState) return;
    saveMutation.mutate({ state: editorState, payload });
  };

  const requestDelete = (quiz: QuizDTO) => {
    if ((quiz.attemptCount ?? 0) > 0) {
      Notify.warning("Quiz Bank này đã có lịch sử làm bài. Hãy xóa các lượt làm trong trang chi tiết trước để bảo toàn dữ liệu.");
      return;
    }

    Confirm.show(
      "Xóa Quiz Bank",
      `Bạn chắc chắn muốn xóa “${quiz.title}”? Câu hỏi trong Quiz Bank cũng sẽ bị xóa và không thể khôi phục.`,
      "Xóa",
      "Hủy",
      () => deleteMutation.mutate(quiz),
    );
  };

  const requestMarketplaceSubmit = (quiz: QuizDTO) => {
    if (quiz.clonedFromId) {
      Notify.warning("Quiz Bank clone từ Marketplace không thể đăng lại lên cộng đồng.");
      return;
    }

    if ((quiz.questionCount ?? 0) === 0) {
      Notify.warning("Quiz Bank cần có ít nhất một câu hỏi trước khi đăng lên cộng đồng.");
      return;
    }

    setPublishQuiz(quiz);
  };

  const startPractice = async (quizId: number, config: StartTestPayload = { quizSelectionMode: "ALL" }) => {
    if (isStartingTest.current) return false;

    isStartingTest.current = true;
    try {
      const response = await quizService.startTest(quizId, config);
      if (!response.success || !response.data) {
        Notify.failure(response.message || "Không thể bắt đầu làm bài");
        return false;
      }

      setActiveTestConfig(config);
      setActiveTestSession(response.data);
      setActiveQuizId(quizId);
      return true;
    } catch (error: any) {
      Notify.failure(error?.message || "Không thể bắt đầu làm bài");
      return false;
    } finally {
      isStartingTest.current = false;
    }
  };

  const closePractice = () => {
    setActiveQuizId(null);
    setActiveTestConfig(null);
    setActiveTestSession(null);
    void quizQuery.refetch();
  };

  const returnToQuizBank = () => {
    const quizId = activeQuizId;
    closePractice();
    if (quizId !== null) setActiveDetailId(quizId);
  };

  if (activeQuizId && activeTestSession) {
    return (
      <QuizPracticePage
        quizId={activeQuizId}
        config={activeTestConfig ?? undefined}
        initialTest={activeTestSession}
        onBack={closePractice}
        onBackToQuizBank={returnToQuizBank}
      />
    );
  }

  if (activeDetailId) {
    return (
      <QuizBankDetailPage
        quizId={activeDetailId}
        onBack={() => {
          setActiveDetailId(null);
          void quizQuery.refetch();
        }}
        onStartTest={async (config) => {
          const started = await startPractice(activeDetailId, config);
          if (started) setActiveDetailId(null);
        }}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: "easeOut" }} className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
            <GraduationCap className="text-primary" /> {t("pages.quiz.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("pages.quiz.desc")}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{quizQuery.isFetching ? "Đang cập nhật..." : `${totalElements} Quiz Bank`}</span>
          <button
            type="button"
            onClick={() => setEditorState({ mode: "create" })}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Plus size={17} /> Tạo Quiz Bank
          </button>
        </div>
      </div>

      <div className="surface-card relative z-30 flex flex-col items-center gap-3 rounded-2xl border border-border p-3 lg:flex-row">
        <div className="relative flex w-full flex-1 items-center">
          <Search className="absolute left-4 text-muted-foreground" size={16} />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t("pages.quiz.search")}
            className="h-11 w-full rounded-xl border border-transparent bg-muted/50 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:bg-card"
          />
        </div>

        <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:flex-nowrap">
          <CustomSelect value={filterSubject} onChange={(value) => { setFilterSubject(value); setPage(0); }} className="w-full flex-1 md:w-[180px] md:flex-none" data={subjectOptions} />
          <CustomSelect
            value={filterLevel}
            onChange={(value) => { setFilterLevel(value); setPage(0); }}
            className="w-full flex-1 md:w-[155px] md:flex-none"
            data={[
              { label: "Tất cả loại bài", value: "all" },
              { label: "Luyện tập", value: "PRACTICE" },
              { label: "Quiz", value: "QUIZ" },
              { label: "Giữa kỳ", value: "MIDTERM" },
              { label: "Cuối kỳ", value: "FINAL" },
            ]}
          />
          <CustomSelect
            value={filterStatus}
            onChange={(value) => { setFilterStatus(value); setPage(0); }}
            className="w-full flex-1 md:w-[155px] md:flex-none"
            data={[
              { label: "Tất cả trạng thái", value: "all" },
              { label: "Chưa đăng", value: "NONE" },
              { label: "Chờ duyệt", value: "PENDING" },
              { label: "Đã duyệt", value: "APPROVED" },
              { label: "Bị từ chối", value: "REJECTED" },
            ]}
          />
          <CustomSelect
            value={sortBy}
            onChange={(value) => { setSortBy(value); setPage(0); }}
            className="w-full flex-1 md:w-[145px] md:flex-none"
            data={[
              { label: "Mới nhất", value: "newest" },
              { label: "Cũ nhất", value: "oldest" },
              { label: "Tên A–Z", value: "az" },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {quizQuery.isLoading ? (
            Array.from({ length: 6 }, (_, index) => <QuizSkeleton key={index} />)
          ) : quizQuery.isError ? (
            <div className="surface-card col-span-full rounded-2xl border border-border py-14 text-center">
              <p className="text-sm font-medium text-destructive">Không thể tải danh sách Quiz Bank.</p>
              <button type="button" onClick={() => quizQuery.refetch()} className="mt-4 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Thử lại</button>
            </div>
          ) : list.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-card col-span-full flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><BookOpen size={25} /></div>
              <h2 className="mt-4 font-display text-lg font-bold">Chưa có Quiz Bank phù hợp</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">Tạo Quiz Bank mới, hoặc tiếp tục dùng luồng lấy câu hỏi từ Notebook và clone từ Marketplace như hiện tại.</p>
              <button type="button" onClick={() => setEditorState({ mode: "create" })} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
                <Plus size={17} /> Tạo Quiz Bank
              </button>
            </motion.div>
          ) : list.map((quiz, index) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              index={index}
              subjectLabel={(quiz.subjectId ? subjectMap[quiz.subjectId]?.code : null) || quiz.subjectName || "Tự do"}
              isDeleting={deleteMutation.isPending && deleteMutation.variables?.id === quiz.id}
              isSubmitting={submitMarketplaceMutation.isPending && submitMarketplaceMutation.variables?.quiz.id === quiz.id}
              onOpen={() => setActiveDetailId(quiz.id)}
              onPlay={() => void startPractice(quiz.id)}
              onRename={() => setEditorState({ mode: "rename", quiz })}
              onEdit={() => setEditorState({ mode: "edit", quiz })}
              onSubmitToMarketplace={() => requestMarketplaceSubmit(quiz)}
              onDelete={() => requestDelete(quiz)}
            />
          ))}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="surface-card flex items-center justify-between gap-4 rounded-xl p-3">
          <p className="text-sm text-muted-foreground">Trang <strong className="text-foreground">{page + 1}</strong>/{totalPages} · {totalElements} Quiz Bank</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page === 0 || quizQuery.isFetching} onClick={() => setPage((current) => Math.max(0, current - 1))} className="grid size-10 place-items-center rounded-lg border border-border transition-colors hover:bg-muted disabled:opacity-40" aria-label="Trang trước">
              <ChevronLeft size={17} />
            </button>
            <button type="button" disabled={page >= totalPages - 1 || quizQuery.isFetching} onClick={() => setPage((current) => current + 1)} className="grid size-10 place-items-center rounded-lg border border-border transition-colors hover:bg-muted disabled:opacity-40" aria-label="Trang sau">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      )}

      <QuizEditorModal
        isOpen={Boolean(editorState)}
        mode={editorState?.mode ?? "create"}
        quiz={editorState?.quiz}
        subjects={subjects}
        semesters={semestersQuery.data ?? []}
        notebooks={notebooksQuery.data ?? []}
        isLoadingOptions={semestersQuery.isLoading || notebooksQuery.isLoading}
        isSubmitting={saveMutation.isPending}
        onClose={() => !saveMutation.isPending && setEditorState(null)}
        onSubmit={submitEditor}
      />

      <MarketplacePublishModal
        isOpen={Boolean(publishQuiz)}
        kind="QUIZ"
        target={publishQuiz ? {
          id: publishQuiz.id,
          title: publishQuiz.title,
          subjectId: publishQuiz.subjectId,
          description: publishQuiz.description,
          examType: publishQuiz.examType,
          itemCount: publishQuiz.questionCount ?? 0,
          isResubmission: publishQuiz.marketStatus === "REJECTED",
        } : null}
        subjects={subjects}
        isSubmitting={submitMarketplaceMutation.isPending}
        onClose={() => !submitMarketplaceMutation.isPending && setPublishQuiz(null)}
        onSubmit={(values) => {
          if (publishQuiz) submitMarketplaceMutation.mutate({ quiz: publishQuiz, values });
        }}
      />
    </motion.div>
  );
}
