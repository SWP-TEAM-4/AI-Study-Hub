import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, BookOpen, Bot, Check, ChevronRight, CircleStop, Eye, FileText,
  GraduationCap, Layers3, Loader2, Lock, MessageSquare, Plus, Send, Share2, ShieldCheck, Sparkles,
  Trash2, X,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import { Notify } from "notiflix";
import {
  ChatSessionDTO, CitedSourceDTO, MessageDTO, PracticeDraftDTO, PracticeImportRequest,
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
  onDocumentClick?: (doc: any, source?: CitedSourceDTO) => void;
  onAttachDocumentClick?: () => void;
  onDetachDocument?: (documentId: number) => void;
  detachingDocumentId?: number | null;
  documentsLoading?: boolean;
  documents?: any[];
  quizzes?: any[];
  decks?: any[];
  compact?: boolean;
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

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="size-1.5 rounded-full bg-primary"
          animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.16, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

function ThinkingBubble({ allDocuments, selectedCount }: { allDocuments: boolean; selectedCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="flex items-start gap-3"
    >
      <div className="size-10 shrink-0 rounded-2xl bg-primary/10 text-primary grid place-items-center shadow-sm">
        <Bot size={19} />
      </div>
      <div className="max-w-[82%] rounded-2xl rounded-tl-md border border-primary/15 bg-card px-4 py-3.5 shadow-sm">
        <div className="flex items-center gap-2 text-[15px] font-bold text-foreground">
          AI đang phân tích tài liệu <TypingDots />
        </div>
        <div className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
          Đang đọc {allDocuments ? "toàn bộ notebook" : `${selectedCount} tài liệu đã chọn`} và chuẩn bị câu trả lời.
        </div>
      </div>
    </motion.div>
  );
}

const NotebookChat = forwardRef<NotebookChatRef, NotebookChatProps>(({
  notebookId, notebookTitle = "Notebook AI Workspace", notebookSubjectCode = "—", notebookSubjectId,
  onBack, onRenameClick, onShareClick, onDocumentClick, onAttachDocumentClick, onDetachDocument,
  detachingDocumentId = null, documentsLoading = false, documents = [], compact = false,
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
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendingSessionIdRef = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentMode = modeInfo[mode];
  const CurrentModeIcon = currentMode.icon;
  const draftMessages = useMemo(() => messages.filter((message) => message.practiceType), [messages]);
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  const loadRelated = async () => {
    const [quizResult, deckResult] = await Promise.allSettled([
      chatService.getNotebookQuizzes(notebookId), chatService.getNotebookDecks(notebookId),
    ]);
    if (quizResult.status === "fulfilled") {
      setRelatedQuizzes(quizResult.value);
    } else {
      console.warn("Failed to load notebook quizzes:", quizResult.reason);
    }
    if (deckResult.status === "fulfilled") {
      setRelatedDecks(deckResult.value);
    } else {
      console.warn("Failed to load notebook decks:", deckResult.reason);
    }
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
    if (sendingSessionIdRef.current === activeSessionId) {
      sendingSessionIdRef.current = null;
      setLoadingMessages(false);
      return;
    }
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

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 150)}px`;
  }, [input]);

  useEffect(() => () => {
    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    abortRef.current?.abort();
  }, []);

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

  const applySessionUpdate = (updated: ChatSessionDTO) => {
    setSessions((items) => items.map((item) => item.id === updated.id ? updated : item));
  };

  const updateActiveSessionAccess = async (payload: { isPrivate?: boolean; adminAccessAllowed?: boolean; adminReportReason?: string }) => {
    if (!activeSessionId) {
      Notify.warning("Hãy chọn một phiên chat trước.");
      return;
    }
    try {
      const response = await chatService.updateChatSessionAccess(activeSessionId, payload);
      applySessionUpdate(response.data);
      Notify.success("Đã cập nhật quyền phiên chat");
    } catch (error: any) {
      Notify.failure(error?.message || "Không thể cập nhật quyền phiên chat");
    }
  };

  const toggleActiveSessionPrivate = () => {
    if (!activeSession) return;
    updateActiveSessionAccess({ isPrivate: !Boolean(activeSession.isPrivate) });
  };

  const toggleActiveSessionAdminAccess = () => {
    if (!activeSession) return;
    if (activeSession.isPrivate) {
      Notify.warning("Phiên private chỉ cho admin xem khi bạn report phiên này.");
      return;
    }
    updateActiveSessionAccess({ adminAccessAllowed: !Boolean(activeSession.adminAccessAllowed) });
  };

  const reportActiveSession = async () => {
    if (!activeSessionId) {
      Notify.warning("Hãy chọn một phiên chat trước.");
      return;
    }
    const reason = window.prompt("Nhập ghi chú report phiên chat cho admin kiểm tra:");
    if (!reason?.trim()) return;
    try {
      const response = await chatService.reportChatSession(activeSessionId, reason.trim());
      applySessionUpdate(response.data);
      Notify.success("Đã gửi report phiên chat tới admin");
    } catch (error: any) {
      Notify.failure(error?.message || "Không thể report phiên chat");
    }
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
    let tempUserMessageId: number | null = null;
    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const sessionResponse = await chatService.createChatSession(notebookId, value.slice(0, 60) || "Phiên chat mới");
        sessionId = sessionResponse.data.id;
        sendingSessionIdRef.current = sessionId;
        setSessions((items) => [sessionResponse.data, ...items]);
        setActiveSessionId(sessionId);
      }

      const pendingUserMessage: MessageDTO = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sessionId,
        messageSequence: messages.length + 1,
        senderRole: "USER",
        content: value,
        citedSources: [],
        createdAt: new Date().toISOString(),
      };
      tempUserMessageId = pendingUserMessage.id;
      setMessages((items) => [...items, pendingUserMessage]);

      const controller = new AbortController();
      abortRef.current = controller;
      const response = await chatService.sendMessage(sessionId, buildRequest(value, requestedMode), controller.signal);

      const aiMessage = response.data.aiMessage;
      const fullContent = aiMessage.content ?? "";
      setMessages((items) => [
        ...items.filter((item) => item.id !== tempUserMessageId),
        response.data.userMessage,
        { ...aiMessage, content: "" },
      ]);

      if (!fullContent) {
        setMessages((items) => items.map((item) => item.id === aiMessage.id ? aiMessage : item));
        setThinking(false);
      } else {
        let currentLength = 0;
        let isCancelled = false;
        typewriterTimerRef.current = setInterval(() => {
          if (abortRef.current?.signal.aborted || isCancelled) {
            if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
            typewriterTimerRef.current = null;
            return;
          }
          currentLength += Math.max(1, Math.ceil(fullContent.length / 180));
          if (currentLength >= fullContent.length) {
            if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
            typewriterTimerRef.current = null;
            setMessages((items) => items.map((item) => item.id === aiMessage.id ? aiMessage : item));
            setThinking(false);
            return;
          }
          setMessages((items) => items.map((item) => item.id === aiMessage.id
            ? { ...item, content: fullContent.substring(0, currentLength) }
            : item));
        }, 14);

        controller.signal.addEventListener("abort", () => {
          isCancelled = true;
        }, { once: true });
      }

      if (response.data.aiMessage.practiceType) setMode(response.data.aiMessage.practiceType === "QUIZ" ? "quiz" : "flashcard");
    } catch (error: any) {
      setThinking(false);
      if (error?.name !== "AbortError") {
        Notify.failure(error?.message || "Không thể gửi tin nhắn");
        if (tempUserMessageId !== null) {
          setMessages((items) => items.filter((item) => item.id !== tempUserMessageId));
        }
      }
    } finally { abortRef.current = null; }
  };

  const stopGenerating = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    setThinking(false);
    Notify.info("Đã dừng tạo phản hồi.");
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

  const openCitedSource = (source: CitedSourceDTO) => {
    const document = documents.find((doc) => Number(doc.id) === Number(source.documentId));
    if (!document) {
      Notify.warning("Không tìm thấy tài liệu nguồn trong notebook này.");
      return;
    }
    onDocumentClick?.(document, source);
  };

  return (
    <div className={`grid grid-cols-1 ${compact ? "" : "lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_280px]"} gap-4 h-full min-h-0 bg-background p-3 md:p-4 overflow-hidden font-sans text-[15px]`}>
      <aside className={`${compact ? "hidden" : "hidden lg:flex"} flex-col gap-3 min-h-0`}>
        <section className="surface-card rounded-2xl border border-border/60 p-4 max-h-[48%] flex flex-col min-h-0 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div><div className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary">Ngữ cảnh</div><h3 className="font-bold mt-1 text-base">Tài liệu notebook</h3></div>
            <button onClick={onAttachDocumentClick} className="h-9 px-3 rounded-xl border border-border text-xs font-bold hover:border-primary hover:text-primary transition-colors"><Plus size={13} className="inline mr-1" />Gắn</button>
          </div>
          <p className="text-[13px] leading-5 text-muted-foreground mt-2">AI đang dùng {allDocuments ? "toàn bộ" : selectedDocumentIds.length} tài liệu.</p>
          <div className="flex gap-2 my-3">
            <button onClick={() => { setAllDocuments(true); setSelectedDocumentIds([]); }} className={`px-3 h-8 rounded-full text-xs font-bold transition-colors ${allDocuments ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted hover:bg-muted/80"}`}>Toàn notebook</button>
            <button onClick={() => { setAllDocuments(false); setSelectedDocumentIds(documents.map((doc) => Number(doc.id))); }} className="px-3 h-8 rounded-full bg-muted text-xs font-bold hover:bg-muted/80 transition-colors">Chọn tất cả</button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {documentsLoading ? <div className="py-6 text-center text-sm text-muted-foreground">Đang tải...</div> : documents.map((doc) => {
              const selected = allDocuments || selectedDocumentIds.includes(Number(doc.id));
              return <div key={doc.id} className={`rounded-xl border p-3 transition-colors ${selected ? "border-primary/30 bg-primary/[0.04] shadow-sm" : "border-border/50 hover:border-primary/20"}`}>
                <button onClick={() => onDocumentClick?.(doc)} className="w-full flex items-center gap-2 text-left">
                  <div className="size-8 rounded-lg bg-muted grid place-items-center text-[9px] font-bold uppercase">{doc.fileType}</div>
                  <div className="min-w-0 flex-1"><div className="text-sm font-bold truncate">{doc.title}</div><div className="text-[11px] text-muted-foreground mt-0.5">{doc.processingStatus}</div></div>
                </button>
                <div className="flex justify-between mt-2 pt-2 border-t border-border/40">
                  <button onClick={() => toggleDocument(Number(doc.id))} className="text-[10px] text-primary font-semibold">{selected ? "Bỏ khỏi ngữ cảnh" : "Chọn"}</button>
                  <button onClick={() => onDetachDocument?.(Number(doc.id))} disabled={detachingDocumentId === Number(doc.id)} className="text-[10px] text-destructive disabled:opacity-50">Gỡ</button>
                </div>
              </div>;
            })}
          </div>
        </section>

        <section className="surface-card rounded-2xl border border-border/60 p-4 flex-1 flex flex-col min-h-0 shadow-sm">
          <div className="flex items-center justify-between"><div><div className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary">Phiên chat</div><h3 className="font-bold mt-1 text-base">Lịch sử</h3></div><button onClick={() => createSession()} className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:brightness-110 transition-all"><Plus size={13} className="inline mr-1" />Mới</button></div>
          {activeSession && (
            <div className="mt-3 rounded-2xl border border-border/60 bg-muted/[0.18] p-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={toggleActiveSessionPrivate}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-bold transition-colors ${
                    activeSession.isPrivate
                      ? "border-amber-500/25 bg-amber-500/10 text-amber-700"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  <Lock size={12} />{activeSession.isPrivate ? "Private" : "Không private"}
                </button>
                <button
                  onClick={toggleActiveSessionAdminAccess}
                  disabled={Boolean(activeSession.isPrivate)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                    activeSession.adminAccessAllowed && !activeSession.isPrivate
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  <Eye size={12} />Admin xem
                </button>
                <button
                  onClick={reportActiveSession}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-bold transition-colors ${
                    activeSession.reportedToAdmin
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  <AlertTriangle size={12} />{activeSession.reportedToAdmin ? "Đã report" : "Report"}
                </button>
              </div>
              {activeSession.adminReportReason && (
                <div className="mt-2 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                  Ghi chú: {activeSession.adminReportReason}
                </div>
              )}
            </div>
          )}
          <div className="mt-3 flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {loadingSessions ? <div className="py-6 text-center text-sm text-muted-foreground">Đang tải...</div> : sessions.length === 0 ? <div className="py-6 text-center text-sm text-muted-foreground">Chưa có phiên chat.</div> : sessions.map((session) => (
              <button key={session.id} onClick={() => setActiveSessionId(session.id)} className={`w-full p-3.5 rounded-xl border text-left group transition-all ${activeSessionId === session.id ? "border-primary bg-primary/[0.05] shadow-sm" : "border-border/50 hover:border-primary/30 hover:bg-muted/20"}`}>
                <div className="flex items-center gap-2"><div className="text-sm font-bold truncate flex-1">{session.title}</div><span onClick={(event) => { event.stopPropagation(); deleteSession(session.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 size={14} /></span></div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {session.isPrivate && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-700"><Lock size={9} />Private</span>}
                  {session.adminAccessAllowed && !session.isPrivate && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700"><ShieldCheck size={9} />Admin</span>}
                  {session.reportedToAdmin && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary"><AlertTriangle size={9} />Report</span>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{dateTime(session.createdAt)}</div>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <main className="surface-card rounded-2xl border border-border/60 flex flex-col min-w-0 min-h-0 overflow-hidden shadow-sm">
        <header className="min-h-[88px] shrink-0 px-4 md:px-6 border-b border-border/50 flex items-center justify-between gap-3 bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="size-10 rounded-xl hover:bg-muted grid place-items-center transition-colors" title="Quay lại notebook"><ArrowLeft size={18} /></button>
            <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center shadow-inner"><Bot size={22} /></div>
            <div className="min-w-0">
              <button onClick={onRenameClick} className="font-extrabold text-lg md:text-xl truncate block max-w-full hover:text-primary transition-colors text-left">{notebookTitle}</button>
              <div className="text-[13px] text-muted-foreground mt-0.5">{notebookSubjectCode} · {sessions.length} phiên chat · {documents.length} tài liệu</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="text-right px-3">
              <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Chế độ hiện tại</div>
              <div className="text-sm font-extrabold text-primary mt-0.5">{currentMode.label} · Top K {topK}</div>
            </div>
            {onShareClick && (
              <button onClick={onShareClick} className="size-10 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/40 grid place-items-center transition-colors" title="Chia sẻ tài liệu">
                <Share2 size={17} />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 min-h-0 bg-muted/[0.12]">
          {loadingMessages ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className={`flex items-start gap-3 ${item % 2 ? "" : "flex-row-reverse"}`}>
                  <div className="size-10 rounded-2xl bg-muted animate-pulse shrink-0" />
                  <div className="h-20 w-[68%] rounded-2xl bg-muted/60 animate-pulse border border-border/30" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 && !thinking ? (
            <div className="h-full min-h-[380px] grid place-items-center">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                className="max-w-2xl w-full rounded-3xl border border-border/60 p-7 text-center bg-card shadow-sm"
              >
                <div className="size-16 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center shadow-inner"><CurrentModeIcon size={28} /></div>
                <h2 className="text-2xl font-extrabold mt-5 tracking-tight">{currentMode.title}</h2>
                <p className="text-[15px] leading-7 text-muted-foreground mt-2">{currentMode.description}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  {currentMode.suggestions.map((item) => (
                    <button
                      key={item}
                      onClick={() => setInput(item)}
                      className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-bold hover:border-primary/40 hover:text-primary hover:bg-primary/[0.03] transition-all"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((message) => {
                  const isUser = message.senderRole === "USER";
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      layout
                      transition={{ type: "spring", stiffness: 260, damping: 24 }}
                      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                    >
                      {!isUser && (
                        <div className="size-10 shrink-0 rounded-2xl bg-primary/10 text-primary grid place-items-center shadow-sm mt-0.5">
                          <Sparkles size={18} />
                        </div>
                      )}
                      <div className={`flex flex-col gap-1.5 ${isUser ? "items-end max-w-[78%]" : "items-start max-w-[82%]"}`}>
                        {!isUser && <div className="text-xs font-extrabold text-primary ml-1">AI Study Hub</div>}
                        <div className={`rounded-2xl px-4 py-3.5 shadow-sm ${
                          isUser
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-tl-md bg-card border border-border/70 text-foreground"
                        }`}>
                          {isUser ? (
                            <p className="whitespace-pre-wrap text-[15px] leading-7 font-semibold">{message.content}</p>
                          ) : message.content.trim() ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert text-[15px] leading-7 [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                              Đang soạn phản hồi <TypingDots />
                            </div>
                          )}
                          {message.senderRole === "AI" && message.generatedPayload && <DraftSummary message={message} onPreview={() => openPreview(message)} />}
                        </div>
                        <div className={`text-[11px] px-1 font-semibold ${isUser ? "text-muted-foreground" : "text-muted-foreground"}`}>
                          {messageTime(message.createdAt)}
                        </div>
                        {message.senderRole === "AI" && message.citedSources?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {message.citedSources.map((source, index) => (
                              <button
                                key={`${source.documentId}-${index}`}
                                onClick={() => openCitedSource(source)}
                                className="px-2.5 py-1 rounded-full bg-card border border-border text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                                title={source.excerpt}
                              >
                                <FileText size={11} className="inline mr-1" />{source.documentTitle}{source.sourcePage ? ` · tr.${source.sourcePage}` : ""} · đoạn {source.chunkIndex + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {thinking && (messages.length === 0 || messages[messages.length - 1].senderRole !== "AI") && (
                  <ThinkingBubble allDocuments={allDocuments} selectedCount={selectedDocumentIds.length} />
                )}
              </AnimatePresence>
              <div ref={endRef} />
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border/50 p-3 md:p-4 bg-card">
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-0.5">
            {(Object.keys(modeInfo) as ChatMode[]).map((item) => {
              const Icon = modeInfo[item].icon;
              return (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className={`h-11 px-4 rounded-xl border flex items-center gap-2 text-sm font-extrabold whitespace-nowrap transition-all ${
                    mode === item ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <Icon size={16} />{modeInfo[item].label}
                </button>
              );
            })}
          </div>
          {mode !== "ask" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <select value={mode === "quiz" ? questionCount : cardCount} onChange={(event) => mode === "quiz" ? setQuestionCount(Number(event.target.value)) : setCardCount(Number(event.target.value))} className="h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm font-semibold outline-none focus:border-primary">{[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count} {mode === "quiz" ? "câu hỏi" : "thẻ"}</option>)}</select>
              {mode === "quiz" && <select value={questionType} onChange={(event) => setQuestionType(event.target.value as any)} className="h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm font-semibold outline-none focus:border-primary"><option value="SINGLE_CHOICE">Một đáp án</option><option value="MULTIPLE_CHOICE">Nhiều đáp án</option><option value="TRUE_FALSE">Đúng / Sai</option></select>}
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as any)} className="h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm font-semibold outline-none focus:border-primary"><option value="EASY">Dễ</option><option value="MEDIUM">Trung bình</option><option value="HARD">Khó</option></select>
              <select value={topK} onChange={(event) => setTopK(Number(event.target.value))} className="h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm font-semibold outline-none focus:border-primary">{[3, 5, 8, 10].map((value) => <option key={value} value={value}>Top K {value}</option>)}</select>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2.5 shadow-inner focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }}
              placeholder={mode === "ask" ? "Hỏi AI về tài liệu trong notebook..." : `Mô tả chủ đề để AI tạo ${mode === "quiz" ? "quiz" : "flashcard"} draft...`}
              className="flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] leading-6 outline-none min-h-11 max-h-[150px] placeholder:text-muted-foreground/75"
              rows={1}
            />
            {thinking ? (
              <button onClick={stopGenerating} className="size-11 rounded-xl bg-destructive text-destructive-foreground grid place-items-center shadow-sm hover:brightness-110 active:scale-95 transition-all" title="Dừng tạo phản hồi">
                <CircleStop size={18} />
              </button>
            ) : (
              <button onClick={() => send()} disabled={!input.trim()} className="size-11 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all" title="Gửi tin nhắn">
                <Send size={18} />
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] leading-4 text-muted-foreground">
            AI có thể mắc sai sót, hãy kiểm tra cẩn thận nha
          </p>
        </footer>
      </main>

      <aside className={`${compact ? "hidden" : "hidden 2xl:flex"} flex-col gap-3 min-h-0 overflow-y-auto custom-scrollbar`}>
        <section className="surface-card rounded-2xl border border-border/60 p-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary">Bảng học tập</div>
          <div className="grid grid-cols-2 gap-2 mt-3">{[["Tài liệu", documents.length], ["Phiên chat", sessions.length], ["Quiz", relatedQuizzes.length], ["Deck", relatedDecks.length]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border/50 p-3 bg-muted/[0.18]"><div className="text-[11px] text-muted-foreground uppercase font-bold">{label}</div><div className="text-2xl font-extrabold mt-1">{value}</div></div>)}</div>
        </section>
        <section className="surface-card rounded-2xl border border-border/60 p-4 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-bold text-base flex items-center gap-2"><GraduationCap size={16} className="text-emerald-600" />Quiz liên quan</h3><button onClick={() => navigate("/quiz")} className="text-xs font-bold text-primary">Mở tab</button></div><div className="mt-3 space-y-2">{relatedQuizzes.length ? relatedQuizzes.slice(0, 4).map((quiz) => <div key={quiz.id} className="rounded-xl bg-muted/40 p-3 text-sm font-bold truncate">{quiz.title}</div>) : <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Notebook chưa có quiz được gắn.</div>}</div></section>
        <section className="surface-card rounded-2xl border border-border/60 p-4 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-bold text-base flex items-center gap-2"><BookOpen size={16} className="text-rose-500" />Bộ flashcard</h3><button onClick={() => navigate("/flashcards")} className="text-xs font-bold text-primary">Mở tab</button></div><div className="mt-3 space-y-2">{relatedDecks.length ? relatedDecks.slice(0, 4).map((deck) => <div key={deck.id} className="rounded-xl bg-muted/40 p-3"><div className="text-sm font-bold truncate">{deck.title}</div><div className="text-[11px] text-muted-foreground mt-1">{deck.cards?.length ?? 0} thẻ</div></div>) : <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Notebook chưa có flashcard deck.</div>}</div></section>
        <section className="surface-card rounded-2xl border border-border/60 p-4 shadow-sm"><h3 className="font-bold text-base flex items-center gap-2"><Layers3 size={16} className="text-primary" />Draft gần đây</h3><div className="mt-3 text-sm text-muted-foreground">{draftMessages.length ? `${draftMessages.length} bản demo trong phiên hiện tại` : "Chưa có draft nào."}</div></section>
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
