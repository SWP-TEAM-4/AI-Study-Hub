import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Clock3, Sparkles, Trophy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Notify } from "notiflix";
import { QuestionDTO, quizService, StartTestPayload, TestDTO } from "../services/quizService";

function AiExplainButton({ question, selected }: { question: string; selected: string }) {
  const [explain, setExplain] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = () => {
    setLoading(true);
    setTimeout(() => {
      setExplain(`AI nhận thấy lựa chọn "${selected}" chưa chính xác với yêu cầu của câu hỏi. Hãy xem lại kiến thức liên quan và phần giải thích của câu.`);
      setLoading(false);
    }, 1500);
  };

  if (explain) {
    return (
      <div className="mt-3 flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs italic text-primary">
        <Sparkles size={14} className="mt-0.5 shrink-0" />
        <span><strong>AI giải thích:</strong> {explain}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleExplain}
      disabled={loading}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
    >
      {loading ? <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Sparkles size={14} />}
      Hỏi AI vì sao sai
    </button>
  );
}

interface QuizPracticePageProps {
  quizId: number;
  config?: StartTestPayload;
  initialTest: TestDTO;
  onBack: () => void;
  onBackToQuizBank: () => void;
}

type AnswerPayload = {
  questionId: number;
  selectedOptionId?: number;
  selectedOptionIds?: number[];
  userAnswerText?: string;
};

const getSelectedOptions = (questions: QuestionDTO[]) =>
  questions.reduce<Record<number, number>>((result, question) => {
    if (question.userProgress?.selectedOptionId) result[question.id] = question.userProgress.selectedOptionId;
    return result;
  }, {});

const getMultipleSelectedOptions = (questions: QuestionDTO[]) =>
  questions.reduce<Record<number, number[]>>((result, question) => {
    if (question.userProgress?.selectedOptionIds?.length) {
      result[question.id] = question.userProgress.selectedOptionIds;
    }
    return result;
  }, {});

const getTextAnswers = (questions: QuestionDTO[]) =>
  questions.reduce<Record<number, string>>((result, question) => {
    if (question.userProgress?.userAnswerText) result[question.id] = question.userProgress.userAnswerText;
    return result;
  }, {});

function getExpiresAt(test: TestDTO | null) {
  if (!test) return null;
  if (test.expiresAt) return new Date(test.expiresAt).getTime();
  if (test.createdAt && test.duration) {
    return new Date(test.createdAt).getTime() + test.duration * 60_000;
  }
  return null;
}

function getRemainingSeconds(test: TestDTO | null) {
  const expiresAt = getExpiresAt(test);
  return expiresAt === null ? null : Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}

