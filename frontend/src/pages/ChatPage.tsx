"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, FileText, Plus, Trash2, MessageSquare, Clock, Pencil, Pin, MoreVertical } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import { useEffect, useRef, useState } from "react";
import { chatService, ChatSessionDTO, MessageDTO } from "../services/chatService";
import { Notify } from "notiflix";

type ExtendedChatSessionDTO = ChatSessionDTO & { isPinned?: boolean };

const suggestions = [
  "Tóm tắt tài liệu 'Software Project — Lecture 01'",
  "Tạo 5 câu hỏi trắc nghiệm về Scrum",
  "Giải thích Definition of Done",
  "Đề cương ôn thi cuối kỳ SWP391",
];

export default function ChatPage() {
  const [sessions, setSessions] = useState<ExtendedChatSessionDTO[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // 🛠️ State kiểm soát việc menu ba chấm của phiên chat nào đang mở
  const [openMenuSessionId, setOpenMenuSessionId] = useState<number | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const lastSentTime = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typewriterTimerRef = useRef<any>(null);
  const currentNotebookId = 101;

  useEffect(() => {
    loadSessions();
  }, []);

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
      const res = await chatService.getNotebookChatSessions(currentNotebookId);
      if (res.success && res.data) {
        const initialized = res.data.items.map(s => ({ ...s, isPinned: false }));
        setSessions(initialized);
        if (initialized.length > 0 && !activeSessionId) {
          setActiveSessionId(initialized[0].id);
        }
      }
    } catch (error) {
      console.error(error);
      Notify.failure("Lỗi tải lịch sử chat");
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadMessages = async (sessionId: number) => {
    setLoadingMessages(true);
    try {
      const res = await chatService.getChatMessages(sessionId);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const createSession = async () => {
    try {
      const res = await chatService.createChatSession(currentNotebookId, "Phiên chat mới");
      if (res.success && res.data) {
        setSessions([{ ...res.data, isPinned: false }, ...sessions]);
        setActiveSessionId(res.data.id);

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
      Notify.failure("Lỗi lưu tên phiên chat mới");
    }
  };

  const togglePinSession = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s);
      const target = updated.find(s => s.id === id);
      if (target?.isPinned) {
      } else {
        Notify.success("Đã bỏ ghim phiên chat");
      }
      return updated;
    });
  };

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
        const res = await chatService.createChatSession(currentNotebookId, value.substring(0, 30) + "...");
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

        setMessages(p => [
          ...p.filter(m => m.id !== tempUserMsg.id),
          userMessage,
          { ...aiMessage, content: "" }
        ]);

        let currentLength = 0;
        const fullContent = aiMessage.content;

        const typewriterTimer = setInterval(() => {
          currentLength += 0.8;

          if (currentLength >= fullContent.length) {
            clearInterval(typewriterTimer);
            typewriterTimerRef.current = null;
            setMessages(p => p.map(m => m.id === aiMessage.id ? aiMessage : m));
            setThinking(false);
          } else {
            setMessages(p => p.map(m =>
              m.id === aiMessage.id
                ? { ...m, content: fullContent.substring(0, currentLength) }
                : m
            ));
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

  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-7rem)] max-w-6xl mx-auto gap-6">
      {/* ── SIDEBAR LỊCH SỬ CHAT ── */}
      <div className="w-full md:w-72 shrink-0 flex flex-col gap-4 max-h-[30vh] md:max-h-full">
        <button
          onClick={createSession}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={18} /> Chat mới
        </button>
        <div className="flex-1 surface-card overflow-hidden flex flex-col rounded-2xl border border-border/50">
          <div className="p-4 border-b border-border/50 bg-muted/20">
            <h3 className="font-display font-semibold flex items-center gap-2 text-sm text-foreground">
              <Clock size={16} className="text-primary" /> Lịch sử Chat
            </h3>
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
                {sortedSessions.map((s, i) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  >
                    <button
                      onClick={() => {
                        if (editingSessionId !== s.id) setActiveSessionId(s.id);
                      }}
                      className={`w-full group flex items-start gap-3 p-3 rounded-xl mb-1 text-left transition-colors cursor-pointer relative ${activeSessionId === s.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                        } ${s.isPinned ? "border-l-2 border-primary pl-2.5 bg-muted/30" : ""}`}
                    >
                      {s.isPinned ? (
                        <Pin size={15} className="mt-0.5 shrink-0 text-primary fill-primary rotate-45" />
                      ) : (
                        <MessageSquare size={16} className="mt-0.5 shrink-0" />
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
                            <div className={`text-sm truncate pr-6 ${activeSessionId === s.id ? "font-bold text-foreground" : "font-medium"}`}>
                              {s.title}
                            </div>
                            <div className="text-[10px] opacity-70 mt-0.5">
                              {new Date(s.createdAt).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </>
                        )}
                      </div>

                      {/* 🛠️ Cấu trúc Menu Ba chấm hoàn toàn mới */}
                      {editingSessionId !== s.id && (
                        <div className="absolute right-2 top-[14px] z-30">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              // Toggle bật tắt menu của session được nhấn
                              setOpenMenuSessionId(openMenuSessionId === s.id ? null : s.id);
                            }}
                            className="p-1 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Thao tác"
                          >
                            <MoreVertical size={14} />
                          </div>

                          {/* Toàn bộ bảng Dropdown Menu khi click vào nút 3 chấm */}
                          {openMenuSessionId === s.id && (
                            <>
                              {/* Lớp phủ màn hình vô hình để click bên ngoài đóng menu */}
                              <div
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuSessionId(null);
                                }}
                              />

                              {/* Thùng chứa hộp thoại chọn hành động */}
                              <div className="absolute right-0 mt-1 w-32 bg-card border border-border/60 rounded-xl shadow-xl p-1 z-50 flex flex-col gap-0.5 text-foreground animate-in fade-in slide-in-from-top-1 duration-100">
                                <div
                                  onClick={(e) => {
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
                        </div>
                      )}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* ── CHAT AREA CHÍNH ── */}
      <div className="flex-1 flex flex-col surface-card rounded-2xl overflow-hidden border border-border/50 shadow-sm relative">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 backdrop-blur-md">
          <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold">Trợ lý AI RAG</h1>
            <div className="text-[11px]  text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="size-1.5 rounded-full bg-success animate-pulse" /> Kết nối cơ sở dữ liệu học thuật
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hidden">
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
              <div className="size-16 rounded-3xl bg-muted grid place-items-center mb-4 text-muted-foreground">
                <Sparkles size={28} />
              </div>
              <h2 className="text-lg font-bold mb-2">Hỏi AI bất kỳ điều gì!</h2>
              <p className="text-sm text-muted-foreground max-w-sm">Hệ thống sẽ tổng hợp câu trả lời dựa trên các tài liệu đã tải lên trong thư mục này.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-3 ${m.senderRole === "USER" ? "flex-row-reverse" : ""}`}
                >
                  {m.senderRole === "AI" && (
                    <div className="size-8 shrink-0 rounded-xl bg-primary/20 text-primary grid place-items-center mt-1">
                      <Bot size={16} />
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
                    
                    <span className="text-[10px] text-muted-foreground mt-0.5 px-1 opacity-70">
                      {new Date(m.createdAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </span>

                    {m.citedSources && m.citedSources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {m.citedSources.map((s, idx) => (
                          <div
                            key={idx}
                            title={s.excerpt}
                            className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 cursor-help"
                          >
                            <FileText size={10} /> {s.documentTitle} (Trang {s.sourcePage})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {thinking && (messages.length === 0 || messages[messages.length - 1].senderRole !== "AI") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="size-8 shrink-0 rounded-xl bg-primary/20 text-primary grid place-items-center mt-1">
                <Bot size={16} />
              </div>
              <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-muted/40 border border-border/50 flex items-center gap-1.5 text-muted-foreground text-sm">
                <span className=" text-xs">AI đang phân tích tài liệu</span>
                <span className="flex gap-0.5 ml-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </span>
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length === 0 && (
          <div className="px-6 pb-4">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-primary" /> Gợi ý nhanh
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3.5 py-2 text-[11px] font-semibold rounded-xl bg-muted/50 border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-card border-t border-border/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2 bg-muted/30 border border-border/60 p-1.5 rounded-2xl focus-within:border-primary/50 focus-within:bg-card transition-colors"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Nhập nội dung hỏi đáp (Shift + Enter để xuống dòng)..."
              className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none resize-none max-h-32 min-h-[44px] font-medium placeholder:text-muted-foreground/60"
            />
            {thinking ? (
              <button
                type="button"
                onClick={handleStop}
                className="size-[44px] shrink-0 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all cursor-pointer animate-pulse"
              >
                <div className="size-3 bg-white rounded-[2px]" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="size-[44px] shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <Send size={18} className="mr-0.5" />
              </button>
            )}
          </form>
          <div className="text-center mt-2 text-[11px] text-muted-foreground">
            AI có thể đưa ra thông tin không chính xác. Hãy kiểm tra lại các trích dẫn tài liệu.
          </div>
        </div>
      </div>
    </div>
  );
}