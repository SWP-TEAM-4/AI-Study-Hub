import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X, Trophy } from "lucide-react";
import { useState } from "react";
import { sampleQuestions } from "@/lib/mock-data";

export const Route = createFileRoute("/quiz/$id")({
  head: () => ({
    meta: [{ title: "Làm quiz — Stitch" }],
  }),
  component: QuizPractice,
});

function QuizPractice() {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const q = sampleQuestions[idx];
  const progress = ((idx + 1) / sampleQuestions.length) * 100;
  const score = sampleQuestions.reduce((acc, qq) => acc + (picks[qq.id] === qq.correct ? 1 : 0), 0);

  const pick = (i: number) => {
    setPicks((p) => ({ ...p, [q.id]: i }));
  };

  const next = () => {
    if (idx < sampleQuestions.length - 1) setIdx(idx + 1);
    else setDone(true);
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
        <div className="surface-card p-8 lg:p-12 text-center gradient-hero">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="size-20 mx-auto rounded-3xl bg-primary text-primary-foreground grid place-items-center"
          >
            <Trophy size={36} />
          </motion.div>
          <h1 className="mt-5 text-3xl font-bold">Hoàn thành! 🎉</h1>
          <p className="mt-2 text-muted-foreground">
            Bạn trả lời đúng <strong className="text-foreground">{score}</strong>/{sampleQuestions.length} câu
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-primary">{Math.round((score / sampleQuestions.length) * 100)}</div>
              <div className="text-xs text-muted-foreground">Điểm</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-success">{score}</div>
              <div className="text-xs text-muted-foreground">Đúng</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-destructive">{sampleQuestions.length - score}</div>
              <div className="text-xs text-muted-foreground">Sai</div>
            </div>
          </div>

          <div className="mt-6 text-left space-y-3">
            {sampleQuestions.map((qq, i) => {
              const correct = picks[qq.id] === qq.correct;
              return (
                <div key={qq.id} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-start gap-2">
                    <div className={`size-6 rounded-full grid place-items-center shrink-0 ${correct ? "bg-success text-white" : "bg-destructive text-white"}`}>
                      {correct ? <Check size={14} /> : <X size={14} />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {i + 1}. {qq.text}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Đáp án đúng: <strong className="text-success">{qq.options[qq.correct]}</strong>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 italic">{qq.explanation}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-2 justify-center">
            <button
              onClick={() => {
                setPicks({});
                setIdx(0);
                setDone(false);
              }}
              className="px-4 h-10 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
            >
              Làm lại
            </button>
            <Link to="/quiz" className="px-4 h-10 inline-flex items-center rounded-xl bg-card border border-border font-medium text-sm">
              Về danh sách
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  const picked = picks[q.id];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/quiz" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft size={14} /> Thoát
        </Link>
        <div className="text-sm text-muted-foreground">
          Câu <strong className="text-foreground">{idx + 1}</strong>/{sampleQuestions.length}
        </div>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div className="h-full bg-primary" initial={false} animate={{ width: `${progress}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="surface-card p-6 lg:p-8"
        >
          <h2 className="text-xl lg:text-2xl font-display font-semibold">{q.text}</h2>
          <div className="mt-6 space-y-3">
            {q.options.map((opt, i) => {
              const selected = picked === i;
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  <div
                    className={`size-7 rounded-full grid place-items-center text-xs font-bold ${
                      selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className={`text-sm ${selected ? "font-medium" : ""}`}>{opt}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-end">
        <button
          disabled={picked === undefined}
          onClick={next}
          className="inline-flex items-center gap-1.5 px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
        >
          {idx === sampleQuestions.length - 1 ? "Nộp bài" : "Tiếp theo"} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
