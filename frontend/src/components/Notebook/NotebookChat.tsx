import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, FileText, MessageSquare, Plus, Zap, MoreVertical, Pin, Trash2, Pencil, ArrowLeft, Edit2, Share2, Menu, GraduationCap, BookOpen, ChevronLeft, ChevronRight, PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { chatService, ChatSessionDTO, MessageDTO } from "../../services/chatService";
import { Notify } from "notiflix";
import AiConfigModal from "../ui/AiConfigModal";

interface NotebookChatProps {
  notebookId: number;
  notebookTitle?: string;
  notebookSubjectCode?: string;
  onBack?: () => void;
  onRenameClick?: () => void;
  onShareClick?: () => void;
  onDocumentClick?: (doc: any) => void;
  documents?: any[];
  quizzes?: any[];
  decks?: any[];
}

export interface NotebookChatRef {
  sendMessage: (text: string) => void;
}

type ExtendedChatSessionDTO = ChatSessionDTO & { isPinned?: boolean };

const suggestions = [
  "Tóm tắt các tài liệu trong Notebook này",
  "Giải thích các thuật ngữ quan trọng",
  "Đề cương ôn tập chi tiết",
];

const NotebookChat = forwardRef<NotebookChatRef, NotebookChatProps>(({ 
  notebookId, 
  notebookTitle, 
  notebookSubjectCode, 
  onBack, 
  onRenameClick, 
  onShareClick, 
  onDocumentClick, 
  documents = [], 
  quizzes = [], 
  decks = [] 
}, ref) => {
  const [sessions, setSessions] = useState<ExtendedChatSessionDTO[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Layout state
  const [leftWidth, setLeftWidth] = useState(280);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [rightWidth, setRightWidth] = useState(300);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isSessionsDropdownOpen, setIsSessionsDropdownOpen] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<"overview" | "quiz" | "flashcard">("overview");

  // AI Config Modal State
  const [aiConfigModalType, setAiConfigModalType] = useState<"quiz" | "flashcard" | null>(null);

  // Document Viewer inside sources panel
  const [viewingDocument, setViewingDocument] = useState<any | null>(null);

  // Mobile Drawer
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [openMenuSessionId, setOpenMenuSessionId] = useState<number | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const lastSentTime = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typewriterTimerRef = useRef<any>(null);
  const sessionsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sessionsDropdownRef.current && !sessionsDropdownRef.current.contains(event.target as Node)) {
        setIsSessionsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [notebookId]);

  useEffect(() => {
    if (activeSessionId) {
      setMessages([]);
      loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await chatService.getNotebookChatSessions(notebookId);
      if (res.success && res.data) {
        const initialized = res.data.items.map(s => ({ ...s, isPinned: false }));
        setSessions(initialized);
        if (initialized.length > 0 && !activeSessionId) {
          setActiveSessionId(initialized[0].id);
        }
      }
    } catch (error) {
      Notify.failure("Lỗi tải lịch sử chat");
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadMessages = async (sessionId: number) => {
    setLoadingMessages(true);
    try {
      const res = await chatService.getChatMessages(sessionId);
      if (res.success && res.data) setMessages(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const createSession = async () => {
    try {
      const res = await chatService.createChatSession(notebookId, "Phiên chat mới");
      if (res.success && res.data) {
        setSessions([{ ...res.data, isPinned: false }, ...sessions]);
        setActiveSessionId(res.data.id);
        setIsHistoryOpen(false);
        setIsSessionsDropdownOpen(false);
      }
    } catch (error) {
      Notify.failure("Lỗi tạo phiên chat");
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const res = await chatService.deleteChatSession(id);
      if (res.success) {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) setActiveSessionId(null);
      }
    } catch (error) {
      Notify.failure("Lỗi xóa phiên chat");
    }
  };

  const renameSession = async (id: number, newTitle: string) => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      setEditingSessionId(null);
      return;
    }
    try {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: trimmedTitle } : s));
      setEditingSessionId(null);
    } catch (error) {
      Notify.failure("Lỗi đổi tên");
    }
  };

  const lastPinTimeRef = useRef<Record<number, number>>({});

  const togglePinSession = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const now = Date.now();
    const lastTime = lastPinTimeRef.current[id] || 0;
    if (now - lastTime < 1000) {
      return;
    }
    lastPinTimeRef.current[id] = now;

    const session = sessions.find(s => s.id === id);
    if (!session) return;

    const nextPinState = !session.isPinned;
    if (nextPinState) {
      Notify.success("Đã ghim phiên chat lên đầu");
    } else {
      Notify.success("Đã bỏ ghim phiên chat");
    }

    setSessions(prev => 
      prev.map(s => s.id === id ? { ...s, isPinned: nextPinState } : s)
    );
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const send = async (text?: string) => {
    if (thinking) return;
    const now = Date.now();
    if (now - lastSentTime.current < 2000) {
      Notify.warning("Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi 2 giây!");
      return;
    }

    const value = (text ?? input).trim();
    if (!value) return;

    lastSentTime.current = now;

    let currentId = activeSessionId;
    if (!currentId) {
      try {
        const res = await chatService.createChatSession(notebookId, value.substring(0, 30) + "...");
        if (res.success && res.data) {
          setSessions([{ ...res.data, isPinned: false }, ...sessions]);
          setActiveSessionId(res.data.id);
          currentId = res.data.id;
        } else return;
      } catch (e) {
        return;
      }
    }

    const tempUserMsg: MessageDTO = {
      id: Math.floor(Math.random() * 1000000000),
      sessionId: currentId!,
      messageSequence: messages.length + 1,
      senderRole: "USER",
      content: value,
      citedSources: [],
      createdAt: new Date().toISOString()
    };

    setMessages(p => [...p, tempUserMsg]);
    setInput("");
    setThinking(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await chatService.sendMessage(currentId!, value, 3, controller.signal);
      if (res.success && res.data) {
        const { userMessage, aiMessage } = res.data;
        setMessages(p => [...p.filter(m => m.id !== tempUserMsg.id), userMessage, { ...aiMessage, content: "" }]);

        let currentLength = 0;
        const fullContent = aiMessage.content;
        const typewriterTimer = setInterval(() => {
          currentLength += 1.5;
          if (currentLength >= fullContent.length) {
            clearInterval(typewriterTimer);
            typewriterTimerRef.current = null;
            setMessages(p => p.map(m => m.id === aiMessage.id ? aiMessage : m));
            setThinking(false);
          } else {
            setMessages(p => p.map(m => m.id === aiMessage.id ? { ...m, content: fullContent.substring(0, currentLength) } : m));
          }
        }, 15);
        typewriterTimerRef.current = typewriterTimer;
      } else {
        setThinking(false);
      }
    } catch (error: any) {
      setThinking(false);
      if (error?.name === "AbortError" || error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      Notify.failure("Lỗi khi gửi tin nhắn");
      setMessages(p => p.filter(m => m.id !== tempUserMsg.id));
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    setThinking(false);
    Notify.info("Đã dừng tạo phản hồi.");
  };

  const handleGenQuiz = () => {
    setAiConfigModalType("quiz");
  };

  const handleGenFlashcard = () => {
    setAiConfigModalType("flashcard");
  };

  const handleAiGenerate = (config: any) => {
    const { amount, level, type } = config;
    const levelText = level === "easy" ? "Dễ" : level === "medium" ? "Trung bình" : "Khó";
    
    if (type === "quiz") {
      send(`Hãy tạo cho tôi một bài Quiz ${amount} câu hỏi trắc nghiệm (Mức độ: ${levelText}) dựa trên kiến thức của Notebook này.`);
      setActiveStudioTab("quiz");
    } else {
      send(`Hãy tạo cho tôi một bộ Flashcard gồm ${amount} thẻ từ vựng (Mức độ: ${levelText}) dựa trên kiến thức của Notebook này.`);
      setActiveStudioTab("flashcard");
    }
  };

  const startResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;
    const doDrag = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      if (newWidth >= 200 && newWidth <= 450) {
        setLeftWidth(newWidth);
      }
    };
    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;
    const doDrag = (moveEvent: MouseEvent) => {
      const newWidth = startWidth - (moveEvent.clientX - startX);
      if (newWidth >= 220 && newWidth <= 450) {
        setRightWidth(newWidth);
      }
    };
    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => {
      send(text);
    }
  }));

  return (
    <div className="flex h-full w-full bg-transparent p-0 md:p-2 overflow-hidden relative select-none gap-2">
      
      {/* CỘT TRÁI: NGỮ CẢNH (TÀI LIỆU NOTEBOOK) */}
      <div className="hidden lg:flex flex-col h-full shrink-0 overflow-hidden transition-all duration-300" style={{ width: isLeftCollapsed ? 56 : leftWidth }}>
        {isLeftCollapsed ? (
          <div className="w-[56px] bg-card rounded-2xl border border-border/50 py-4 flex flex-col items-center gap-4 h-full shadow-sm">
            <button
              onClick={() => setIsLeftCollapsed(false)}
              className="size-9 rounded-full border border-primary/20 bg-background text-primary hover:bg-primary/5 flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Mở rộng nguồn"
            >
              <PanelLeftOpen size={16} />
            </button>
            <button
              onClick={() => setIsLeftCollapsed(false)}
              className="size-9 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
              title="Tài liệu"
            >
              <FileText size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col bg-card rounded-2xl border border-border/50 p-4 shadow-sm h-full w-full overflow-hidden">
            <div className="flex items-center justify-between mb-3 text-sm font-semibold text-foreground border-b border-border/40 pb-2">
              <span className="flex items-center gap-1.5 truncate">
                <FileText size={16} className="text-primary shrink-0" /> 
                <span className="truncate">{viewingDocument ? viewingDocument.title : "Tài liệu notebook"}</span>
              </span>
              <button
                onClick={() => setIsLeftCollapsed(true)}
                className="size-7 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                title="Thu gọn"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
            
            {viewingDocument ? (
              // Document Viewer inside Left Panel
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between py-1 px-2 mb-2 bg-muted/40 rounded-lg text-xs">
                  <button 
                    onClick={() => {
                      setViewingDocument(null);
                      if (onDocumentClick) onDocumentClick(null);
                    }} 
                    className="flex items-center gap-1 font-bold text-primary hover:underline"
                  >
                    ← Quay lại
                  </button>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{viewingDocument.type || "PDF"}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-muted/20 border border-border/50 rounded-xl text-left select-text">
                  <h4 className="font-bold text-xs mb-3 text-foreground border-b border-border/30 pb-1.5">
                    {viewingDocument.title}
                  </h4>
                  <div className="text-[11px] text-muted-foreground space-y-2 leading-relaxed">
                    <p className="font-semibold text-foreground">💡 Nội dung tóm tắt tài liệu:</p>
                    <p>Trong kiến thức được ghi chép, tài liệu này trình bày các định nghĩa cốt lõi, khái niệm nghiệp vụ và cấu trúc bài học. Hệ thống AI đã kết nối và hỗ trợ tra cứu toàn bộ nội dung văn bản này.</p>
                    <p className="font-semibold text-foreground">💡 Đặc điểm chính:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Hỗ trợ học tập thông minh qua AI.</li>
                      <li>Tự động phân tích các thẻ Flashcard và Quiz tương ứng.</li>
                      <li>Quản lý thông tin tối ưu trong không gian học tập cá nhân.</li>
                    </ul>
                    <p className="font-semibold text-foreground">💡 Khuyến nghị:</p>
                    <p>Đặt các câu hỏi trực tiếp cho AI ở ô bên cạnh để giải thích sâu hơn các phần chưa hiểu của tài liệu này.</p>
                  </div>
                </div>
              </div>
            ) : (
              // List of documents
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
                {documents && documents.length > 0 ? (
                  documents.map(d => (
                    <div 
                      key={d.id} 
                      onClick={() => {
                        setViewingDocument(d);
                        if (onDocumentClick) onDocumentClick(d);
                      }} 
                      className="p-2.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3 group text-left"
                    >
                      <div className="size-8 shrink-0 rounded-lg bg-background border border-border/50 grid place-items-center text-[10px] font-bold uppercase text-muted-foreground shadow-sm">
                        {d.type || "PDF"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{d.title}</div>
                        <div className="text-[10px] text-muted-foreground">{d.size || "Unknown size"}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">Chưa có tài liệu</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* NÚT RESIZE CỘT TRÁI */}
      {!isLeftCollapsed && (
        <div
          onMouseDown={startResizeLeft}
          onDoubleClick={() => setLeftWidth(280)}
          className="hidden lg:block w-1.5 h-full cursor-col-resize hover:bg-primary/45 active:bg-primary transition-colors select-none shrink-0"
          title="Kéo để thay đổi kích thước, nhấp đúp để đặt lại mặc định"
        />
      )}

      {/* CỘT GIỮA: NOTEBOOK AI WORKSPACE */}
      <div className="flex-1 flex flex-col h-full bg-card rounded-2xl border border-border/50 shadow-sm relative overflow-hidden select-text">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-card">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors mr-1">
                <ArrowLeft size={16} />
              </button>
            )}
            
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
              className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors mr-1 lg:hidden" 
              title="Lịch sử Phiên chat"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <Bot size={18} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 group">
                  <h2 className="font-display text-base font-bold text-foreground">
                    {notebookTitle || "Notebook AI Workspace"}
                  </h2>
                  {onRenameClick && (
                    <button onClick={onRenameClick} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                      <Edit2 size={12} />
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" /> {notebookSubjectCode ? `${notebookSubjectCode} • Đã kết nối` : "Đã kết nối Notebook"}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 relative" ref={sessionsDropdownRef}>
            {onShareClick && (
              <button onClick={onShareClick} className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium cursor-pointer" title="Chia sẻ">
                <Share2 size={14} /> Share
              </button>
            )}
            
            {/* Lịch sử phiên chat (3 chấm dọc) */}
            <button
              onClick={() => setIsSessionsDropdownOpen(!isSessionsDropdownOpen)}
              className={`size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${isSessionsDropdownOpen ? "bg-muted text-foreground" : ""}`}
              title="Lịch sử Chat"
            >
              <MoreVertical size={16} />
            </button>

            {/* POPUP PHIÊN CHAT */}
            <AnimatePresence>
              {isSessionsDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-9 top-0 w-[280px] bg-card border border-border shadow-xl rounded-2xl p-3 z-50 flex flex-col gap-2 text-foreground overflow-hidden animate-in fade-in slide-in-from-top-1"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h3 className="font-display font-bold text-xs text-foreground uppercase tracking-wider">Lịch sử Phiên Chat</h3>
                    <button
                      onClick={createSession}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer animate-none"
                    >
                      <Plus size={10} /> Mới
                    </button>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-0.5">
                    {loadingSessions ? (
                      <div className="flex flex-col gap-1.5">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-full h-10 rounded-xl bg-muted/40 animate-pulse" />
                        ))}
                      </div>
                    ) : sessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Chưa có phiên chat.</p>
                    ) : (
                      sortedSessions.map((s) => (
                        <div key={s.id} className="relative group/sess flex items-center w-full">
                          <button
                            onClick={() => { if (editingSessionId !== s.id) { setActiveSessionId(s.id); setIsSessionsDropdownOpen(false); } }}
                            className={`flex-1 flex items-center gap-2 p-2 rounded-xl text-left text-xs transition-all cursor-pointer truncate pr-16
                              ${activeSessionId === s.id 
                                ? "bg-primary/10 text-primary font-semibold" 
                                : "hover:bg-muted text-foreground"}
                            `}
                          >
                            {s.isPinned ? <Pin size={10} className="rotate-45 text-primary fill-primary shrink-0" /> : <MessageSquare size={10} className="text-muted-foreground shrink-0" />}
                            {editingSessionId === s.id ? (
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") renameSession(s.id, editTitle);
                                  else if (e.key === "Escape") setEditingSessionId(null);
                                }}
                                onBlur={() => renameSession(s.id, editTitle)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-background text-foreground text-xs px-2 py-0.5 rounded border border-primary outline-none font-medium"
                              />
                            ) : (
                              <span className="truncate">{s.title}</span>
                            )}
                          </button>
                          
                          {/* Thao tác trên phiên chat */}
                          <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover/sess:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); togglePinSession(e, s.id); }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Pin size={10} className={s.isPinned ? "rotate-45 text-primary fill-primary" : ""} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingSessionId(s.id); setEditTitle(s.title); }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Pencil size={10} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteSession(e, s.id); }}
                              className="p-1 rounded hover:bg-muted text-destructive hover:text-destructive"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-background/30 dark:bg-transparent dark:premium-ambient-glow">
          
          {/* Mobile History Drawer */}
          <AnimatePresence>
            {isHistoryOpen && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsHistoryOpen(false)}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 lg:hidden" 
              />
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scrollbar-hidden">
          {loadingMessages ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 !== 0 ? "flex-row-reverse" : ""}`}>
                  <div className="size-7 rounded-lg bg-muted/40 animate-pulse shrink-0" />
                  <div className="w-[60%] h-[72px] rounded-2xl bg-muted/30 animate-pulse border border-border/20" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 && !thinking ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
              <div className="size-12 rounded-2xl bg-muted grid place-items-center mb-3 text-muted-foreground">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-bold mb-1">Chế độ AI Quiz Draft</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] mb-4">Hệ thống sẽ tổng hợp câu trả lời từ các tài liệu bạn đã tải lên.</p>
              
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                <button onClick={() => send("Tạo quiz 10 câu hỏi")} className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/10 hover:text-primary rounded-lg border border-border/50 transition-colors cursor-pointer">Tạo quiz 10 câu</button>
                <button onClick={() => send("Tóm tắt ý chính của Notebook này")} className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/10 hover:text-primary rounded-lg border border-border/50 transition-colors cursor-pointer">Tóm tắt ý chính</button>
                <button onClick={() => send("Giải thích các khái niệm phức tạp")} className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/10 hover:text-primary rounded-lg border border-border/50 transition-colors cursor-pointer">Giải thích khái niệm</button>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex gap-3 ${m.senderRole === "USER" ? "flex-row-reverse" : ""}`}>
                  {m.senderRole === "AI" && (
                    <div className="size-7 shrink-0 rounded-lg bg-primary/20 text-primary grid place-items-center mt-0.5">
                      <Bot size={14} />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${m.senderRole === "USER" ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                    {m.senderRole === "USER" ? (
                      <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-[14px] whitespace-pre-wrap shadow-sm dark:premium-user-message text-left">
                        {m.content}
                      </div>
                    ) : (
                      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/40 border border-border/50 text-foreground text-[14px] whitespace-pre-wrap leading-relaxed dark:premium-ai-message text-left">
                        <div className="markdown-prose">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {m.citedSources && m.citedSources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {m.citedSources.map((s, idx) => (
                          <div key={idx} title={s.excerpt} className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 cursor-help">
                            <FileText size={8} /> {s.documentTitle}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TIMESTAMP */}
                    <span className="text-[10px] text-muted-foreground mt-0.5 px-1 opacity-70">
                      {new Date(m.createdAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {thinking && (messages.length === 0 || messages[messages.length - 1].senderRole !== "AI") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="size-7 shrink-0 rounded-lg bg-primary/20 text-primary grid place-items-center mt-0.5">
                <Bot size={14} />
              </div>
              <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm bg-muted/40 border border-border/50 flex items-center gap-1.5 text-muted-foreground">
                <span className="flex gap-0.5 ml-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="size-1 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </span>
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-card border-t border-border/50">
          <div className="flex items-center gap-2 mb-3 px-1 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-md text-muted-foreground border border-border/50">10 câu hỏi</span>
            <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-md text-muted-foreground border border-border/50">1 đáp án</span>
            <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-md text-muted-foreground border border-border/50">Độ khó: Trung bình</span>
            <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-md text-muted-foreground border border-border/50">Top K: 5</span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="relative flex items-center bg-background border border-border/50 rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all dark:premium-search-bar">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Hỏi AI..."
              className="flex-1 bg-transparent px-3 py-2 text-[13px] outline-none resize-none max-h-24 min-h-[36px] font-medium placeholder:text-muted-foreground/60 custom-scrollbar"
            />
            {thinking ? (
              <button type="button" onClick={handleStop} className="size-9 shrink-0 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all cursor-pointer">
                <div className="size-3 bg-white rounded-[2px]" />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()} className="size-9 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all cursor-pointer">
                <Send size={14} className="mr-0.5" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* NÚT RESIZE CỘT PHẢI */}
      {!isRightCollapsed && (
        <div
          onMouseDown={startResizeRight}
          onDoubleClick={() => setRightWidth(300)}
          className="hidden xl:block w-1.5 h-full cursor-col-resize hover:bg-primary/45 active:bg-primary transition-colors select-none shrink-0"
          title="Kéo để thay đổi kích thước, nhấp đúp để đặt lại mặc định"
        />
      )}

      {/* CỘT PHẢI: BẢNG HỌC TẬP NOTEBOOK (STUDIO) */}
      <div className="hidden xl:flex flex-col h-full shrink-0 overflow-hidden transition-all duration-300 gap-2" style={{ width: isRightCollapsed ? 56 : rightWidth }}>
        {isRightCollapsed ? (
          <div className="w-[56px] bg-card rounded-2xl border border-border/50 py-4 flex flex-col items-center gap-4 h-full shadow-sm">
            <button
              onClick={() => setIsRightCollapsed(false)}
              className="size-9 rounded-full border border-primary/20 bg-background text-primary hover:bg-primary/5 flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Mở rộng Studio"
            >
              <PanelRightOpen size={16} />
            </button>
            <button
              onClick={() => { setActiveStudioTab("quiz"); setIsRightCollapsed(false); }}
              className="size-9 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
              title="Quiz"
            >
              <GraduationCap size={16} />
            </button>
            <button
              onClick={() => { setActiveStudioTab("flashcard"); setIsRightCollapsed(false); }}
              className="size-9 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
              title="Flashcard"
            >
              <BookOpen size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col bg-card rounded-2xl border border-border/50 shadow-sm h-full overflow-hidden w-full">
            {/* Header */}
            <div className="p-3 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm">Studio</h3>
              <button
                onClick={() => setIsRightCollapsed(true)}
                className="size-7 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Thu gọn"
              >
                <PanelRightClose size={16} />
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-border/40 bg-muted/10 p-1 gap-1">
              <button
                onClick={() => setActiveStudioTab("overview")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeStudioTab === "overview" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveStudioTab("quiz")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeStudioTab === "quiz" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
              >
                Quiz
              </button>
              <button
                onClick={() => setActiveStudioTab("flashcard")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeStudioTab === "flashcard" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
              >
                Flashcard
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
              {activeStudioTab === "overview" && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/30 rounded-xl p-3 border border-border/50 text-center flex flex-col items-center">
                      <div className="text-xl font-bold text-primary">{documents?.length || 0}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">Tài liệu</div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 border border-border/50 text-center flex flex-col items-center">
                      <div className="text-xl font-bold text-coral">{sessions?.length || 0}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">Phiên chat</div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 border border-border/50 text-center flex flex-col items-center">
                      <div className="text-xl font-bold text-success">{quizzes?.length || 0}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">Quiz</div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 border border-border/50 text-center flex flex-col items-center">
                      <div className="text-xl font-bold text-warning">{decks?.length || 0}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">Deck</div>
                    </div>
                  </div>
                  
                  {/* Tip học tập */}
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-muted-foreground leading-relaxed mt-2 text-left">
                    💡 **Mẹo:** Tải nhiều tài liệu (PDF, Word) vào bảng nguồn để AI trả lời có chiều sâu và chính xác hơn.
                  </div>
                </div>
              )}

              {activeStudioTab === "quiz" && (
                <div className="flex flex-col gap-2">
                  {quizzes && quizzes.length > 0 ? quizzes.map(q => (
                    <div key={q.id} className="p-2.5 rounded-xl border border-border/50 bg-background hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors group">
                      <div className="flex items-center gap-2">
                         <div className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
                           <GraduationCap size={14}/>
                         </div>
                         <span className="text-xs font-medium group-hover:text-primary">{q.title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{q.questions} câu</span>
                    </div>
                  )) : <div className="text-xs text-muted-foreground text-center py-4">Chưa có quiz nào</div>}
                  <button onClick={handleGenQuiz} disabled={thinking} className="w-full mt-1 py-2 rounded-xl border border-dashed border-primary/30 text-primary hover:bg-primary/5 text-xs font-bold transition-colors cursor-pointer">
                    + Tạo Quiz mới bằng AI
                  </button>
                </div>
              )}

              {activeStudioTab === "flashcard" && (
                <div className="flex flex-col gap-2">
                  {decks && decks.length > 0 ? decks.map(d => (
                    <div key={d.id} className="p-2.5 rounded-xl border border-border/50 bg-background hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors group">
                      <div className="flex items-center gap-2">
                         <div className="size-7 rounded-lg bg-coral/10 text-coral grid place-items-center">
                           <BookOpen size={14}/>
                         </div>
                         <span className="text-xs font-medium group-hover:text-coral">{d.title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{d.cards} thẻ</span>
                    </div>
                  )) : <div className="text-xs text-muted-foreground text-center py-4">Chưa có flashcard nào</div>}
                  <button onClick={handleGenFlashcard} disabled={thinking} className="w-full mt-1 py-2 rounded-xl border border-dashed border-coral/30 text-coral hover:bg-coral/5 text-xs font-bold transition-colors cursor-pointer">
                    + Tạo Flashcard bằng AI
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AiConfigModal 
        isOpen={aiConfigModalType !== null}
        onClose={() => setAiConfigModalType(null)}
        type={aiConfigModalType || "quiz"}
        onGenerate={handleAiGenerate}
      />
    </div>
  );
});

NotebookChat.displayName = "NotebookChat";

export default NotebookChat;
