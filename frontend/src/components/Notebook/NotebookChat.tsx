import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, BookOpen, Bot, Check, ChevronRight, CircleStop, FileText,
  GraduationCap, Layers3, Loader2, MessageSquare, Plus, Send, Sparkles,
  Trash2, X,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import { Notify } from "notiflix";
import {
  ChatSessionDTO, MessageDTO, PracticeDraftDTO, PracticeImportRequest,
  RelatedDeckDTO, RelatedQuizDTO, SendMessageRequest, chatService,
} from "../../services/chatService";

type ChatMode = "ask" | "quiz" | "flashcard";

interface NotebookChatProps {
  notebookId: number;
  notebookTitle?: string;
  notebookSubjectCode?: string;
  notebookSubjectId?: number;
  onBack?: () => void;
  onRenameClick?: () => void;
  onShareClick?: () => void;
  onDocumentClick?: (doc: any) => void;
  onAttachDocumentClick?: () => void;
  onDetachDocument?: (documentId: number) => void;
  detachingDocumentId?: number | null;
  documentsLoading?: boolean;
  documents?: any[];
  quizzes?: any[];
  decks?: any[];
}

export interface NotebookChatRef { sendMessage: (text: string) => void; }

const modeInfo = {
  ask: {
    label: "Hỏi AI", icon: MessageSquare,
    title: "Hỏi đáp theo ngữ cảnh notebook",
    description: "AI trả lời dựa trên tài liệu đã gắn và dẫn lại nguồn sử dụng.",
    suggestions: ["Tóm tắt các tài liệu trong notebook", "Giải thích các khái niệm quan trọng", "Lập đề cương ôn tập theo từng chương"],
  },
  quiz: {
    label: "Tạo Quiz", icon: GraduationCap,
    title: "Chế độ AI Quiz Draft",
    description: "Nhập mục tiêu ôn tập, AI sẽ tạo bản demo câu hỏi để bạn xem trước rồi import vào hệ thống.",
    suggestions: ["Tạo quiz kiểm tra nhanh kiến thức cốt lõi", "Sinh câu hỏi tăng dần từ dễ đến khó", "Tập trung vào các khái niệm dễ nhầm lẫn"],
  },
  flashcard: {
    label: "Tạo Flashcard", icon: BookOpen,
    title: "Chế độ AI Flashcard Draft",
    description: "AI tạo bộ thẻ hỏi–đáp từ tài liệu; bạn có thể xem demo và import thành deck thật.",
    suggestions: ["Tạo flashcard thuật ngữ quan trọng", "Tạo thẻ ghi nhớ định nghĩa và ví dụ", "Tạo bộ thẻ ôn tập nhanh trước kỳ thi"],
  },
} as const;

function dateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function messageTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat("vi-VN", sameDay
    ? { hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
  ).format(date);
}

