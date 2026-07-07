import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Plus, Search, Sparkles, MoreHorizontal, Edit, Globe, Tag, BookOpen } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import QuizPracticePage from "./QuizPracticePage";
import QuizBankDetailPage from "./QuizBankDetailPage";
import CustomSelect from "../components/ui/CustomSelect";
import EmptyState from "../components/ui/EmptyState";
import { quizService, QuizDTO, QuizPayload, StartTestPayload } from "../services/quizService";
import { Notify } from "notiflix";
import { useSubjects } from "../hooks/useSubjects";
import { academicService, SemesterDTO } from "../services/academicService";
import { notebookService, NotebookDTO } from "../services/notebookService";

const levelStyles: Record<string, string> = {
  EASY: "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25",
  MEDIUM: "bg-amber-500/12 text-amber-300 border border-amber-500/25",
  HARD: "bg-rose-500/12 text-rose-300 border border-rose-500/25",
  MIDTERM: "bg-blue-500/12 text-blue-300 border border-blue-500/25",
  FINAL: "bg-purple-500/12 text-purple-300 border border-purple-500/25",
  PRACTICE: "bg-teal-500/12 text-teal-300 border border-teal-500/25",
};

export default function QuizPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [activeDetailId, setActiveDetailId] = useState<number | null>(null);
  const [activeTestConfig, setActiveTestConfig] = useState<StartTestPayload | undefined>();
  const [list, setList] = useState<QuizDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizDTO | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [quizForm, setQuizForm] = useState<QuizPayload>({
    title: "",
    description: "",
    examType: "Medium",
    visibility: "PRIVATE",
  });
  const { subjects, isLoading: isLoadingSubjects } = useSubjects();
  const [semesters, setSemesters] = useState<SemesterDTO[]>([]);
  const [notebooks, setNotebooks] = useState<NotebookDTO[]>([]);

  useEffect(() => {
    loadQuizzes();
    loadFormLookups();
  }, []);

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await quizService.getQuizzes();
      if (res.success && res.data) {
        const itemsWithCounts = await Promise.all(
          res.data.items.map(async (quiz) => {
            try {
              const questionRes = await quizService.getQuizQuestions(quiz.id);
              return { ...quiz, questions: questionRes.data.length };
            } catch {
              return { ...quiz, questions: quiz.questions ?? 0 };
            }
          }),
        );
        setList(itemsWithCounts);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi tải danh sách Quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(
    () => {
      let result = list.filter((x) => {
<<<<<<< HEAD
        const matchSearch = x.title.toLowerCase().includes(q.toLowerCase()) || (x.subject || "").toLowerCase().includes(q.toLowerCase());
        const matchSubject = filterSubject === "all" || String(x.subjectId ?? "") === filterSubject;
        const matchLevel = filterLevel === "all" || x.level === filterLevel;
=======
        const matchSearch = x.title.toLowerCase().includes(q.toLowerCase()) || (x.subjectName || "").toLowerCase().includes(q.toLowerCase());
        const matchSubject = filterSubject === "all" || x.subjectName === filterSubject;
        const matchLevel = filterLevel === "all" || x.examType === filterLevel;
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
        const matchStatus = filterStatus === "all" || x.marketStatus === filterStatus;
        return matchSearch && matchSubject && matchLevel && matchStatus;
      });

      if (sortBy === "newest") {
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      } else if (sortBy === "oldest") {
        result.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      } else if (sortBy === "az") {
        result.sort((a, b) => a.title.localeCompare(b.title));
      }
      return result;
    },
    [list, q, filterSubject, filterLevel, filterStatus, sortBy],
  );

  const openCreateModal = () => {
    setEditingQuiz(null);
    setQuizForm({ title: "", description: "", examType: "Medium", visibility: "PRIVATE" });
    setIsEditorOpen(true);
  };

  const toNullableNumber = (value: string) => (value ? Number(value) : null);

  const loadFormLookups = async () => {
    const [semesterRes, notebookRes] = await Promise.allSettled([
      academicService.getSemesters(),
      notebookService.getNotebooks(0, 100),
    ]);

    if (semesterRes.status === "fulfilled" && semesterRes.value.success) {
      setSemesters(semesterRes.value.data);
    }
    if (notebookRes.status === "fulfilled" && notebookRes.value.success) {
      setNotebooks(notebookRes.value.data.items);
    }
  };

  const handleEdit = (quiz: QuizDTO) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description || "",
      notebookId: quiz.notebookId,
      subjectId: quiz.subjectId,
      academicTermId: quiz.academicTermId,
      examType: quiz.examType || quiz.level || "Medium",
      visibility: quiz.visibility || "PRIVATE",
    });
    setIsEditorOpen(true);
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim()) {
      Notify.warning("Tên quiz không được để trống");
      return;
    }
    setIsSavingQuiz(true);
    try {
      if (editingQuiz) {
        await quizService.updateQuiz(editingQuiz.id, quizForm);
        Notify.success("Đã cập nhật quiz");
      } else {
        await quizService.createQuiz(quizForm);
        Notify.success("Đã tạo quiz mới");
      }
      setIsEditorOpen(false);
      await loadQuizzes();
    } catch (e: any) {
      Notify.failure(e.message || "Không thể lưu quiz");
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await quizService.submitQuizToMarketplace(id);
      Notify.success("Đã gửi quiz lên Marketplace. Trạng thái: Chờ duyệt.");
      await loadQuizzes();
    } catch (e: any) {
      Notify.failure(e.message || "Không thể gửi quiz lên Marketplace");
    }
  };
  const handleAddTag = () => Notify.warning("Backend hiện chưa có API gắn tag cho Quiz. API tag hiện chỉ hỗ trợ Document.");

  if (activeQuizId) {
    return <QuizPracticePage quizId={activeQuizId} config={activeTestConfig} onBack={() => { setActiveQuizId(null); setActiveTestConfig(undefined); }} />;
  }

  if (activeDetailId) {
    return (
      <QuizBankDetailPage 
        quizId={activeDetailId} 
        onBack={() => setActiveDetailId(null)} 
        onStartTest={(config) => { setActiveTestConfig(config); setActiveQuizId(activeDetailId); setActiveDetailId(null); }} 
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
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="text-primary" /> {t('pages.quiz.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('pages.quiz.desc')}</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium self-start">
          <Sparkles size={16} /> {t('pages.quiz.createQuiz')}
        </button>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface-card w-full max-w-lg p-5 rounded-2xl border border-border bg-card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold">{editingQuiz ? "Sửa Quiz" : "Tạo Quiz mới"}</h2>
                <p className="text-sm text-muted-foreground">Lưu trực tiếp vào Quiz Bank backend.</p>
              </div>
              <button onClick={() => setIsEditorOpen(false)} className="size-8 rounded-lg bg-muted text-muted-foreground hover:text-foreground">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tên quiz</label>
                <input
                  value={quizForm.title}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mô tả</label>
                <textarea
                  value={quizForm.description || ""}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Môn học</label>
                  <select
                    value={quizForm.subjectId ?? ""}
                    onChange={(e) => setQuizForm((prev) => ({ ...prev, subjectId: toNullableNumber(e.target.value) }))}
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
                    value={quizForm.notebookId ?? ""}
                    onChange={(e) => setQuizForm((prev) => ({ ...prev, notebookId: toNullableNumber(e.target.value) }))}
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
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Học kỳ / Academic term</label>
                  <select
                    value={quizForm.academicTermId ?? ""}
                    onChange={(e) => setQuizForm((prev) => ({ ...prev, academicTermId: toNullableNumber(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm"
                  >
                    <option value="">Không chọn học kỳ</option>
                    {semesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.code} - {semester.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Loại đề / Exam type</label>
                  <input
                    list="quiz-exam-type-options"
                    value={quizForm.examType || ""}
                    onChange={(e) => setQuizForm((prev) => ({ ...prev, examType: e.target.value }))}
                    placeholder="Ví dụ: Midterm, Final, Practice..."
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border focus:border-primary outline-none text-sm"
                  />
                  <datalist id="quiz-exam-type-options">
                    <option value="Easy" />
                    <option value="Medium" />
                    <option value="Hard" />
                    <option value="Midterm" />
                    <option value="Final" />
                    <option value="Practice" />
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Hiển thị</label>
                  <select
                    value={quizForm.visibility || "PRIVATE"}
                    onChange={(e) => setQuizForm((prev) => ({ ...prev, visibility: e.target.value as QuizPayload["visibility"] }))}
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
              <button disabled={isSavingQuiz} onClick={handleSaveQuiz} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                {isSavingQuiz ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="surface-card p-3 rounded-2xl flex flex-col lg:flex-row gap-3 items-center border border-border relative z-30">
        <div className="flex-1 relative flex items-center w-full">
          <Search className="absolute left-4 text-muted-foreground" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('pages.quiz.search')}
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
            value={filterLevel}
            onChange={setFilterLevel}
            className="flex-1 md:flex-none w-full md:w-[170px]"
            data={[
              { label: t("Tất cả"), value: "all" },
              { label: "MIDTERM", value: "MIDTERM" },
              { label: "FINAL", value: "FINAL" },
              { label: "PRACTICE", value: "PRACTICE" },
              { label: "QUIZ", value: "QUIZ" }
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
            <div className="col-span-full py-12 text-center text-muted-foreground"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />Đang tải dữ liệu...</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full">
              <EmptyState 
                title={t('pages.quiz.emptyTitle')}
                description={t('pages.quiz.emptyDesc')}
                actionText={t('pages.quiz.goToDocs')}
                actionHref="/documents"
                actionIcon={<BookOpen size={16} />}
              />
            </div>
          ) : filtered.map((quiz, i) => (
            <motion.div
              key={quiz.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.04 }}
              className="surface-card p-5 flex flex-col !overflow-visible"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-medium mr-2">{quiz.subjectName || "No Subject"}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${levelStyles[quiz.examType || "PRACTICE"] || levelStyles.PRACTICE}`}>
                    {quiz.examType || "PRACTICE"}
                  </span>
                </div>
                
                {/* Action Dropdown */}
                <div className="relative group/menu">
                  <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50">
                    <MoreHorizontal size={16} />
                  </button>
                  <div className="absolute right-0 mt-1 w-40 bg-card border border-border shadow-lg rounded-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(quiz)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                      <Edit size={14} /> {t('pages.quiz.edit')}
                    </button>
                    <button onClick={handleAddTag} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                      <Tag size={14} /> {t('pages.quiz.addTag')}
                    </button>
                    <button onClick={() => handlePublish(quiz.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10">
                      <Globe size={14} /> {t('pages.quiz.publish')}
                    </button>
                  </div>
                </div>
              </div>
              <h3 className="font-display text-lg font-semibold">{quiz.title}</h3>
              <div className="mt-2 text-sm text-muted-foreground">{t('pages.quiz.questions')}: {quiz.downloadCount || 0}</div>

              <div className="mt-4 mb-4 flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div>
                  <div className="text-xs text-muted-foreground">{t('pages.quiz.bestScore')}</div>
                  <div className="font-bold text-lg">{quiz.acceptPercentage || 0}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Lượt tải</div>
                  <div className="font-bold text-lg">{quiz.downloadCount || 0}</div>
                </div>
              </div>

              <div className="mt-auto pt-2 flex gap-2">
                <button
                  onClick={() => setActiveDetailId(quiz.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-sm font-medium transition-colors"
                >
                  <BookOpen size={16} /> Chi tiết
                </button>
                <button
                  onClick={() => { setActiveTestConfig(undefined); setActiveQuizId(quiz.id); }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus size={16} /> {t('pages.quiz.playNow')}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
