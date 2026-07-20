import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Notify } from "notiflix";
import { QuestionDTO, quizService, StartTestPayload, TestDTO } from "../services/quizService";

function AiExplainButton({ question, selected }: { question: string; selected: string }) {
  const [explain, setExplain] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = () => {
    setLoading(true);
    setTimeout(() => {
      setExplain(`AI nhận thấy bạn đã nhầm lẫn. Lựa chọn "${selected}" không chính xác vì câu hỏi yêu cầu đặc tả khác. Hãy xem lại kiến thức về phần này!`);
      setLoading(false);
    }, 1500);
  };

  if (explain) {
    return (
      <div className="mt-3 p-3 rounded-lg bg-primary/5 text-xs text-primary italic border border-primary/20 flex gap-2">
        <Sparkles size={14} className="shrink-0 mt-0.5" />
        <span>
          <strong>AI Giải thích:</strong> {explain}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleExplain}
      disabled={loading}
      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-semibold disabled:opacity-50"
    >
      {loading ? <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Sparkles size={14} />}
      Hỏi AI vì sao sai
    </button>
  );
}

interface QuizPracticePageProps {
  quizId: number;
  config?: StartTestPayload;
  onBack: () => void;
}

export default function QuizPracticePage({ quizId, config, onBack }: QuizPracticePageProps) {
  const [testSession, setTestSession] = useState<TestDTO | null>(null);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<TestDTO | null>(null);

  useEffect(() => {
    initTest();
  }, [quizId, config]);

  const initTest = async () => {
    setIsLoading(true);
    try {
      const res = await quizService.startTest(quizId, config || { quizSelectionMode: "ALL" });
      if (res.success && res.data) {
        const loadedQuestions = res.data.questions || [];
        setTestSession(res.data);
        setQuestions(loadedQuestions);
        setIdx(0);
        setDone(false);
        setTestResult(null);
        setPicks(
          loadedQuestions.reduce<Record<number, number>>((acc, question) => {
            if (question.userProgress?.selectedOptionId) acc[question.id] = question.userProgress.selectedOptionId;
            return acc;
          }, {}),
        );
        setTextAnswers(
          loadedQuestions.reduce<Record<number, string>>((acc, question) => {
            if (question.userProgress?.userAnswerText) acc[question.id] = question.userProgress.userAnswerText;
            return acc;
          }, {}),
        );
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
  const isFillBlank = q?.questionType === "FILL_IN_THE_BLANK";
  const picked = q ? picks[q.id] : undefined;
  const textAnswer = q ? textAnswers[q.id] || "" : "";

  const pick = async (optionId?: number) => {
    if (!q || !testSession || optionId === undefined) return;
    setPicks((p) => ({ ...p, [q.id]: optionId }));
    try {
      await quizService.saveTestAnswer(testSession.id, {
        questionId: q.id,
        selectedOptionId: optionId,
      });
    } catch (e) {
      console.warn("Save answer failed", e);
    }
  };

  const saveTextAnswer = async (answer: string) => {
    if (!q || !testSession) return;
    setTextAnswers((prev) => ({ ...prev, [q.id]: answer }));
    try {
      await quizService.saveTestAnswer(testSession.id, {
        questionId: q.id,
        userAnswerText: answer,
      });
    } catch (e) {
      console.warn("Save text answer failed", e);
    }
  };

  const next = async () => {
    if (isFillBlank && testSession && q) {
      await saveTextAnswer(textAnswer);
    }

    if (idx < questions.length - 1) {
      setIdx(idx + 1);
      return;
    }

    if (!testSession) return;
    setIsSubmitting(true);
    try {
      const res = await quizService.submitTest(testSession.id, { confirmSubmit: true });
      if (res.success) {
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
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-2 bg-muted animate-pulse rounded-full" />
        <div className="surface-card p-6 lg:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="h-7 w-3/4 bg-muted rounded mb-6" />
          <div className="space-y-3">
            <div className="h-14 w-full bg-muted rounded-xl" />
            <div className="h-14 w-full bg-muted rounded-xl" />
            <div className="h-14 w-full bg-muted rounded-xl" />
            <div className="h-14 w-full bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!q) return null;

  if (done && testResult) {
    const totalQ = testResult.totalQuestions || questions.length;
    const correctC = testResult.correctAnswers || 0;
    const scoreVal = testResult.totalScore || 0;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="surface-card p-8 lg:px-12 text-center gradient-hero"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="size-20 mx-auto mb-5 rounded-3xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30"
          >
            <Trophy size={36} />
          </motion.div>
          <h1 className="text-3xl font-bold">Hoàn thành! 🎉</h1>
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
              const question = questions.find((questionItem) => questionItem.id === item.questionId);
              if (!question) return null;
              const selectedOpt = question.options.find((option) => option.id === item.selectedOptionId);
              const selectedText = selectedOpt?.optionText || item.userAnswerText || "";

              return (
                <div key={item.questionId} className={`p-4 rounded-xl border ${item.isCorrect ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`size-6 rounded-full mt-0.5 grid place-items-center shrink-0 ${item.isCorrect ? "bg-success text-white" : "bg-destructive text-white"}`}>
                      {item.isCorrect ? <Check size={14} /> : <X size={14} />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {i + 1}. {question.questionText}
                      </div>
                      {!item.isCorrect && selectedText && (
                        <div className="text-xs text-destructive mt-2">
                          Bạn chọn: <span className="line-through">{selectedText}</span>
                        </div>
                      )}
                      {item.explanation ? (
                        <div className="mt-3 p-3 rounded-lg bg-card text-xs text-muted-foreground italic border border-border">
                          <strong>Giải thích:</strong> {item.explanation}
                        </div>
                      ) : !item.isCorrect ? (
                        <AiExplainButton question={question.questionText} selected={selectedText} />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-2 justify-center">
            <button onClick={initTest} className="px-4 h-10 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
              Làm lại
            </button>
            <button onClick={onBack} className="px-4 h-10 inline-flex items-center rounded-xl bg-card border border-border font-medium text-sm">
              Về danh sách
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Thoát
        </button>
        <div className="text-sm text-muted-foreground">
          Câu <strong className="text-foreground">{idx + 1}</strong>/{questions.length}
        </div>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div className="h-full bg-primary" initial={false} animate={{ width: `${progress}%` }} />
      </div>

      <div className="surface-card p-6 lg:p-8 min-h-[300px]">
        <h2 className="text-xl lg:text-2xl font-display font-semibold leading-relaxed">{q.questionText}</h2>
        <div className="mt-6 space-y-3">
          {isFillBlank ? (
            <textarea
              value={textAnswer}
              onChange={(event) => setTextAnswers((prev) => ({ ...prev, [q.id]: event.target.value }))}
              onBlur={(event) => saveTextAnswer(event.target.value)}
              rows={4}
              placeholder="Nhập câu trả lời của bạn..."
              className="w-full p-4 rounded-xl border-2 border-border bg-card focus:border-primary outline-none resize-none text-sm"
            />
          ) : (
            q.options.map((opt, i) => {
              const selected = picked === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => pick(opt.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  <div className={`size-7 rounded-full grid place-items-center text-xs font-bold ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className={`text-sm ${selected ? "font-medium" : ""}`}>{opt.optionText}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          disabled={(isFillBlank ? textAnswer.trim() === "" : picked === undefined) || isSubmitting}
          onClick={next}
          className="inline-flex items-center gap-1.5 px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
        >
          {isSubmitting ? "Đang xử lý..." : idx === questions.length - 1 ? "Nộp bài" : "Tiếp theo"} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
