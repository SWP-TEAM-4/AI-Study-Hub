import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Edit, Trash2, Check, ChevronDown, ChevronUp, Play, Settings2, Clock, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { Notify } from "notiflix";

export interface OptionDTO {
  id: number;
  questionId: number;
  optionText: string;
  isCorrect?: boolean;
}

export interface QuestionDTO {
  id: number;
  quizId?: number;
  questionText: string;
  questionType: string;
  explanation?: string;
  options: OptionDTO[];
}

interface QuizBankDetailPageProps {
  quizId: number;
  onBack: () => void;
  onStartTest: () => void;
}

// Dữ liệu mock ban đầu
const initialMockQuestions: QuestionDTO[] = [
  {
    id: 1,
    questionText: "Web server phổ biến nhất cho Java web là gì?",
    questionType: "SINGLE_CHOICE",
    explanation: "Tomcat là web server/servlet container phổ biến nhất cho Java.",
    options: [
      { id: 101, questionId: 1, optionText: "Apache Tomcat", isCorrect: true },
      { id: 102, questionId: 1, optionText: "Nginx", isCorrect: false },
      { id: 103, questionId: 1, optionText: "IIS", isCorrect: false },
      { id: 104, questionId: 1, optionText: "Node.js", isCorrect: false }
    ]
  },
  {
    id: 2,
    questionText: "Phương thức HTTP nào dùng để lấy dữ liệu?",
    questionType: "SINGLE_CHOICE",
    explanation: "GET request chỉ yêu cầu lấy dữ liệu từ server mà không làm thay đổi state.",
    options: [
      { id: 201, questionId: 2, optionText: "POST", isCorrect: false },
      { id: 202, questionId: 2, optionText: "GET", isCorrect: true },
      { id: 203, questionId: 2, optionText: "PUT", isCorrect: false },
      { id: 204, questionId: 2, optionText: "DELETE", isCorrect: false }
    ]
  },
  {
    id: 3,
    questionText: "Mô hình MVC gồm các thành phần nào?",
    questionType: "SINGLE_CHOICE",
    explanation: "Model - View - Controller là kiến trúc thiết kế chuẩn cho ứng dụng web.",
    options: [
      { id: 301, questionId: 3, optionText: "Model - View - Controller", isCorrect: true },
      { id: 302, questionId: 3, optionText: "Main - View - Class", isCorrect: false },
      { id: 303, questionId: 3, optionText: "Module - View - Component", isCorrect: false },
      { id: 304, questionId: 3, optionText: "Micro - View - Core", isCorrect: false }
    ]
  }
];

