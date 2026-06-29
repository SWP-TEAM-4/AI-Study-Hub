import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { quizzes } from "@/lib/mock-data";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — Stitch" },
      { name: "description", content: "Quiz cá nhân và bộ đề luyện tập." },
    ],
  }),
  component: QuizPage,
});

const levelStyles: Record<string, string> = {
  Easy: "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25",
  Medium: "bg-amber-500/12 text-amber-300 border border-amber-500/25",
  Hard: "bg-rose-500/12 text-rose-300 border border-rose-500/25",
};

function QuizPage() {
  const [q, setQ] = useState("");
  const list = useMemo(() => quizzes.filter((x) => x.title.toLowerCase().includes(q.toLowerCase())), [q]);

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
          {list.map((quiz, i) => (
            <motion.div
              key={quiz.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              className="surface-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-medium">{quiz.subject}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${levelStyles[quiz.level]}`}>{quiz.level}</span>
              </div>
              <h3 className="font-display text-lg font-semibold">{quiz.title}</h3>
              <div className="mt-2 text-sm text-muted-foreground">{quiz.questions} câu hỏi</div>

              <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div>
                  <div className="text-xs text-muted-foreground">Điểm cao nhất</div>
                  <div className="font-bold text-lg">{quiz.bestScore}/100</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Lần làm</div>
                  <div className="font-bold text-lg">{quiz.attempts}</div>
                </div>
              </div>

              <Link
                to="/quiz/$id"
                params={{ id: quiz.id }}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
              >
                <Plus size={16} /> Bắt đầu làm
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
