import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  Eye,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { Confirm, Notify } from "notiflix";
import { QuestionDTO, QuestionPayload, quizService, StartTestPayload, TestDTO, UserTestHistoryDTO } from "../services/quizService";

interface QuizBankDetailPageProps {
  quizId: number;
  onBack: () => void;
  onStartTest: (config?: StartTestPayload) => void;
}

const createBlankQuestionPayload = (): QuestionPayload => ({
  questionText: "Câu hỏi mới",
  questionType: "SINGLE_CHOICE",
  explanation: "",
  options: [
    { optionText: "Đáp án đúng", isCorrect: true },
    { optionText: "Đáp án nhiễu", isCorrect: false },
  ],
});

const getFillBlankAnswerOption = (question: QuestionDTO) => question.options.find((option) => option.isCorrect);

const toQuestionPayload = (question: QuestionDTO): QuestionPayload => ({
  questionText: question.questionText.trim(),
  questionType: question.questionType,
  explanation: question.explanation?.trim() || "",
  options:
    question.questionType === "FILL_IN_THE_BLANK"
      ? (() => {
          const correctAnswer = getFillBlankAnswerOption(question);
          return correctAnswer
            ? [
                {
                  id: correctAnswer.id,
                  optionText: correctAnswer.optionText.trim(),
                  isCorrect: true,
                },
              ]
            : [];
        })()
      : question.options.map((option) => ({
          id: option.id,
          optionText: option.optionText.trim(),
          isCorrect: Boolean(option.isCorrect),
        })),
});

