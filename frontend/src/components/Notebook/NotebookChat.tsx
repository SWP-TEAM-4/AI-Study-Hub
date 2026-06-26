import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, FileText, MessageSquare, Clock, Plus, Zap, MoreVertical, Pin, Trash2, Pencil, ArrowLeft, Edit2, Share2, X, Menu, PanelLeftClose, PanelRightClose } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { chatService, ChatSessionDTO, MessageDTO } from "../../services/chatService";
import { Notify } from "notiflix";

interface NotebookChatProps {
  notebookId: number;
  notebookTitle?: string;
  notebookSubjectCode?: string;
  onBack?: () => void;
  onRenameClick?: () => void;
  onShareClick?: () => void;
  onViewDocumentsClick?: () => void;
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

const NotebookChat = forwardRef<NotebookChatRef, NotebookChatProps>(({ notebookId, notebookTitle, notebookSubjectCode, onBack, onRenameClick, onShareClick, onViewDocumentsClick }, ref) => {
  const [sessions, setSessions] = useState<ExtendedChatSessionDTO[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // New Features State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [openMenuSessionId, setOpenMenuSessionId] = useState<number | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

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

  const togglePinSession = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s);
      const target = updated.find(s => s.id === id);
      if (!target?.isPinned) {
        Notify.success("Đã bỏ ghim phiên chat");
      }
      return updated;
    });
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const send = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value) return;

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
      id: Date.now(),
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

    try {
      const res = await chatService.sendMessage(currentId!, value, 3);
      if (res.success && res.data) {
        const { userMessage, aiMessage } = res.data;
        setMessages(p => [...p.filter(m => m.id !== tempUserMsg.id), userMessage, { ...aiMessage, content: "" }]);

        let currentLength = 0;
        const fullContent = aiMessage.content;
        const typewriterTimer = setInterval(() => {
          currentLength += 1.5;
          if (currentLength >= fullContent.length) {
            clearInterval(typewriterTimer);
            setMessages(p => p.map(m => m.id === aiMessage.id ? aiMessage : m));
          } else {
            setMessages(p => p.map(m => m.id === aiMessage.id ? { ...m, content: fullContent.substring(0, currentLength) } : m));
          }
        }, 15);
      }
    } catch (error) {
      Notify.failure("Lỗi khi gửi tin nhắn");
      setMessages(p => p.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setThinking(false);
    }
  };

  const handleGenQuiz = () => {
    send("Hãy tạo cho tôi một bài Quiz 5 câu hỏi trắc nghiệm dựa trên kiến thức của Notebook này.");
  };

  const handleGenFlashcard = () => {
    send("Hãy tạo cho tôi một bộ Flashcard gồm 5 thẻ từ vựng hoặc khái niệm quan trọng nhất trong Notebook này.");
  };

  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => {
      send(text);
    }
  }));

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm relative">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-card">
        {/* Left Side: Back & Title */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft size={16} />
            </button>
          )}
          
          <button 
            onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
            className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors mr-1" 
            title="Lịch sử Phiên chat"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 group">
                <h2 className="font-display text-base font-bold text-foreground">
                  {notebookTitle || "AI Trợ Giảng"}
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
        
        {/* Right Side: Tools & History */}
        <div className="flex items-center gap-1">
          {onViewDocumentsClick && (
            <button onClick={onViewDocumentsClick} className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium" title="Tài liệu đính kèm">
              <FileText size={14} /> Tài liệu
            </button>
          )}
          {onShareClick && (
            <button onClick={onShareClick} className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium" title="Chia sẻ">
              <Share2 size={14} /> Share
            </button>
          )}
        </div>
      </div>

      {/* Messages Area & History Overlay */}
      <div className="flex-1 relative overflow-hidden flex flex-col bg-background/30 dark:bg-transparent dark:premium-ambient-glow">
        
        {/* Overlay Background */}
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10" 
            />
          )}
        </AnimatePresence>

        {/* History Drawer */}
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute top-0 left-0 bottom-0 w-[280px] bg-card border-r border-border/50 shadow-2xl z-20 flex flex-col dark:premium-sidebar"
            >
              <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-sm text-foreground opacity-90">Lịch sử Chat</h3>
                  <button onClick={() => setIsHistoryOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <X size={14} />
                  </button>
                </div>
                
                {/* Premium New Chat Button */}
                <button
                  onClick={createSession}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-muted text-sm font-medium transition-all shadow-sm group"
                >
                  <Plus size={16} className="text-primary group-hover:scale-110 transition-transform" /> 
                  <span className="text-foreground">Phiên chat mới</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 pt-0 scrollbar-hidden">
                {loadingSessions ? (
                  <div className="flex flex-col gap-2 mt-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-full h-[68px] rounded-xl bg-muted/40 animate-pulse border border-border/20" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Chưa có phiên chat nào.</p>
                ) : (
                  <AnimatePresence initial={false}>
                    <div className="flex flex-col gap-1.5">
                    {sortedSessions.map((s) => (
                      <motion.div key={s.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ type: "spring", stiffness: 500, damping: 40 }}>
                        <button
                          onClick={() => { if (editingSessionId !== s.id) { setActiveSessionId(s.id); setIsHistoryOpen(false); } }}
                          className={`w-full group flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer relative 
                            ${activeSessionId === s.id 
                              ? "bg-primary/10 border border-primary/20 shadow-sm" 
                              : "hover:bg-muted border border-transparent"}
                            ${s.isPinned && activeSessionId !== s.id ? "bg-muted/30" : ""}
                          `}
                        >
                          {s.isPinned ? (
                            <Pin size={15} className={`mt-0.5 shrink-0 rotate-45 ${activeSessionId === s.id ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                          ) : (
                            <MessageSquare size={16} className={`mt-0.5 shrink-0 ${activeSessionId === s.id ? "text-primary" : "text-muted-foreground"}`} />
                          )}
                          <div className="flex-1 min-w-0">
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
                                className="w-full bg-background text-foreground text-xs px-2 py-1 rounded border border-primary outline-none font-medium"
                              />
                            ) : (
                              <>
                                <div className={`text-sm truncate pr-6 ${activeSessionId === s.id ? "font-bold text-foreground" : "font-medium"}`}>{s.title}</div>
                                <div className="text-[10px] opacity-70 mt-0.5">{new Date(s.createdAt).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</div>
                              </>
                            )}
                          </div>
                          {editingSessionId !== s.id && (
                            <div className="absolute right-2 top-[14px] z-30">
                              <div
                                onClick={(e) => { e.stopPropagation(); setOpenMenuSessionId(openMenuSessionId === s.id ? null : s.id); }}
                                className="p-1 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <MoreVertical size={14} />
                              </div>
                              <AnimatePresence>
                                {openMenuSessionId === s.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40 cursor-default"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuSessionId(null);
                                      }}
                                    />
                                    <div className="absolute right-0 mt-1 w-32 bg-card border border-border/60 rounded-xl shadow-xl p-1 z-50 flex flex-col gap-0.5 text-foreground animate-in fade-in slide-in-from-top-1 duration-100">
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          togglePinSession(e, s.id);
                                          setOpenMenuSessionId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors text-left font-medium cursor-pointer"
                                      >
                                        <Pin size={12} className={s.isPinned ? "text-primary fill-primary" : ""} />
                                        {s.isPinned ? "Bỏ ghim" : "Ghim đầu"}
                                      </div>
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingSessionId(s.id);
                                          setEditTitle(s.title);
                                          setOpenMenuSessionId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors text-left font-medium cursor-pointer"
                                      >
                                        <Pencil size={12} className="text-primary" />
                                        Đổi tên
                                      </div>
                                      <div className="h-px bg-border/40 my-0.5" />
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteSession(e, s.id);
                                          setOpenMenuSessionId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left font-medium cursor-pointer"
                                      >
                                        <Trash2 size={12} />
                                        Xóa phiên
                                      </div>
                                    </div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </button>
                      </motion.div>
                    ))}
                    </div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
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
            <h3 className="text-base font-bold mb-1">Hỏi AI về Notebook này!</h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">Hệ thống sẽ tổng hợp câu trả lời từ các tài liệu bạn đã tải lên.</p>
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
                    <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-[14px] whitespace-pre-wrap shadow-sm dark:premium-user-message">
                      {m.content}
                    </div>
                  ) : (
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/40 border border-border/50 text-foreground text-[14px] whitespace-pre-wrap leading-relaxed dark:premium-ai-message">
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
        
        {thinking && (
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

      {/* Input Area & Quick Actions */}
      <div className="p-3 bg-card border-t border-border/50">
        {/* Quick Actions (Tạo Quiz / Flashcard) */}
        <div className="flex items-center gap-2 mb-3 px-1 overflow-x-auto no-scrollbar">
          <button onClick={handleGenQuiz} disabled={thinking} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 border border-coral/20 text-xs font-bold transition-colors disabled:opacity-50">
            <Zap size={12} className="fill-coral" /> Tạo Quiz
          </button>
          <button onClick={handleGenFlashcard} disabled={thinking} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 border border-success/20 text-xs font-bold transition-colors disabled:opacity-50">
            <Zap size={12} className="fill-success" /> Tạo Flashcard
          </button>
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
          <button type="submit" disabled={!input.trim() || thinking} className="size-9 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all">
            <Send size={14} className="mr-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
});

export default NotebookChat;
