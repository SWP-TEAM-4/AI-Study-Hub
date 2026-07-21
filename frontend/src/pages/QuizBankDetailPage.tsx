import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Confirm, Notify } from "notiflix";
import { QuestionDTO, QuestionPayload, quizService, StartTestPayload, UserTestHistoryDTO } from "../services/quizService";

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

const toQuestionPayload = (question: QuestionDTO): QuestionPayload => ({
  questionText: question.questionText.trim(),
  questionType: question.questionType,
  explanation: question.explanation?.trim() || "",
  options:
    question.questionType === "FILL_IN_THE_BLANK"
      ? []
      : question.options.map((option) => ({
          id: option.id,
          optionText: option.optionText.trim(),
          isCorrect: Boolean(option.isCorrect),
        })),
});

export default function QuizBankDetailPage({ quizId, onBack, onStartTest }: QuizBankDetailPageProps) {
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [history, setHistory] = useState<UserTestHistoryDTO[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectionMode, setSelectionMode] = useState<"ALL" | "SELECTED" | "RANDOM">("ALL");
  const [timeLimit, setTimeLimit] = useState(30);
  const [randomCount, setRandomCount] = useState(5);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

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
      if (historyRes.success) setHistory(historyRes.data.items);
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

  const toggleSelectedForTest = (id: number) => {
    setSelectedQuestionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
          setSelectedQuestionIds((prev) => prev.filter((x) => x !== id));
          if (activeQuestionId === id) setActiveQuestionId(null);
          Notify.success("Đã xóa câu hỏi");
        } catch (e: any) {
          Notify.failure(e.message || "Không thể xóa câu hỏi");
        }
      },
    );
  };

  const validateQuestion = (question: QuestionDTO) => {
    if (!question.questionText.trim()) return "Nội dung câu hỏi không được để trống";
    if (question.questionType !== "FILL_IN_THE_BLANK") {
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
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
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
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="p-3 cursor-pointer flex items-start gap-3" onClick={() => handleSelectQuestion(question.id)}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectedForTest(question.id);
                      }}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
                        selectedQuestionIds.includes(question.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                      title="Chọn câu này cho chế độ SELECTED"
                    >
                      {idx + 1}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-2">{question.questionText}</p>
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
                      <div className="text-xl font-display font-bold text-foreground">{history.length}</div>
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
                        <div key={item.id} className="flex justify-between items-center p-2 rounded-lg bg-card border border-border text-xs">
                          <span className="font-medium">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : item.title}
                          </span>
                          <span className="font-bold text-success">{item.totalScore ?? "-"}/10</span>
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
              className="surface-card p-4 rounded-2xl flex-1 flex flex-col border border-border bg-card"
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

              <div className="space-y-4 flex-1">
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

              <div className="mt-4 pt-3 border-t border-border flex justify-end gap-3 shrink-0">
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
    </div>
  );
}
