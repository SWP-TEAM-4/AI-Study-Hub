import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Plus, Search, Sparkles, MoreHorizontal, Edit, Globe, Tag, BookOpen } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import QuizPracticePage from "./QuizPracticePage";
import QuizBankDetailPage from "./QuizBankDetailPage";
import CustomSelect from "../components/ui/CustomSelect";
import { quizService, QuizDTO } from "../services/quizService";
import { Notify } from "notiflix";

const levelStyles: Record<string, string> = {
  Easy: "bg-success/15 text-success",
  Medium: "bg-warning/20 text-warning-foreground",
  Hard: "bg-destructive/15 text-destructive",
};

export default function QuizPage() {
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
        const matchSearch = x.title.toLowerCase().includes(q.toLowerCase()) || (x.subject || "").toLowerCase().includes(q.toLowerCase());
        const matchSubject = filterSubject === "all" || x.subject === filterSubject;
        const matchLevel = filterLevel === "all" || x.level === filterLevel;
        const matchStatus = filterStatus === "all" || true;
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="text-primary" /> Quiz
          </h1>
          <p className="text-muted-foreground mt-1">Bộ câu hỏi luyện tập theo môn, AI sinh hoặc tự tạo.</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium self-start">
          <Sparkles size={16} /> AI tạo quiz
        </button>
      </div>

      <div className="surface-card p-3 rounded-2xl flex flex-col lg:flex-row gap-3 items-center border border-border relative z-30">
        <div className="flex-1 relative flex items-center w-full">
          <Search className="absolute left-4 text-muted-foreground" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm quiz theo tiêu đề hoặc môn..."
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
            value={filterLevel}
            onChange={setFilterLevel}
            className="flex-1 md:flex-none min-w-[140px]"
            data={[
              { label: "Tất cả độ khó", value: "all" },
              { label: "Dễ (Easy)", value: "Easy" },
              { label: "Trung bình (Medium)", value: "Medium" },
              { label: "Khó (Hard)", value: "Hard" }
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
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />Đang tải dữ liệu...</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">Không tìm thấy quiz nào.</div>
          ) : filtered.map((quiz, i) => (
            <motion.div
              key={quiz.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              className="surface-card p-5 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium mr-2">{quiz.subject || "No Subject"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${levelStyles[quiz.level || "Medium"] || levelStyles.Medium}`}>
                    {quiz.level || "Medium"}
                  </span>
                </div>
                
                {/* Action Dropdown (Mocked) */}
                <div className="relative group/menu">
                  <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50">
                    <MoreHorizontal size={16} />
                  </button>
                  <div className="absolute right-0 mt-1 w-40 bg-card border border-border shadow-lg rounded-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(quiz.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                      <Edit size={14} /> Sửa
                    </button>
                    <button onClick={() => handleAddTag(quiz.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                      <Tag size={14} /> Gắn thẻ
                    </button>
                    <button onClick={() => handlePublish(quiz.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10">
                      <Globe size={14} /> Đăng cộng đồng
                    </button>
                  </div>
                </div>
              </div>
              <h3 className="font-display text-lg font-semibold">{quiz.title}</h3>
              <div className="mt-2 text-sm text-muted-foreground">{quiz.questions} câu hỏi</div>

              <div className="mt-4 mb-4 flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div>
                  <div className="text-xs text-muted-foreground">Điểm cao nhất</div>
                  <div className="font-bold text-lg">{quiz.bestScore || 0}/100</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Lần làm</div>
                  <div className="font-bold text-lg">{quiz.attempts || 0}</div>
                </div>
              </div>

              <div className="mt-auto pt-2 flex gap-2">
                <button
                  onClick={() => setActiveDetailId(quiz.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-sm font-medium transition-colors"
                >
                  <BookOpen size={16} /> Học
                </button>
                <button
                  onClick={() => setActiveDetailId(quiz.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus size={16} /> Bắt đầu làm
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