export default function QuizBankDetailPage({ quizId, onBack, onStartTest }: QuizBankDetailPageProps) {
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [history, setHistory] = useState<UserTestHistoryDTO[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectionMode, setSelectionMode] = useState<"ALL" | "SELECTED" | "RANDOM">("ALL");
  const [timeLimit, setTimeLimit] = useState(30);
  const [randomCount, setRandomCount] = useState(5);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const [historyResult, setHistoryResult] = useState<TestDTO | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const selectionAnchorId = useRef<number | null>(null);

  useEffect(() => {
    loadData();
  }, [quizId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [questionRes, historyRes] = await Promise.all([
        quizService.getQuizQuestions(quizId),
        quizService.getQuizTestHistory(quizId, { size: 5 }),
      ]);
      if (questionRes.success) setQuestions(questionRes.data);
      if (historyRes.success) {
        setHistory(historyRes.data.items);
        setHistoryTotal(historyRes.data.totalElements);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Không thể tải dữ liệu Quiz Bank");
    } finally {
      setIsLoading(false);
    }
  };

  const activeQuestion = questions.find((q) => q.id === activeQuestionId);
  const bestScore = useMemo(() => Math.max(0, ...history.map((item) => Number(item.totalScore || 0))), [history]);

  const toggleExpand = (id: number) => setExpandedId(expandedId === id ? null : id);

  const handleSelectQuestion = (id: number) => {
    setActiveQuestionId(id);
    setExpandedId(id);
  };

  const handleQuestionSelection = (id: number, event: MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    event.stopPropagation();

    const anchorIndex = questions.findIndex((question) => question.id === selectionAnchorId.current);
    const currentIndex = questions.findIndex((question) => question.id === id);
    let nextSelectedIds: number[];

    if (event.shiftKey && anchorIndex >= 0 && currentIndex >= 0) {
      const start = Math.min(anchorIndex, currentIndex);
      const end = Math.max(anchorIndex, currentIndex);
      const rangeIds = questions.slice(start, end + 1).map((question) => question.id);
      nextSelectedIds = event.ctrlKey || event.metaKey
        ? Array.from(new Set([...selectedQuestionIds, ...rangeIds]))
        : rangeIds;
    } else {
      nextSelectedIds = selectedQuestionIds.includes(id)
        ? selectedQuestionIds.filter((questionId) => questionId !== id)
        : [...selectedQuestionIds, id];
      selectionAnchorId.current = id;
    }

    setSelectedQuestionIds(nextSelectedIds);
    setSelectionMode(nextSelectedIds.length > 0 ? "SELECTED" : "ALL");
  };

  const handleQuestionRowClick = (id: number, event: MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      handleQuestionSelection(id, event);
      return;
    }
    handleSelectQuestion(id);
  };

  const replaceQuestion = (questionId: number, patch: Partial<QuestionDTO>) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, ...patch } : q)));
  };

  const handleAddNew = async () => {
    setIsSaving(true);
    try {
      const res = await quizService.addQuestionToQuiz(quizId, createBlankQuestionPayload());
      if (res.success && res.data) {
        const newQuestion = {
          ...res.data,
          options: res.data.options?.map((option) => ({ ...option, questionId: res.data.id })) ?? [],
        };
        setQuestions((prev) => [...prev, newQuestion]);
        setActiveQuestionId(newQuestion.id);
        setExpandedId(newQuestion.id);
        Notify.success("Đã thêm câu hỏi mới");
      }
    } catch (e: any) {
      Notify.failure(e.message || "Không thể thêm câu hỏi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    Confirm.show(
      "Xóa câu hỏi",
      "Bạn chắc chắn muốn xóa câu hỏi này khỏi Quiz Bank?",
      "Xóa",
      "Hủy",
      async () => {
        try {
          await quizService.deleteQuestion(id);
          setQuestions((prev) => prev.filter((q) => q.id !== id));
          const nextSelectedIds = selectedQuestionIds.filter((questionId) => questionId !== id);
          setSelectedQuestionIds(nextSelectedIds);
          if (nextSelectedIds.length === 0 && selectionMode === "SELECTED") setSelectionMode("ALL");
          if (selectionAnchorId.current === id) selectionAnchorId.current = null;
          if (activeQuestionId === id) setActiveQuestionId(null);
          Notify.success("Đã xóa câu hỏi");
        } catch (e: any) {
          Notify.failure(e.message || "Không thể xóa câu hỏi");
        }
      },
    );
  };

  const handleViewHistory = async (item: UserTestHistoryDTO) => {
    if (item.status !== "COMPLETED") {
      Notify.info("Lượt làm bài này chưa được nộp nên chưa có kết quả chi tiết");
      return;
    }

    setActiveHistoryId(item.id);
    setHistoryResult(null);
    setIsHistoryLoading(true);
    try {
      const res = await quizService.getTestResult(item.id);
      if (res.success && res.data) setHistoryResult(res.data);
    } catch (e: any) {
      setActiveHistoryId(null);
      Notify.failure(e.message || "Không thể tải kết quả bài test");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleDeleteHistory = (item: UserTestHistoryDTO) => {
    Confirm.show(
      "Xóa lịch sử làm bài",
      "Lượt làm bài và toàn bộ câu trả lời đã lưu sẽ bị xóa. Bạn có muốn tiếp tục?",
      "Xóa",
      "Hủy",
      async () => {
        try {
          await quizService.deleteTest(item.id);
          setHistory((prev) => prev.filter((historyItem) => historyItem.id !== item.id));
          setHistoryTotal((prev) => Math.max(0, prev - 1));
          if (activeHistoryId === item.id) {
            setActiveHistoryId(null);
            setHistoryResult(null);
          }
          Notify.success("Đã xóa lịch sử làm bài");
        } catch (e: any) {
          Notify.failure(e.message || "Không thể xóa lịch sử làm bài");
        }
      },
    );
  };

  const validateQuestion = (question: QuestionDTO) => {
    if (!question.questionText.trim()) return "Nội dung câu hỏi không được để trống";
    if (question.questionType === "FILL_IN_THE_BLANK") {
      const correctAnswer = getFillBlankAnswerOption(question);
      if (!correctAnswer?.optionText.trim()) return "Đáp án đúng không được để trống";
    } else {
      const validOptions = question.options.filter((option) => option.optionText.trim());
      if (validOptions.length < 2) return "Câu trắc nghiệm cần ít nhất 2 đáp án";
      if (!validOptions.some((option) => option.isCorrect)) return "Cần chọn ít nhất 1 đáp án đúng";
    }
    return null;
  };

  const handleSaveActiveQuestion = async () => {
    if (!activeQuestion) return;
    const validationError = validateQuestion(activeQuestion);
    if (validationError) {
      Notify.warning(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const res = await quizService.updateQuestion(activeQuestion.id, toQuestionPayload(activeQuestion));
      if (res.success && res.data) {
        const updated = {
          ...res.data,
          options: res.data.options?.map((option) => ({ ...option, questionId: res.data.id })) ?? [],
        };
        setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        Notify.success("Đã lưu thay đổi câu hỏi");
      }
    } catch (e: any) {
      Notify.failure(e.message || "Không thể lưu câu hỏi");
    } finally {
      setIsSaving(false);
    }
  };

  const buildTestConfig = (): StartTestPayload | null => {
    if (questions.length === 0) {
      Notify.warning("Quiz Bank này chưa có câu hỏi để tạo test");
      return null;
    }
    if (selectionMode === "SELECTED" && selectedQuestionIds.length === 0) {
      Notify.warning("Hãy chọn ít nhất 1 câu hỏi trong danh sách");
      return null;
    }
    if (selectionMode === "RANDOM" && (randomCount <= 0 || randomCount > questions.length)) {
      Notify.warning(`Số câu ngẫu nhiên phải từ 1 đến ${questions.length}`);
      return null;
    }

    return {
      duration: timeLimit || 30,
      quizSelectionMode: selectionMode,
      questionIds: selectionMode === "SELECTED" ? selectedQuestionIds : undefined,
      randomCount: selectionMode === "RANDOM" ? randomCount : undefined,
      shuffleQuestions: selectionMode === "RANDOM",
      shuffleOptions: true,
    };
  };

  const handleStartTest = () => {
    const config = buildTestConfig();
    if (config) onStartTest(config);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        Đang tải Quiz Bank...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-10.5rem)] lg:h-[calc(100dvh-7.5rem)] min-h-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft size={18} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-display">Chi tiết Quiz Bank</h1>
            <p className="text-sm text-muted-foreground">Quản lý câu hỏi và cấu hình bài test</p>
          </div>
        </div>
        <button
          onClick={handleStartTest}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Play size={16} fill="currentColor" /> Bắt đầu làm ngay
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        <div className="w-full lg:w-1/2 flex flex-col surface-card p-5 rounded-2xl min-h-0 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">Danh sách câu hỏi ({questions.length})</h2>
            <button
              disabled={isSaving}
              onClick={handleAddNew}
              className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Plus size={14} /> Thêm câu hỏi
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            <AnimatePresence>
              {questions.map((question, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={question.id}
                  className={`border rounded-xl transition-all ${
                    activeQuestionId === question.id
                      ? "border-primary ring-1 ring-primary/20 bg-primary/5"
                      : selectedQuestionIds.includes(question.id)
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div
                    className="p-3 cursor-pointer flex items-start gap-3"
                    onClick={(event) => handleQuestionRowClick(question.id, event)}
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={selectedQuestionIds.includes(question.id)}
                      onClick={(event) => handleQuestionSelection(question.id, event)}
                      className={`size-5 rounded flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                        selectedQuestionIds.includes(question.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-transparent border-border hover:border-primary"
                      }`}
                      title="Chọn câu này cho chế độ SELECTED"
                    >
                      <Check size={13} strokeWidth={3} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        <span className="mr-1.5 text-xs text-muted-foreground">#{idx + 1}</span>
                        {question.questionText}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(question.id);
                        }}
                        className="size-7 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground transition-colors"
                      >
                        {expandedId === question.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(question.id);
                        }}
                        className="size-7 rounded-lg hover:bg-destructive/10 text-destructive grid place-items-center transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === question.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-border/50">
                          <div className="space-y-2 mt-2">
                            {question.options.map((opt, oIdx) => (
                              <div
                                key={opt.id ?? `${question.id}-${oIdx}`}
                                className={`flex items-center gap-2 p-2 rounded-lg text-sm border ${
                                  opt.isCorrect
                                    ? "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25"
                                    : "bg-muted/30 border-transparent text-muted-foreground"
                                }`}
                              >
                                <div
                                  className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    opt.isCorrect ? "bg-success text-white" : "bg-muted border border-border"
                                  }`}
                                >
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                <span className="flex-1">{opt.optionText}</span>
                                {opt.isCorrect && <Check size={14} className="text-success" />}
                              </div>
                            ))}
                          </div>
                          {question.explanation && (
                            <div className="mt-3 text-xs p-2.5 rounded-lg bg-muted text-muted-foreground italic border border-border/50">
                              Giải thích: {question.explanation}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
            {questions.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                Quiz Bank này chưa có câu hỏi nào.
              </div>
            )}
          </div>
        </div>

        <div className={`w-full lg:w-1/2 flex min-h-0 ${!activeQuestionId ? "flex-col md:flex-row gap-5" : "flex-col"}`}>
          {!activeQuestionId && (
            <>
              <div className="flex-1 surface-card p-5 rounded-2xl border border-border bg-card flex flex-col justify-between min-h-0">
                <div>
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
                    <RotateCcw size={15} className="text-primary" /> Chỉ số bài test
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                      <div className="text-xl font-display font-bold text-primary">{bestScore}/10</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Điểm cao nhất</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                      <div className="text-xl font-display font-bold text-foreground">{historyTotal}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Số lần đã làm</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 pb-1">
                      <span>Lịch sử gần đây</span>
                      <span>Điểm</span>
                    </div>
                    {history.length === 0 ? (
                      <div className="p-3 rounded-lg bg-card border border-border text-xs text-muted-foreground text-center">
                        Chưa có lượt làm bài nào.
                      </div>
                    ) : (
                      history.map((item) => (
                        <div key={item.id} className="flex items-center gap-1 rounded-lg bg-card border border-border text-xs">
                          <button
                            type="button"
                            onClick={() => handleViewHistory(item)}
                            className="flex-1 min-w-0 flex justify-between items-center gap-2 p-2 text-left hover:bg-muted/40 transition-colors rounded-l-lg"
                            title={item.status === "COMPLETED" ? "Xem kết quả chi tiết" : "Bài đang làm"}
                          >
                            <span className="font-medium truncate">
                              {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : item.title}
                            </span>
                            <span className="flex items-center gap-1.5 shrink-0">
                              {item.status === "COMPLETED" && <Eye size={12} className="text-muted-foreground" />}
                              <span className="font-bold text-success">{item.totalScore ?? "-"}/10</span>
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistory(item)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-r-lg"
                            title="Xóa lịch sử làm bài"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 surface-card p-5 rounded-2xl border border-border bg-card flex flex-col justify-between min-h-0">
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-sm">
                    <Settings2 size={15} className="text-primary" /> Tạo Bài Test
                  </h3>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Kiểu trích xuất
                    </label>
                    <select
                      value={selectionMode}
                      onChange={(e) => setSelectionMode(e.target.value as "ALL" | "SELECTED" | "RANDOM")}
                      className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all cursor-pointer text-xs"
                    >
                      <option value="ALL">Tất cả câu hỏi ({questions.length})</option>
                      <option value="RANDOM">Ngẫu nhiên</option>
                      <option value="SELECTED">Các câu đã chọn ({selectedQuestionIds.length})</option>
                    </select>
                  </div>
                  {selectionMode === "RANDOM" && (
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                        Số câu ngẫu nhiên
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={questions.length}
                        value={randomCount}
                        onChange={(e) => setRandomCount(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-xs"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Thời gian làm bài (Phút)
                    </label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        min={1}
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Number(e.target.value))}
                        className="w-full h-9 pl-8 pr-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    onClick={handleStartTest}
                    className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  >
                    <Play size={14} fill="currentColor" /> Tạo Test & Bắt Đầu
                  </button>
                </div>
              </div>
            </>
          )}

          {activeQuestionId && activeQuestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="surface-card p-4 rounded-2xl flex-1 min-h-0 overflow-hidden flex flex-col border border-border bg-card"
            >
              <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                <h3 className="font-bold flex items-center gap-2 text-base">
                  <Edit size={16} className="text-primary" /> Chi tiết câu hỏi
                </h3>
                <button
                  onClick={() => setActiveQuestionId(null)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 transition-colors"
                >
                  Đóng Form
                </button>
              </div>

              <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    Loại câu hỏi
                  </label>
                  <select
                    value={activeQuestion.questionType}
                    onChange={(e) => replaceQuestion(activeQuestion.id, { questionType: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all cursor-pointer text-xs"
                  >
                    <option value="SINGLE_CHOICE">Một đáp án đúng</option>
                    <option value="MULTIPLE_CHOICE">Nhiều đáp án đúng</option>
                    <option value="FILL_IN_THE_BLANK">Điền vào chỗ trống</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    Nội dung câu hỏi
                  </label>
                  <textarea
                    value={activeQuestion.questionText}
                    onChange={(e) => replaceQuestion(activeQuestion.id, { questionText: e.target.value })}
                    rows={2}
                    className="w-full min-h-[50px] p-2.5 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-xs resize-none"
                  />
                </div>

                {activeQuestion.questionType === "FILL_IN_THE_BLANK" && (
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Đáp án đúng
                    </label>
                    <input
                      type="text"
                      value={getFillBlankAnswerOption(activeQuestion)?.optionText ?? ""}
                      onChange={(e) => {
                        const currentAnswer = getFillBlankAnswerOption(activeQuestion);
                        replaceQuestion(activeQuestion.id, {
                          options: [
                            {
                              id: currentAnswer?.id,
                              questionId: activeQuestion.id,
                              optionText: e.target.value,
                              isCorrect: true,
                            },
                          ],
                        });
                      }}
                      placeholder="Nhập đáp án chuẩn để hệ thống chấm điểm"
                      className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-xs"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Đáp án này được lưu ẩn và không hiển thị trong lúc làm bài.
                    </p>
                  </div>
                )}

                {activeQuestion.questionType !== "FILL_IN_THE_BLANK" && (
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Các đáp án
                    </label>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {activeQuestion.options.map((opt, i) => (
                        <div
                          key={opt.id ?? `${activeQuestion.id}-${i}`}
                          className={`flex items-center gap-2 p-1.5 px-3 rounded-xl border transition-all ${
                            opt.isCorrect ? "border-success/40 bg-success/5" : "border-border bg-card hover:border-primary/20"
                          }`}
                        >
                          <button
                            className={`size-4.5 rounded-full shrink-0 flex items-center justify-center border transition-colors ${
                              opt.isCorrect
                                ? "bg-success border-success text-white"
                                : "bg-muted border-border hover:border-primary/50 text-transparent hover:text-primary/50"
                            }`}
                            onClick={() => {
                              const nextOptions =
                                activeQuestion.questionType === "SINGLE_CHOICE"
                                  ? activeQuestion.options.map((o, optionIndex) => ({ ...o, isCorrect: optionIndex === i }))
                                  : activeQuestion.options.map((o, optionIndex) =>
                                      optionIndex === i ? { ...o, isCorrect: !o.isCorrect } : o,
                                    );
                              replaceQuestion(activeQuestion.id, { options: nextOptions });
                            }}
                          >
                            <Check size={10} />
                          </button>
                          <input
                            type="text"
                            value={opt.optionText}
                            onChange={(e) => {
                              const nextOptions = activeQuestion.options.map((o, optionIndex) =>
                                optionIndex === i ? { ...o, optionText: e.target.value } : o,
                              );
                              replaceQuestion(activeQuestion.id, { options: nextOptions });
                            }}
                            className="flex-1 bg-transparent border-none outline-none text-xs py-1"
                          />
                          <button
                            onClick={() => {
                              const nextOptions = activeQuestion.options.filter((_, optionIndex) => optionIndex !== i);
                              replaceQuestion(activeQuestion.id, { options: nextOptions });
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                            title="Xóa đáp án"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const nextOptions = [
                            ...activeQuestion.options,
                            {
                              questionId: activeQuestion.id,
                              optionText: `Option ${String.fromCharCode(65 + activeQuestion.options.length)}`,
                              isCorrect: false,
                            },
                          ];
                          replaceQuestion(activeQuestion.id, { options: nextOptions });
                        }}
                        className="w-full p-2 border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 rounded-xl text-[11px] font-bold text-muted-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} /> Thêm đáp án
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    Giải thích (Tùy chọn)
                  </label>
                  <textarea
                    value={activeQuestion.explanation || ""}
                    onChange={(e) => replaceQuestion(activeQuestion.id, { explanation: e.target.value })}
                    rows={2}
                    className="w-full min-h-[46px] p-2.5 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-xs resize-none"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border bg-card flex justify-end gap-3 shrink-0">
                <button
                  disabled={isSaving}
                  onClick={handleSaveActiveQuestion}
                  className="h-9 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activeHistoryId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center"
            onClick={() => {
              setActiveHistoryId(null);
              setHistoryResult(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-card border border-border shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-border flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold">Kết quả bài test</h3>
                  {historyResult && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {historyResult.correctAnswers ?? 0}/{historyResult.totalQuestions ?? 0} câu đúng · {historyResult.totalScore ?? 0}/10 điểm
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveHistoryId(null);
                    setHistoryResult(null);
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Đóng"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto custom-scrollbar">
                {isHistoryLoading ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải kết quả...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyResult?.items?.map((item, index) => {
                      const selectedOption = item.options?.find((option) => option.id === item.selectedOptionId);
                      const correctAnswers = item.options
                        ?.filter((option) => option.isCorrect)
                        .map((option) => option.optionText)
                        .join(", ");

                      return (
                        <div
                          key={`${item.questionId}-${index}`}
                          className={`p-4 rounded-xl border ${
                            item.isCorrect ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold">
                              Câu {index + 1}: {item.questionText || `#${item.questionId}`}
                            </p>
                            <span className={`text-xs font-bold shrink-0 ${item.isCorrect ? "text-success" : "text-destructive"}`}>
                              {item.isCorrect ? "Đúng" : "Sai"}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <p>
                              Câu trả lời: {item.userAnswerText || selectedOption?.optionText || "Không trả lời"}
                            </p>
                            {!item.isCorrect && correctAnswers && <p>Đáp án đúng: {correctAnswers}</p>}
                            {item.explanation && <p>Giải thích: {item.explanation}</p>}
                          </div>
                        </div>
                      );
                    })}
                    {historyResult?.items?.length === 0 && (
                      <div className="py-10 text-center text-sm text-muted-foreground">Không có dữ liệu câu trả lời.</div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