function formatRemainingTime(seconds: number | null) {
  if (seconds === null) return "--:--";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function QuizPracticePage({ quizId, config, initialTest, onBack, onBackToQuizBank }: QuizPracticePageProps) {
  const initialQuestions = initialTest.questions || [];
  const [testSession, setTestSession] = useState<TestDTO | null>(initialTest);
  const [questions, setQuestions] = useState<QuestionDTO[]>(initialQuestions);
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<number, number>>(() => getSelectedOptions(initialQuestions));
  const [multiplePicks, setMultiplePicks] = useState<Record<number, number[]>>(() => getMultipleSelectedOptions(initialQuestions));
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>(() => getTextAnswers(initialQuestions));
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => getRemainingSeconds(initialTest));
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<TestDTO | null>(null);
  const pendingSaveTimers = useRef<Record<number, number>>({});
  const pendingSavePayloads = useRef<Record<number, AnswerPayload>>({});
  const inFlightSaves = useRef<Record<number, Promise<void>>>({});
  const submissionStarted = useRef(false);
  const autoSubmitHandler = useRef<() => void>(() => undefined);

  const clearPendingSaves = () => {
    Object.values(pendingSaveTimers.current).forEach((timer) => window.clearTimeout(timer));
    pendingSaveTimers.current = {};
    pendingSavePayloads.current = {};
  };

  useEffect(() => () => clearPendingSaves(), []);

  const persistAnswer = async (payload: AnswerPayload) => {
    if (!testSession) return;
    await quizService.saveTestAnswer(testSession.id, payload);
  };

  const queueAnswerSave = (payload: AnswerPayload) => {
    const questionId = payload.questionId;
    const previousSave = inFlightSaves.current[questionId] ?? Promise.resolve();
    const queuedSave = previousSave.catch(() => undefined).then(() => persistAnswer(payload));
    inFlightSaves.current[questionId] = queuedSave;
    void queuedSave.finally(() => {
      if (inFlightSaves.current[questionId] === queuedSave) delete inFlightSaves.current[questionId];
    }).catch(() => undefined);
    return queuedSave;
  };

  const scheduleAnswerSave = (payload: AnswerPayload) => {
    const questionId = payload.questionId;
    const currentTimer = pendingSaveTimers.current[questionId];
    if (currentTimer) window.clearTimeout(currentTimer);
    pendingSavePayloads.current[questionId] = payload;
    pendingSaveTimers.current[questionId] = window.setTimeout(async () => {
      delete pendingSaveTimers.current[questionId];
      const latestPayload = pendingSavePayloads.current[questionId];
      delete pendingSavePayloads.current[questionId];
      if (!latestPayload) return;
      try {
        await queueAnswerSave(latestPayload);
      } catch (error: any) {
        console.warn("Save answer failed", error);
        if (String(error?.message || "").toLowerCase().includes("expired")) autoSubmitHandler.current();
      }
    }, 250);
  };

  const flushQuestionAnswer = async (questionId: number) => {
    const timer = pendingSaveTimers.current[questionId];
    if (timer) window.clearTimeout(timer);
    delete pendingSaveTimers.current[questionId];
    const payload = pendingSavePayloads.current[questionId];
    delete pendingSavePayloads.current[questionId];
    if (payload) {
      await queueAnswerSave(payload);
      return;
    }
    const inFlightSave = inFlightSaves.current[questionId];
    if (inFlightSave) await inFlightSave;
  };

  const initTest = async () => {
    setIsLoading(true);
    clearPendingSaves();
    submissionStarted.current = false;
    try {
      const response = await quizService.startTest(quizId, config || { quizSelectionMode: "ALL" });
      if (response.success && response.data) {
        const loadedQuestions = response.data.questions || [];
        setTestSession(response.data);
        setQuestions(loadedQuestions);
        setRemainingSeconds(getRemainingSeconds(response.data));
        setIdx(0);
        setDone(false);
        setTestResult(null);
        setPicks(getSelectedOptions(loadedQuestions));
        setMultiplePicks(getMultipleSelectedOptions(loadedQuestions));
        setTextAnswers(getTextAnswers(loadedQuestions));
      }
    } catch (error: any) {
      Notify.failure(error?.message || "Không thể bắt đầu làm bài");
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[idx];
  const progress = questions.length > 0 ? ((idx + 1) / questions.length) * 100 : 0;
  const isFillBlank = currentQuestion?.questionType === "FILL_IN_THE_BLANK";
  const isMultipleChoice = currentQuestion?.questionType === "MULTIPLE_CHOICE";
  const picked = currentQuestion ? picks[currentQuestion.id] : undefined;
  const pickedMultiple = currentQuestion ? multiplePicks[currentQuestion.id] || [] : [];
  const textAnswer = currentQuestion ? textAnswers[currentQuestion.id] || "" : "";

  const submitCurrentTest = async (automatic = false) => {
    if (!testSession || submissionStarted.current) return;
    submissionStarted.current = true;
    setIsSubmitting(true);

    try {
      if (currentQuestion) {
        try {
          await flushQuestionAnswer(currentQuestion.id);
        } catch (error) {
          if (!automatic) throw error;
        }
      }
      const remainingSaves = Object.values(inFlightSaves.current);
      if (remainingSaves.length > 0) await Promise.all(remainingSaves);
      clearPendingSaves();

      const submitResponse = await quizService.submitTest(testSession.id, { confirmSubmit: true });
      if (submitResponse.success) {
        const resultResponse = await quizService.getTestResult(testSession.id);
        if (resultResponse.success && resultResponse.data) {
          setTestResult(resultResponse.data);
          setDone(true);
          if (automatic) Notify.info("Đã hết thời gian. Hệ thống đã tự động nộp bài.");
        }
      }
    } catch (error: any) {
      submissionStarted.current = false;
      Notify.failure(error?.message || "Không thể nộp bài");
    } finally {
      setIsSubmitting(false);
    }
  };

  autoSubmitHandler.current = () => void submitCurrentTest(true);

  useEffect(() => {
    if (!testSession || done || testSession.status === "COMPLETED") return;
    const expiresAt = getExpiresAt(testSession);
    if (expiresAt === null) return;

    const updateTimer = () => {
      const nextRemaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemainingSeconds(nextRemaining);
      if (nextRemaining === 0) autoSubmitHandler.current();
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [testSession, done]);

  const pickSingle = (optionId?: number) => {
    if (!currentQuestion || optionId === undefined || isSubmitting) return;
    setPicks((current) => ({ ...current, [currentQuestion.id]: optionId }));
    scheduleAnswerSave({ questionId: currentQuestion.id, selectedOptionId: optionId });
  };

  const toggleMultiple = (optionId?: number) => {
    if (!currentQuestion || optionId === undefined || isSubmitting) return;
    const currentIds = multiplePicks[currentQuestion.id] || [];
    const nextIds = currentIds.includes(optionId)
      ? currentIds.filter((id) => id !== optionId)
      : [...currentIds, optionId];
    setMultiplePicks((current) => ({ ...current, [currentQuestion.id]: nextIds }));
    scheduleAnswerSave({ questionId: currentQuestion.id, selectedOptionIds: nextIds });
  };

  const updateTextAnswer = (answer: string) => {
    if (!currentQuestion || isSubmitting) return;
    setTextAnswers((current) => ({ ...current, [currentQuestion.id]: answer }));
    scheduleAnswerSave({ questionId: currentQuestion.id, userAnswerText: answer });
  };

  const next = async () => {
    if (!currentQuestion || isSubmitting) return;
    try {
      await flushQuestionAnswer(currentQuestion.id);
    } catch (error: any) {
      if (String(error?.message || "").toLowerCase().includes("expired")) {
        await submitCurrentTest(true);
        return;
      }
      Notify.failure(error?.message || "Không thể lưu câu trả lời");
      return;
    }

    if (idx < questions.length - 1) {
      setIdx((current) => current + 1);
      return;
    }
    await submitCurrentTest(false);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between"><div className="h-4 w-16 animate-pulse rounded bg-muted" /><div className="h-4 w-12 animate-pulse rounded bg-muted" /></div>
        <div className="h-2 animate-pulse rounded-full bg-muted" />
        <div className="surface-card relative space-y-6 overflow-hidden p-6 lg:p-8">
          <div className="h-7 w-3/4 rounded bg-muted" />
          <div className="space-y-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-14 w-full rounded-xl bg-muted" />)}</div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  if (done && testResult) {
    const totalQuestions = testResult.totalQuestions || questions.length;
    const correctAnswers = testResult.correctAnswers || 0;
    const score = testResult.totalScore || 0;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.3 }} className="surface-card gradient-hero p-8 text-center lg:px-12">
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }} className="mx-auto mb-5 grid size-20 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Trophy size={36} />
          </motion.div>
          <h1 className="text-3xl font-bold">Hoàn thành! 🎉</h1>
          <p className="mt-2 text-muted-foreground">Bạn trả lời đúng <strong className="text-foreground">{correctAnswers}</strong>/{totalQuestions} câu</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-bold text-primary">{score}</div><div className="text-xs text-muted-foreground">Điểm</div></div>
            <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-bold text-success">{correctAnswers}</div><div className="text-xs text-muted-foreground">Đúng</div></div>
            <div className="rounded-xl border border-border bg-card p-4"><div className="text-2xl font-bold text-destructive">{totalQuestions - correctAnswers}</div><div className="text-xs text-muted-foreground">Sai</div></div>
          </div>

          <div className="mt-6 space-y-3 text-left">
            {testResult.items?.map((item, index) => {
              const question = questions.find((candidate) => candidate.id === item.questionId);
              if (!question) return null;
              const selectedIds = item.selectedOptionIds?.length
                ? item.selectedOptionIds
                : item.selectedOptionId ? [item.selectedOptionId] : [];
              const selectedText = question.options
                .filter((option) => option.id !== undefined && selectedIds.includes(option.id))
                .map((option) => option.optionText)
                .join(", ") || item.userAnswerText || "";

              return (
                <div key={item.questionId} className={`rounded-xl border p-4 ${item.isCorrect ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-white ${item.isCorrect ? "bg-success" : "bg-destructive"}`}>{item.isCorrect ? <Check size={14} /> : <X size={14} />}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{index + 1}. {question.questionText}</div>
                      {!item.isCorrect && selectedText && <div className="mt-2 text-xs text-destructive">Bạn chọn: <span className="line-through">{selectedText}</span></div>}
                      {item.explanation ? (
                        <div className="mt-3 rounded-lg border border-border bg-card p-3 text-xs italic text-muted-foreground"><strong>Giải thích:</strong> {item.explanation}</div>
                      ) : !item.isCorrect ? <AiExplainButton question={question.questionText} selected={selectedText} /> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={initTest} className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Làm lại</button>
            <button type="button" onClick={onBack} className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-medium">Về danh sách</button>
            <button type="button" onClick={onBackToQuizBank} className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted">Về trang Quiz Bank</button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const timerTone = remainingSeconds !== null && remainingSeconds <= 60
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : remainingSeconds !== null && remainingSeconds <= 300
      ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
      : "border-border bg-card text-foreground";
  const cannotContinue = isFillBlank
    ? textAnswer.trim() === ""
    : isMultipleChoice ? pickedMultiple.length === 0 : picked === undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} disabled={isSubmitting} className="inline-flex h-10 items-center gap-1 rounded-xl px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50">
          <ArrowLeft size={14} /> Thoát
        </button>
        <div className="flex items-center gap-3">
          <div className={`inline-flex h-10 min-w-24 items-center justify-center gap-2 rounded-xl border px-3 font-mono text-sm font-bold tabular-nums ${timerTone}`}>
            <Clock3 size={16} /> {formatRemainingTime(remainingSeconds)}
          </div>
          <div className="text-sm text-muted-foreground">Câu <strong className="text-foreground">{idx + 1}</strong>/{questions.length}</div>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><motion.div className="h-full bg-primary" initial={false} animate={{ width: `${progress}%` }} /></div>

      <div className="surface-card min-h-[300px] p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-display text-xl font-semibold leading-relaxed lg:text-2xl">{currentQuestion.questionText}</h2>
          {isMultipleChoice && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">Chọn nhiều đáp án</span>}
        </div>
        <div className="mt-6 space-y-3">
          {isFillBlank ? (
            <textarea
              value={textAnswer}
              onChange={(event) => updateTextAnswer(event.target.value)}
              rows={4}
              disabled={isSubmitting}
              placeholder="Nhập câu trả lời của bạn..."
              className="w-full resize-none rounded-xl border-2 border-border bg-card p-4 text-sm outline-none focus:border-primary disabled:opacity-60"
            />
          ) : currentQuestion.options.map((option, optionIndex) => {
            const selected = isMultipleChoice
              ? option.id !== undefined && pickedMultiple.includes(option.id)
              : picked === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                disabled={isSubmitting}
                onClick={() => isMultipleChoice ? toggleMultiple(option.id) : pickSingle(option.id)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all disabled:opacity-60 ${selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}
              >
                <div className={`grid size-7 shrink-0 place-items-center text-xs font-bold transition-colors ${isMultipleChoice ? "rounded-md" : "rounded-full"} ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {isMultipleChoice && selected ? <Check size={15} /> : String.fromCharCode(65 + optionIndex)}
                </div>
                <span className={`text-sm ${selected ? "font-medium" : ""}`}>{option.optionText}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={cannotContinue || isSubmitting}
          onClick={() => void next()}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          {isSubmitting ? "Đang xử lý..." : idx === questions.length - 1 ? "Nộp bài" : "Tiếp theo"} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
