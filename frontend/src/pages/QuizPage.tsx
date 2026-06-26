import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import QuizPracticePage from "./QuizPracticePage";
import { quizService, QuizDTO } from "../services/quizService";
import { Notify } from "notiflix";

const levelStyles: Record<string, string> = {
  Easy: "bg-success/15 text-success",
  Medium: "bg-warning/20 text-warning-foreground",
  Hard: "bg-destructive/15 text-destructive",
};

export default function QuizPage() {
  const [q, setQ] = useState("");
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
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
    () => list.filter((x) => x.title.toLowerCase().includes(q.toLowerCase())),
    [list, q],
  );

  if (activeQuizId) {
    return <QuizPracticePage quizId={activeQuizId} onBack={() => setActiveQuizId(null)} />;
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

      <div className="surface-card p-4 relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm quiz theo tiêu đề hoặc môn..."
          className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm"
        />
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">{quiz.subject || "No Subject"}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${levelStyles[quiz.level || "Medium"] || levelStyles.Medium}`}>
                  {quiz.level || "Medium"}
                </span>
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

              <div className="mt-auto pt-2">
                <button
                  onClick={() => setActiveQuizId(quiz.id)}
                  className="inline-flex w-full items-center justify-center gap-1.5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
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
