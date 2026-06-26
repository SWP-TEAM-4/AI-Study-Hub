import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { quizService, TestDTO, QuestionDTO } from "../services/quizService";
import { Notify } from "notiflix";

interface QuizPracticePageProps {
  quizId: number;
  onBack: () => void;
}

export default function QuizPracticePage({ quizId, onBack }: QuizPracticePageProps) {
  const [testSession, setTestSession] = useState<TestDTO | null>(null);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<TestDTO | null>(null);

  useEffect(() => {
    initTest();
  }, []);

  const initTest = async () => {
    setIsLoading(true);
    try {
      const res = await quizService.startTest(quizId, { selectionMode: "ALL" });
      if (res.success && res.data) {
        setTestSession(res.data);
        setQuestions(res.data.questions || []);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Không thể bắt đầu làm bài");
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  const q = questions[idx];
  const progress = questions.length > 0 ? ((idx + 1) / questions.length) * 100 : 0;

  const pick = async (optionId: number) => {
    if (!q || !testSession) return;
    
    // Optimistic UI update
    setPicks((p) => ({ ...p, [q.id]: optionId }));

    try {
      // Call API in background
      await quizService.saveTestAnswer(testSession.id, {
        questionId: q.id,
        selectedOptionId: optionId
      });
    } catch (e) {
      console.warn("Save answer failed", e);
    }
  };

  const next = async () => {
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      // Submit
      if (!testSession) return;
      setIsSubmitting(true);
      try {
        const res = await quizService.submitTest(testSession.id, { confirmSubmit: true });
        if (res.success) {
          // Fetch detailed results
          const resultRes = await quizService.getTestResult(testSession.id);
          if (resultRes.success && resultRes.data) {
            setTestResult(resultRes.data);
            setDone(true);
          }
        }
      } catch (e: any) {
        Notify.failure(e.message || "Lỗi nộp bài");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground"><div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />Đang tạo đề thi...</div>;
  }

  if (!q) return null;

  if (done && testResult) {
    const totalQ = testResult.totalQuestions || questions.length;
    const correctC = testResult.correctAnswers || 0;
    const scoreVal = testResult.totalScore || 0;

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
            Bạn trả lời đúng <strong className="text-foreground">{correctC}</strong>/{totalQ} câu
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-primary">{scoreVal}</div>
              <div className="text-xs text-muted-foreground">Điểm</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-success">{correctC}</div>
              <div className="text-xs text-muted-foreground">Đúng</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-destructive">{totalQ - correctC}</div>
              <div className="text-xs text-muted-foreground">Sai</div>
            </div>
          </div>

          <div className="mt-6 text-left space-y-3">
            {testResult.items?.map((item, i) => {
              const question = questions.find(q => q.id === item.questionId);
              if (!question) return null;
              const correct = item.isCorrect;
              const selectedOpt = question.options.find(o => o.id === item.selectedOptionId);

              return (
                <div key={item.questionId} className={`p-4 rounded-xl border ${correct ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`size-6 rounded-full mt-0.5 grid place-items-center shrink-0 ${correct ? "bg-success text-white" : "bg-destructive text-white"}`}>
                      {correct ? <Check size={14} /> : <X size={14} />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{i + 1}. {question.questionText}</div>
                      
                      {!correct && selectedOpt && (
                        <div className="text-xs text-destructive mt-2">
                          Bạn chọn: <span className="line-through">{selectedOpt.optionText}</span>
                        </div>
                      )}
                      
                      {item.explanation && (
                        <div className="mt-3 p-3 rounded-lg bg-card text-xs text-muted-foreground italic border border-border">
                          <strong>Giải thích:</strong> {item.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-2 justify-center">
            <button
              onClick={() => { setPicks({}); setIdx(0); setDone(false); initTest(); }}
              className="px-4 h-10 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Làm lại
            </button>
            <button
              onClick={onBack}
              className="px-4 h-10 inline-flex items-center rounded-xl bg-card border border-border font-medium text-sm"
            >
              Về danh sách
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const picked = picks[q.id];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Thoát
        </button>
        <div className="text-sm text-muted-foreground">
          Câu <strong className="text-foreground">{idx + 1}</strong>/{questions.length}
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
          <h2 className="text-xl lg:text-2xl font-display font-semibold leading-relaxed">{q.questionText}</h2>
          <div className="mt-6 space-y-3">
            {q.options.map((opt, i) => {
              const selected = picked === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => pick(opt.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  <div className={`size-7 rounded-full grid place-items-center text-xs font-bold ${
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className={`text-sm ${selected ? "font-medium" : ""}`}>{opt.optionText}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-end">
        <button
          disabled={picked === undefined || isSubmitting}
          onClick={next}
          className="inline-flex items-center gap-1.5 px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
        >
          {isSubmitting ? "Đang xử lý..." : idx === questions.length - 1 ? "Nộp bài" : "Tiếp theo"} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