function DraftSummary({ message, onPreview }: { message: MessageDTO; onPreview: () => void }) {
  const payload = message.generatedPayload;
  if (!payload) return null;
  const isQuiz = payload.type === "QUIZ";
  const count = isQuiz ? payload.questions.length : payload.cards.length;
  return (
    <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/[0.04] overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
          {isQuiz ? <GraduationCap size={18} /> : <BookOpen size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm truncate">{payload.title}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${message.practiceStatus === "IMPORTED" ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"}`}>
              {message.practiceStatus === "IMPORTED" ? "ĐÃ IMPORT" : `${count} ${isQuiz ? "CÂU" : "THẺ"}`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{payload.description || message.content}</p>
        </div>
      </div>
      <button onClick={onPreview} className="w-full h-10 border-t border-primary/15 text-xs font-semibold text-primary hover:bg-primary/5 flex items-center justify-center gap-1.5">
        {message.practiceStatus === "IMPORTED" ? "Xem bản đã import" : "Xem bản demo và import"} <ChevronRight size={14} />
      </button>
    </div>
  );
}

const NotebookChat = forwardRef<NotebookChatRef, NotebookChatProps>(({
  notebookId, notebookTitle = "Notebook AI Workspace", notebookSubjectCode = "—", notebookSubjectId,
  onBack, onRenameClick, onDocumentClick, onAttachDocumentClick, onDetachDocument,
  detachingDocumentId = null, documentsLoading = false, documents = [],
}, ref) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSessionDTO[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [mode, setMode] = useState<ChatMode>("ask");
  const [input, setInput] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [allDocuments, setAllDocuments] = useState(true);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [cardCount, setCardCount] = useState(10);
  const [questionType, setQuestionType] = useState<"SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE">("SINGLE_CHOICE");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [topK, setTopK] = useState(5);
  const [relatedQuizzes, setRelatedQuizzes] = useState<RelatedQuizDTO[]>([]);
  const [relatedDecks, setRelatedDecks] = useState<RelatedDeckDTO[]>([]);
  const [previewMessage, setPreviewMessage] = useState<MessageDTO | null>(null);
  const [previewDraft, setPreviewDraft] = useState<PracticeDraftDTO | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [targetMode, setTargetMode] = useState<"CREATE_NEW" | "APPEND_EXISTING">("CREATE_NEW");
  const [targetTitle, setTargetTitle] = useState("");
  const [targetId, setTargetId] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const currentMode = modeInfo[mode];
  const CurrentModeIcon = currentMode.icon;
  const draftMessages = useMemo(() => messages.filter((message) => message.practiceType), [messages]);

  const loadRelated = async () => {
    const [quizResult, deckResult] = await Promise.allSettled([
      chatService.getNotebookQuizzes(notebookId), chatService.getNotebookDecks(notebookId),
    ]);
    if (quizResult.status === "fulfilled") setRelatedQuizzes(quizResult.value);
    if (deckResult.status === "fulfilled") setRelatedDecks(deckResult.value);
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await chatService.getNotebookChatSessions(notebookId, 0, 50);
      const items = response.data?.items ?? [];
      setSessions(items);
      setActiveSessionId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id ?? null);
    } catch (error: any) {
      Notify.failure(error?.message || "Không thể tải phiên chat");
    } finally { setLoadingSessions(false); }
  };

  useEffect(() => { loadSessions(); loadRelated(); }, [notebookId]);

  useEffect(() => {
    if (!activeSessionId) { setMessages([]); return; }
    let active = true;
    setLoadingMessages(true);
    Promise.all([
      chatService.getChatSessionDetails(activeSessionId),
      chatService.getChatMessages(activeSessionId),
    ]).then(([sessionResponse, messageResponse]) => {
      if (!active) return;
      setSessions((items) => items.map((item) => item.id === activeSessionId ? sessionResponse.data : item));
      setMessages(messageResponse.data ?? []);
    }).catch((error) => active && Notify.failure(error?.message || "Không thể tải nội dung chat"))
      .finally(() => active && setLoadingMessages(false));
    return () => { active = false; };
  }, [activeSessionId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  const createSession = async (title = "Phiên chat mới") => {
    const response = await chatService.createChatSession(notebookId, title);
    setSessions((items) => [response.data, ...items]);
    setActiveSessionId(response.data.id);
    return response.data.id;
  };

  const deleteSession = async (sessionId: number) => {
    try {
      await chatService.deleteChatSession(sessionId);
      const remaining = sessions.filter((item) => item.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) setActiveSessionId(remaining[0]?.id ?? null);
      Notify.success("Đã xóa phiên chat");
    } catch (error: any) { Notify.failure(error?.message || "Không thể xóa phiên chat"); }
  };

  const buildRequest = (value: string, requestedMode: ChatMode): SendMessageRequest => {
    const documentIds = allDocuments ? undefined : selectedDocumentIds;
    if (requestedMode === "quiz") return {
      content: `[QUIZ] ${value}`, documentIds, topK, language: "vi",
      options: { numberOfQuestions: questionCount, questionType, difficulty },
    };
    if (requestedMode === "flashcard") return {
      content: `[FLASHCARD] ${value}`, documentIds, topK, language: "vi",
      options: { numberOfCards: cardCount, difficulty },
    };
    return { content: value, documentIds, topK, language: "vi" };
  };

  const send = async (text?: string, requestedMode: ChatMode = mode) => {
    const value = (text ?? input).trim();
    if (!value || thinking) return;
    if (!allDocuments && selectedDocumentIds.length === 0) {
      Notify.warning("Hãy chọn ít nhất một tài liệu làm ngữ cảnh");
      return;
    }
    setInput("");
    setThinking(true);
    try {
      let sessionId = activeSessionId;
      if (!sessionId) sessionId = await createSession(value.slice(0, 60));
      const controller = new AbortController();
      abortRef.current = controller;
      const response = await chatService.sendMessage(sessionId, buildRequest(value, requestedMode), controller.signal);
      setMessages((items) => [...items, response.data.userMessage, response.data.aiMessage]);
      if (response.data.aiMessage.practiceType) setMode(response.data.aiMessage.practiceType === "QUIZ" ? "quiz" : "flashcard");
    } catch (error: any) {
      if (error?.name !== "AbortError") Notify.failure(error?.message || "Không thể gửi tin nhắn");
    } finally { abortRef.current = null; setThinking(false); }
  };

  useImperativeHandle(ref, () => ({ sendMessage: (text) => send(text, "ask") }));

  const openPreview = async (message: MessageDTO) => {
    setPreviewMessage(message);
    setPreviewDraft(message.generatedPayload ?? null);
    setTargetMode("CREATE_NEW");
    setTargetId("");
    setTargetTitle(message.generatedPayload?.title || "");
    setPreviewLoading(true);
    try {
      const response = await chatService.previewPracticeDraft(message.id);
      setPreviewDraft(response.data);
      setTargetTitle(response.data.title);
    } catch (error: any) { Notify.failure(error?.message || "Không thể tải bản demo"); }
    finally { setPreviewLoading(false); }
  };

  const importDraft = async () => {
    if (!previewMessage || !previewDraft || previewMessage.practiceStatus === "IMPORTED") return;
    const isQuiz = previewDraft.type === "QUIZ";
    if (targetMode === "CREATE_NEW" && !targetTitle.trim()) return Notify.warning("Tên nội dung không được để trống");
    if (targetMode === "APPEND_EXISTING" && !targetId) return Notify.warning("Hãy chọn nội dung đích");
    const payload: PracticeImportRequest = targetMode === "CREATE_NEW" ? {
      targetMode,
      target: { title: targetTitle.trim(), description: previewDraft.description, notebookId, subjectId: notebookSubjectId, visibility: "PRIVATE" },
      importOptions: isQuiz ? { skipDuplicateQuestions: true, shuffleQuestions: false } : { skipDuplicateCards: true },
    } : {
      targetMode,
      target: isQuiz ? { quizId: Number(targetId) } : { deckId: Number(targetId) },
      importOptions: isQuiz ? { skipDuplicateQuestions: true, shuffleQuestions: false } : { skipDuplicateCards: true },
    };
    setImporting(true);
    try {
      const response = await chatService.importPracticeDraft(previewMessage.id, payload);
      setMessages((items) => items.map((item) => item.id === previewMessage.id ? {
        ...item, practiceStatus: "IMPORTED", importedTargetType: response.data.targetType,
        importedTargetId: response.data.targetId, importedAt: response.data.importedAt,
      } : item));
      setPreviewMessage((item) => item ? { ...item, practiceStatus: "IMPORTED" } : item);
      await loadRelated();
      Notify.success(isQuiz ? `Đã import ${response.data.createdQuestions} câu hỏi` : `Đã import ${response.data.createdCards} flashcard`);
    } catch (error: any) { Notify.failure(error?.message || "Import thất bại"); }
    finally { setImporting(false); }
  };

  const toggleDocument = (id: number) => {
    setAllDocuments(false);
    setSelectedDocumentIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] 2xl:grid-cols-[250px_minmax(0,1fr)_260px] gap-3 h-full min-h-0 bg-muted/20 p-3 overflow-hidden">
      <aside className="hidden lg:flex flex-col gap-3 min-h-0">
        <section className="surface-card rounded-2xl border border-border/60 p-4 max-h-[48%] flex flex-col min-h-0">
          <div className="flex items-start justify-between gap-2">
            <div><div className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">Ngữ cảnh</div><h3 className="font-semibold mt-1">Tài liệu notebook</h3></div>
            <button onClick={onAttachDocumentClick} className="h-8 px-2.5 rounded-xl border border-border text-[11px] font-semibold hover:border-primary"><Plus size={12} className="inline mr-1" />Gắn</button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">AI đang dùng {allDocuments ? "toàn bộ" : selectedDocumentIds.length} tài liệu.</p>
          <div className="flex gap-2 my-3">
            <button onClick={() => { setAllDocuments(true); setSelectedDocumentIds([]); }} className={`px-2.5 h-7 rounded-full text-[10px] font-bold ${allDocuments ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Toàn notebook</button>
            <button onClick={() => { setAllDocuments(false); setSelectedDocumentIds(documents.map((doc) => Number(doc.id))); }} className="px-2.5 h-7 rounded-full bg-muted text-[10px] font-bold">Chọn tất cả</button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {documentsLoading ? <div className="py-6 text-center text-xs text-muted-foreground">Đang tải...</div> : documents.map((doc) => {
              const selected = allDocuments || selectedDocumentIds.includes(Number(doc.id));
              return <div key={doc.id} className={`rounded-xl border p-2.5 ${selected ? "border-primary/30 bg-primary/[0.03]" : "border-border/50"}`}>
                <button onClick={() => onDocumentClick?.(doc)} className="w-full flex items-center gap-2 text-left">
                  <div className="size-8 rounded-lg bg-muted grid place-items-center text-[9px] font-bold uppercase">{doc.fileType}</div>
                  <div className="min-w-0 flex-1"><div className="text-xs font-semibold truncate">{doc.title}</div><div className="text-[10px] text-muted-foreground">{doc.processingStatus}</div></div>
                </button>
                <div className="flex justify-between mt-2 pt-2 border-t border-border/40">
                  <button onClick={() => toggleDocument(Number(doc.id))} className="text-[10px] text-primary font-semibold">{selected ? "Bỏ khỏi ngữ cảnh" : "Chọn"}</button>
                  <button onClick={() => onDetachDocument?.(Number(doc.id))} disabled={detachingDocumentId === Number(doc.id)} className="text-[10px] text-destructive disabled:opacity-50">Gỡ</button>
                </div>
              </div>;
            })}
          </div>
        </section>

        <section className="surface-card rounded-2xl border border-border/60 p-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between"><div><div className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">Phiên chat</div><h3 className="font-semibold mt-1">Lịch sử</h3></div><button onClick={() => createSession()} className="h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"><Plus size={13} className="inline mr-1" />Mới</button></div>
          <div className="mt-3 flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {loadingSessions ? <div className="py-6 text-center text-xs text-muted-foreground">Đang tải...</div> : sessions.length === 0 ? <div className="py-6 text-center text-xs text-muted-foreground">Chưa có phiên chat.</div> : sessions.map((session) => (
              <button key={session.id} onClick={() => setActiveSessionId(session.id)} className={`w-full p-3 rounded-xl border text-left group ${activeSessionId === session.id ? "border-primary bg-primary/[0.04]" : "border-border/50 hover:border-primary/30"}`}>
                <div className="flex items-center gap-2"><div className="text-xs font-semibold truncate flex-1">{session.title}</div><span onClick={(event) => { event.stopPropagation(); deleteSession(session.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></span></div>
                <div className="text-[10px] text-muted-foreground mt-1">{dateTime(session.createdAt)}</div>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <main className="surface-card rounded-2xl border border-border/60 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="h-20 shrink-0 px-4 md:px-5 border-b border-border/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="size-9 rounded-xl hover:bg-muted grid place-items-center"><ArrowLeft size={17} /></button>
            <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><Bot size={19} /></div>
            <div className="min-w-0"><button onClick={onRenameClick} className="font-bold truncate block max-w-full">{notebookTitle}</button><div className="text-xs text-muted-foreground">{notebookSubjectCode} · {sessions.length} phiên chat</div></div>
          </div>
          <div className="text-right hidden sm:block"><div className="text-[10px] text-muted-foreground">Chế độ hiện tại</div><div className="text-xs font-bold text-primary">{currentMode.label} · Top K {topK}</div></div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 min-h-0">
          {loadingMessages ? <div className="h-full grid place-items-center"><Loader2 className="animate-spin text-primary" /></div> : messages.length === 0 ? (
            <div className="h-full min-h-[360px] grid place-items-center">
              <div className="max-w-2xl w-full rounded-3xl border border-dashed border-border p-7 text-center bg-muted/[0.15]">
                <div className="size-14 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center"><CurrentModeIcon size={24} /></div>
                <h2 className="text-xl font-bold mt-4">{currentMode.title}</h2><p className="text-sm text-muted-foreground mt-2">{currentMode.description}</p>
                <div className="mt-5 flex flex-col items-center gap-2">{currentMode.suggestions.map((item) => <button key={item} onClick={() => setInput(item)} className="px-4 py-2 rounded-full border border-border text-xs hover:border-primary hover:text-primary">{item}</button>)}</div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <motion.div 
                  key={message.id} 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`flex ${message.senderRole === "USER" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[88%] ${message.senderRole === "USER" ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-3" : "w-full"}`}>
                    {message.senderRole === "AI" && (
                      <div className="flex items-center gap-2 text-xs font-bold mb-2">
                        <div className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
                          <Sparkles size={14} />
                        </div>
                        AI Study Hub
                      </div>
                    )}
                    <div className={`text-sm leading-6 prose prose-sm max-w-none dark:prose-invert ${message.senderRole === "USER" ? "text-primary-foreground" : ""}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                    
                    {/* Giờ chat thực */}
                    <div className={`text-[10px] mt-1.5 opacity-60 font-medium ${message.senderRole === "USER" ? "text-primary-foreground/80 text-right" : "text-muted-foreground"}`}>
                      {dateTime(message.createdAt)}
                    </div>

                    {message.senderRole === "AI" && message.citedSources?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{message.citedSources.map((source, index) => <button key={`${source.documentId}-${index}`} onClick={() => onDocumentClick?.(documents.find((doc) => Number(doc.id) === source.documentId))} className="px-2.5 py-1 rounded-full bg-muted text-[10px] text-muted-foreground hover:text-primary"><FileText size={10} className="inline mr-1" />{source.documentTitle}{source.sourcePage ? ` · tr.${source.sourcePage}` : ""}</button>)}</div>}
                    {message.senderRole === "AI" && message.generatedPayload && <DraftSummary message={message} onPreview={() => openPreview(message)} />}
                  </div>
                </motion.div>
              ))}
              {thinking && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex items-center gap-2 text-sm text-muted-foreground ml-2"
                >
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span>AI đang học bài và suy nghĩ...</span>
                </motion.div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border/50 p-3 md:p-4 bg-card">
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">{(Object.keys(modeInfo) as ChatMode[]).map((item) => { const Icon = modeInfo[item].icon; return <button key={item} onClick={() => setMode(item)} className={`h-10 px-3 rounded-xl border flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${mode === item ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}><Icon size={15} />{modeInfo[item].label}</button>; })}</div>
          {mode !== "ask" && <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <select value={mode === "quiz" ? questionCount : cardCount} onChange={(event) => mode === "quiz" ? setQuestionCount(Number(event.target.value)) : setCardCount(Number(event.target.value))} className="h-9 rounded-xl bg-muted/40 border border-border px-2 text-xs">{[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count} {mode === "quiz" ? "câu hỏi" : "thẻ"}</option>)}</select>
            {mode === "quiz" && <select value={questionType} onChange={(event) => setQuestionType(event.target.value as any)} className="h-9 rounded-xl bg-muted/40 border border-border px-2 text-xs"><option value="SINGLE_CHOICE">Một đáp án</option><option value="MULTIPLE_CHOICE">Nhiều đáp án</option><option value="TRUE_FALSE">Đúng / Sai</option></select>}
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as any)} className="h-9 rounded-xl bg-muted/40 border border-border px-2 text-xs"><option value="EASY">Dễ</option><option value="MEDIUM">Trung bình</option><option value="HARD">Khó</option></select>
            <select value={topK} onChange={(event) => setTopK(Number(event.target.value))} className="h-9 rounded-xl bg-muted/40 border border-border px-2 text-xs">{[3, 5, 8, 10].map((value) => <option key={value} value={value}>Top K {value}</option>)}</select>
          </div>}
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-primary">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={mode === "ask" ? "Hỏi AI về tài liệu trong notebook..." : `Mô tả chủ đề để AI tạo ${mode === "quiz" ? "quiz" : "flashcard"} draft...`} className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none min-h-9 max-h-24" rows={1} />
            {thinking ? <button onClick={() => abortRef.current?.abort()} className="size-10 rounded-xl bg-destructive text-destructive-foreground grid place-items-center"><CircleStop size={17} /></button> : <button onClick={() => send()} disabled={!input.trim()} className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center disabled:opacity-40"><Send size={17} /></button>}
          </div>
        </footer>
      </main>

      <aside className="hidden 2xl:flex flex-col gap-3 min-h-0 overflow-y-auto custom-scrollbar">
        <section className="surface-card rounded-2xl border border-border/60 p-4"><div className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">Bảng học tập</div><div className="grid grid-cols-2 gap-2 mt-3">{[["Tài liệu", documents.length], ["Phiên chat", sessions.length], ["Quiz", relatedQuizzes.length], ["Deck", relatedDecks.length]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border/50 p-3"><div className="text-[10px] text-muted-foreground uppercase">{label}</div><div className="text-xl font-bold mt-1">{value}</div></div>)}</div></section>
        <section className="surface-card rounded-2xl border border-border/60 p-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-sm flex items-center gap-2"><GraduationCap size={15} className="text-emerald-600" />Quiz liên quan</h3><button onClick={() => navigate("/quiz")} className="text-[11px] text-primary">Mở tab</button></div><div className="mt-3 space-y-2">{relatedQuizzes.length ? relatedQuizzes.slice(0, 4).map((quiz) => <div key={quiz.id} className="rounded-xl bg-muted/40 p-3 text-xs font-medium truncate">{quiz.title}</div>) : <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">Notebook chưa có quiz được gắn.</div>}</div></section>
        <section className="surface-card rounded-2xl border border-border/60 p-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-sm flex items-center gap-2"><BookOpen size={15} className="text-rose-500" />Bộ flashcard</h3><button onClick={() => navigate("/flashcards")} className="text-[11px] text-primary">Mở tab</button></div><div className="mt-3 space-y-2">{relatedDecks.length ? relatedDecks.slice(0, 4).map((deck) => <div key={deck.id} className="rounded-xl bg-muted/40 p-3"><div className="text-xs font-medium truncate">{deck.title}</div><div className="text-[10px] text-muted-foreground mt-1">{deck.cards?.length ?? 0} thẻ</div></div>) : <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">Notebook chưa có flashcard deck.</div>}</div></section>
        <section className="surface-card rounded-2xl border border-border/60 p-4"><h3 className="font-semibold text-sm flex items-center gap-2"><Layers3 size={15} className="text-primary" />Draft gần đây</h3><div className="mt-3 text-xs text-muted-foreground">{draftMessages.length ? `${draftMessages.length} bản demo trong phiên hiện tại` : "Chưa có draft nào."}</div></section>
      </aside>

      <AnimatePresence>
        {previewMessage && <div className="fixed inset-0 z-[100] grid place-items-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setPreviewMessage(null)} />
          <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }} className="relative surface-card w-full max-w-4xl max-h-[88vh] rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden">
            <header className="p-5 border-b border-border flex items-start justify-between gap-3"><div><div className="text-[10px] uppercase tracking-[.18em] font-bold text-primary">AI Practice Draft</div><h2 className="text-xl font-bold mt-1">{previewDraft?.title || "Đang tải bản demo..."}</h2><p className="text-xs text-muted-foreground mt-1">Kiểm tra nội dung trước khi import vào hệ thống.</p></div><button onClick={() => setPreviewMessage(null)} className="size-9 rounded-xl hover:bg-muted grid place-items-center"><X size={18} /></button></header>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
              {previewLoading || !previewDraft ? <div className="py-20 grid place-items-center"><Loader2 className="animate-spin text-primary" /></div> : previewDraft.type === "QUIZ" ? <div className="space-y-3">{previewDraft.questions.map((question, index) => <div key={index} className="rounded-2xl border border-border/60 p-4"><div className="font-semibold text-sm">{index + 1}. {question.questionText}</div><div className="grid sm:grid-cols-2 gap-2 mt-3">{question.options.map((option, optionIndex) => <div key={optionIndex} className={`rounded-xl border px-3 py-2 text-xs flex items-center gap-2 ${option.isCorrect ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700" : "border-border/50"}`}>{option.isCorrect && <Check size={13} />}{option.optionText}</div>)}</div>{question.explanation && <p className="text-xs text-muted-foreground mt-3">Giải thích: {question.explanation}</p>}</div>)}</div> : <div className="grid sm:grid-cols-2 gap-3">{previewDraft.cards.map((card, index) => <div key={index} className="rounded-2xl border border-border/60 p-4"><div className="text-[10px] font-bold text-primary uppercase">Mặt trước</div><div className="font-semibold text-sm mt-1">{card.frontText}</div><div className="border-t border-dashed border-border my-3" /><div className="text-[10px] font-bold text-muted-foreground uppercase">Mặt sau</div><div className="text-sm mt-1">{card.backText}</div></div>)}</div>}
            </div>
            {previewDraft && <footer className="p-4 border-t border-border bg-muted/20">
              {previewMessage.practiceStatus === "IMPORTED" ? <div className="flex items-center justify-between gap-3"><div className="text-sm text-emerald-600 font-semibold flex items-center gap-2"><Check size={17} />Đã import vào {previewMessage.importedTargetType} #{previewMessage.importedTargetId}</div><button onClick={() => navigate(previewDraft.type === "QUIZ" ? "/quiz" : "/flashcards")} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Mở nội dung</button></div> : <div className="flex flex-col md:flex-row gap-3 md:items-end">
                <label className="text-xs flex-1"><span className="block mb-1 text-muted-foreground">Cách import</span><select value={targetMode} onChange={(event) => { setTargetMode(event.target.value as any); setTargetId(""); }} className="w-full h-10 rounded-xl border border-border bg-background px-3"><option value="CREATE_NEW">Tạo mới</option><option value="APPEND_EXISTING">Thêm vào nội dung có sẵn</option></select></label>
                {targetMode === "CREATE_NEW" ? <label className="text-xs flex-[2]"><span className="block mb-1 text-muted-foreground">Tên nội dung</span><input value={targetTitle} onChange={(event) => setTargetTitle(event.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3" /></label> : <label className="text-xs flex-[2]"><span className="block mb-1 text-muted-foreground">Nội dung đích</span><select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-3"><option value="">Chọn...</option>{(previewDraft.type === "QUIZ" ? relatedQuizzes : relatedDecks).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
                <button onClick={importDraft} disabled={importing} className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">{importing ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}Import</button>
              </div>}
            </footer>}
          </motion.div>
        </div>}
      </AnimatePresence>
    </div>
  );
});

NotebookChat.displayName = "NotebookChat";
export default NotebookChat;