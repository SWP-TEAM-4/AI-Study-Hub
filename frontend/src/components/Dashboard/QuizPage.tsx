import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Sparkles } from "lucide-react";
import "./QuizPage.css";

type Quiz = {
  id: string;
  title: string;
  subject: string;
  time: string;
  questions: number;
  level: "Easy" | "Medium" | "Hard";
};

const mockQuizzes: Quiz[] = [
  { id: "q1", title: "SWP391 — Final Review", subject: "SWP391", time: "Hôm nay", questions: 10, level: "Easy" },
  { id: "q2", title: "SWT301 — Systems Notes", subject: "SWT301", time: "1 ngày trước", questions: 12, level: "Medium" },
  { id: "q3", title: "SWR302 — Lab Quiz", subject: "SWR302", time: "3 ngày trước", questions: 15, level: "Hard" },
];

export default function QuizPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mockQuizzes;
    return mockQuizzes.filter((x) => x.title.toLowerCase().includes(q) || x.subject.toLowerCase().includes(q));
  }, [query]);

  return (
    <motion.div className="qp-wrap" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="qp-head">
        <div className="qp-title">
          <div className="qp-icon">
            <BookOpen size={18} />
          </div>
          <div>
            <h2>Quiz</h2>
            <p>Danh sách quiz (mock) — sẵn sàng cho backend.</p>
          </div>
        </div>
        <div className="qp-pill">
          <Sparkles size={14} /> {mockQuizzes.length} quizzes
        </div>
      </div>

      <div className="qp-search">
        <Search size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tiêu đề hoặc môn..." />
      </div>

      <div className="qp-grid">
        <AnimatePresence>
          {filtered.map((q) => (
            <motion.div
              key={q.id}
              className="qp-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              whileHover={{ y: -3 }}
            >
              <div className="qp-card-top">
                <div>
                  <div className="qp-subject">{q.subject}</div>
                  <div className="qp-title-text">{q.title}</div>
                </div>
                <div className={`qp-level level-${q.level.toLowerCase()}`}>{q.level}</div>
              </div>
              <div className="qp-meta">
                <span>⏱ {q.time}</span>
                <span>•</span>
                <span>📝 {q.questions} câu</span>
              </div>
              <div className="qp-footer">
                <button className="qp-btn" type="button">Làm ngay (mock)</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="qp-empty">Không tìm thấy quiz nào.</div>
      )}
    </motion.div>
  );
}