export default function QuizBankDetailPage({ quizId, onBack, onStartTest }: QuizBankDetailPageProps) {
  const [questions, setQuestions] = useState<QuestionDTO[]>(initialMockQuestions);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  
  // Test Config State
  const [selectionMode, setSelectionMode] = useState("ALL");
  const [timeLimit, setTimeLimit] = useState(30);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSelectQuestion = (id: number) => {
    setActiveQuestionId(id);
    setExpandedId(id);
  };

  const handleDelete = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (activeQuestionId === id) setActiveQuestionId(null);
  };

  const handleAddNew = () => {
    const newId = Date.now();
    const newQ: QuestionDTO = {
      id: newId,
      questionText: "Câu hỏi mới...",
      questionType: "SINGLE_CHOICE",
      explanation: "",
      options: [
        { id: newId + 1, questionId: newId, optionText: "Option A", isCorrect: true },
        { id: newId + 2, questionId: newId, optionText: "Option B", isCorrect: false },
      ]
    };
    setQuestions([...questions, newQ]);
    setActiveQuestionId(newId);
    setExpandedId(newId);
  };

  const activeQuestion = questions.find(q => q.id === activeQuestionId);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
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
        <div className="flex gap-2">
          <button 
            onClick={onStartTest}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Play size={16} fill="currentColor" /> Bắt đầu làm ngay
          </button>
        </div>
      </div>

      {/* Main Content - Split Pane */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        
        {/* LETS COLUMN - QUESTION LIST */}
        <div className="w-full lg:w-1/2 flex flex-col surface-card p-5 rounded-2xl min-h-0 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              Danh sách câu hỏi ({questions.length})
            </h2>
            <button onClick={handleAddNew} className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 flex items-center gap-1.5 transition-colors">
              <Plus size={14} /> Thêm câu hỏi
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            <AnimatePresence>
              {questions.map((q, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={q.id} 
                  className={`border rounded-xl transition-all ${activeQuestionId === q.id ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border bg-card hover:border-primary/40'}`}
                >
                  <div 
                    className="p-3 cursor-pointer flex items-start gap-3"
                    onClick={() => handleSelectQuestion(q.id)}
                  >
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-2">{q.questionText}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleExpand(q.id); }} 
                        className="size-7 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground transition-colors"
                      >
                        {expandedId === q.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }} 
                        className="size-7 rounded-lg hover:bg-destructive/10 text-destructive grid place-items-center transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Options Accordion */}
                  <AnimatePresence>
                    {expandedId === q.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-border/50">
                          <div className="space-y-2 mt-2">
                            {q.options.map((opt, oIdx) => (
                              <div key={opt.id} className={`flex items-center gap-2 p-2 rounded-lg text-sm border ${opt.isCorrect ? "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25" : 'bg-muted/30 border-transparent text-muted-foreground'}`}>
                                <div className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${opt.isCorrect ? 'bg-success text-white' : 'bg-muted border border-border'}`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                <span className="flex-1">{opt.optionText}</span>
                                {opt.isCorrect && <Check size={14} className="text-success" />}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <div className="mt-3 text-xs p-2.5 rounded-lg bg-muted text-muted-foreground italic border border-border/50">
                              Giải thích: {q.explanation}
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

        {/* RIGHT COLUMN - CONFIG & PREVIEW */}
        <div className={`w-full lg:w-1/2 flex min-h-0 ${!activeQuestionId ? 'flex-col md:flex-row gap-5' : 'flex-col'}`}>
          
          {/* STATS & CONFIG BLOCK */}
          {!activeQuestionId && (
            <>
              {/* Thống kê lịch sử */}
              <div className="flex-1 surface-card p-5 rounded-2xl border border-border bg-card flex flex-col justify-between min-h-0">
                <div>
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-sm"><RotateCcw size={15} className="text-primary"/> Chỉ số bài test</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                      <div className="text-xl font-display font-bold text-primary">85/100</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Điểm cao nhất</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                      <div className="text-xl font-display font-bold text-foreground">3</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Số lần đã làm</div>
                    </div>
                  </div>
                  {/* Lịch sử */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 pb-1">
                      <span>Lịch sử gần đây</span>
                      <span>Điểm</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-card border border-border text-xs">
                      <span className="font-medium">Hôm qua, 14:30</span>
                      <span className="font-bold text-success">85/100</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-card border border-border text-xs">
                      <span className="font-medium">12/06/2026</span>
                      <span className="font-bold text-muted-foreground">60/100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lựa chọn trích xuất Quiz & Cấu hình */}
              <div className="flex-1 surface-card p-5 rounded-2xl border border-border bg-card flex flex-col justify-between min-h-0">
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-sm"><Settings2 size={15} className="text-primary"/> Tạo Bài Test</h3>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Kiểu trích xuất</label>
                    <select 
                      value={selectionMode}
                      onChange={e => setSelectionMode(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all cursor-pointer text-xs"
                    >
                      <option value="ALL">Tất cả câu hỏi ({questions.length})</option>
                      <option value="RANDOM">Ngẫu nhiên (Trộn câu hỏi)</option>
                      <option value="MISSED">Chỉ ôn lại các câu đã sai</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Thời gian làm bài (Phút)</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input 
                        type="number"
                        value={timeLimit}
                        onChange={e => setTimeLimit(Number(e.target.value))}
                        className="w-full h-9 pl-8 pr-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <button onClick={onStartTest} className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer">
                    <Play size={14} fill="currentColor" /> Tạo Test & Bắt Đầu
                  </button>
                </div>
              </div>
            </>
          )}

          {/* PREVIEW / EDIT QUESTION FORM */}
          {activeQuestionId && activeQuestion && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="surface-card p-4 rounded-2xl flex-1 flex flex-col border border-border bg-card"
            >
              <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                <h3 className="font-bold flex items-center gap-2 text-base">
                  <Edit size={16} className="text-primary"/> Chi tiết câu hỏi
                </h3>
                <button onClick={() => setActiveQuestionId(null)} className="text-xs px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 transition-colors">
                  Đóng Form
                </button>
              </div>
              
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Nội dung câu hỏi</label>
                  <textarea 
                    value={activeQuestion.questionText}
                    onChange={(e) => {
                      const updated = questions.map(q => q.id === activeQuestion.id ? { ...q, questionText: e.target.value } : q);
                      setQuestions(updated);
                    }}
                    rows={2}
                    className="w-full min-h-[50px] p-2.5 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-xs resize-none"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Các đáp án</label>
                  </div>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {activeQuestion.options.map((opt, i) => (
                      <div key={opt.id} className={`flex items-center gap-2 p-1.5 px-3 rounded-xl border transition-all ${opt.isCorrect ? 'border-success/40 bg-success/5' : 'border-border bg-card hover:border-primary/20'}`}>
                        <button 
                          className={`size-4.5 rounded-full shrink-0 flex items-center justify-center border transition-colors ${opt.isCorrect ? 'bg-success border-success text-white' : 'bg-muted border-border hover:border-primary/50 text-transparent hover:text-primary/50'}`}
                          onClick={() => {
                            const newOpts = activeQuestion.options.map(o => ({ ...o, isCorrect: o.id === opt.id }));
                            const updated = questions.map(q => q.id === activeQuestion.id ? { ...q, options: newOpts } : q);
                            setQuestions(updated);
                          }}
                        >
                          <Check size={10} />
                        </button>
                        <input 
                          type="text"
                          value={opt.optionText}
                          onChange={(e) => {
                            const newOpts = activeQuestion.options.map(o => o.id === opt.id ? { ...o, optionText: e.target.value } : o);
                            const updated = questions.map(q => q.id === activeQuestion.id ? { ...q, options: newOpts } : q);
                            setQuestions(updated);
                          }}
                          className="flex-1 bg-transparent border-none outline-none text-xs py-1"
                        />
                        <button 
                          onClick={() => {
                            const newOpts = activeQuestion.options.filter(o => o.id !== opt.id);
                            const updated = questions.map(q => q.id === activeQuestion.id ? { ...q, options: newOpts } : q);
                            setQuestions(updated);
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
                        const newOpt = {
                          id: Date.now(),
                          questionId: activeQuestion.id,
                          optionText: `Option ${String.fromCharCode(65 + activeQuestion.options.length)}`,
                          isCorrect: false
                        };
                        const newOpts = [...activeQuestion.options, newOpt];
                        const updated = questions.map(q => q.id === activeQuestion.id ? { ...q, options: newOpts } : q);
                        setQuestions(updated);
                      }}
                      className="w-full p-2 border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 rounded-xl text-[11px] font-bold text-muted-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={13} /> Thêm đáp án
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Giải thích (Tùy chọn)</label>
                  <textarea 
                    value={activeQuestion.explanation || ""}
                    onChange={(e) => {
                      const updated = questions.map(q => q.id === activeQuestion.id ? { ...q, explanation: e.target.value } : q);
                      setQuestions(updated);
                    }}
                    placeholder="Nhập giải thích cho đáp án đúng..."
                    rows={2}
                    className="w-full min-h-[46px] p-2.5 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-xs resize-none"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex justify-end gap-3 shrink-0">
                <button onClick={() => Notify.success("Đã lưu thay đổi câu hỏi!")} className="h-9 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:opacity-90 transition-opacity">
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
