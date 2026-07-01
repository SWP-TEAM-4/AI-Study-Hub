import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Plus, Search, Sparkles, MoreHorizontal, Edit, Globe, Tag, BookOpen } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import QuizPracticePage from "./QuizPracticePage";
import QuizBankDetailPage from "./QuizBankDetailPage";
import CustomSelect from "../components/ui/CustomSelect";
import EmptyState from "../components/ui/EmptyState";
import { quizService, QuizDTO } from "../services/quizService";
import { Notify } from "notiflix";

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
  const [list, setList] = useState<QuizDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await quizService.getQuizzes();
      if (res.success && res.data) {
        setList(res.data.items);
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
        const matchSearch = x.title.toLowerCase().includes(q.toLowerCase()) || (x.subjectName || "").toLowerCase().includes(q.toLowerCase());
        const matchSubject = filterSubject === "all" || x.subjectName === filterSubject;
        const matchLevel = filterLevel === "all" || x.examType === filterLevel;
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

  // Mock functions for missing features
  const handleEdit = (id: number) => Notify.info("Tính năng Sửa đang được phát triển!");
  const handlePublish = (id: number) => {
    Notify.success("Đã gửi lên cộng đồng! Trạng thái: Chờ duyệt.");
  };
  const handleAddTag = (id: number) => Notify.info("Chức năng gắn Tag đang chờ API backend.");

  if (activeQuizId) {
    return <QuizPracticePage quizId={activeQuizId} onBack={() => setActiveQuizId(null)} />;
  }

  if (activeDetailId) {
    return (
      <QuizBankDetailPage 
        quizId={activeDetailId} 
        onBack={() => setActiveDetailId(null)} 
        onStartTest={() => { setActiveQuizId(activeDetailId); setActiveDetailId(null); }} 
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
        <button className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium self-start">
          <Sparkles size={16} /> {t('pages.quiz.createQuiz')}
        </button>
      </div>

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
                
                {/* Action Dropdown (Mocked) */}
                <div className="relative group/menu">
                  <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50">
                    <MoreHorizontal size={16} />
                  </button>
                  <div className="absolute right-0 mt-1 w-40 bg-card border border-border shadow-lg rounded-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(quiz.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                      <Edit size={14} /> {t('pages.quiz.edit')}
                    </button>
                    <button onClick={() => handleAddTag(quiz.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
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
                  onClick={() => setActiveQuizId(quiz.id)}
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
