import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpFromLine,
  Bot,
  BookOpenText,
  CheckCircle2,
  FileText,
  LoaderCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserRound,
  Unlink2,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Notify } from "notiflix/build/notiflix-notify-aio";
import "./AIChat.css";
import { useAuthStore } from "../../../store/authStore";
import { getMyNotebooks, type NotebookItem } from "../../../services/notebookService";
import {
  attachDocumentToNotebook,
  detachDocumentFromNotebook,
  getMyDocuments,
  getNotebookDocuments,
  processDocument,
  uploadDocument,
  type DocumentItem,
} from "../../../services/documentService";
import {
  createChatSession,
  deleteChatSession,
  getChatMessages,
  getChatSession,
  getChatSessions,
  sendChatMessage,
  type ChatMessageItem,
  type ChatSessionItem,
} from "../../../services/chatSessionService";

const messageVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 340, damping: 26 },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

function formatSessionTime(value?: string | null): string {
  if (!value) return "Vừa tạo";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa tạo";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildDefaultTitle(notebook?: NotebookItem | null): string {
  const timeLabel = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  return notebook ? `Chat mới · ${notebook.title} · ${timeLabel}` : `Chat mới · ${timeLabel}`;
}

function buildQuestionBasedTitle(question: string, notebook?: NotebookItem | null): string {
  const normalized = question.replace(/\s+/g, " ").trim();
  const shortQuestion =
    normalized.length > 48 ? `${normalized.slice(0, 45).trim()}...` : normalized;

  if (!shortQuestion) {
    return buildDefaultTitle(notebook);
  }

  return notebook ? `${notebook.title} · ${shortQuestion}` : shortQuestion;
}

function sortMessages(messages: ChatMessageItem[]): ChatMessageItem[] {
  return [...messages].sort((left, right) => left.messageSequence - right.messageSequence);
}

export function AIChat() {
  const { user } = useAuthStore();
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<number | null>(null);
  const [attachedDocuments, setAttachedDocuments] = useState<DocumentItem[]>([]);
  const [libraryDocuments, setLibraryDocuments] = useState<DocumentItem[]>([]);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<ChatSessionItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingAttachedDocuments, setIsLoadingAttachedDocuments] = useState(false);
  const [isLoadingLibraryDocuments, setIsLoadingLibraryDocuments] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [attachingDocumentId, setAttachingDocumentId] = useState<number | null>(null);
  const [detachingDocumentId, setDetachingDocumentId] = useState<number | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const messageRequestRef = useRef(0);

  const activeNotebook = useMemo(
    () => notebooks.find((item) => item.id === selectedNotebookId) ?? null,
    [notebooks, selectedNotebookId]
  );

  const attachableDocuments = useMemo(() => {
    const attachedIds = new Set(attachedDocuments.map((item) => item.id));
    return libraryDocuments.filter((item) => !attachedIds.has(item.id));
  }, [attachedDocuments, libraryDocuments]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeSessionId, isLoadingMessages, isSendingMessage]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!user?.userId) {
        setNotebooks([]);
        setSelectedNotebookId(null);
        setSessions([]);
        setActiveSessionId(null);
        setActiveSession(null);
        setMessages([]);
        setIsBootstrapping(false);
        return;
      }

      setIsBootstrapping(true);
      setErrorMessage("");

      try {
        const notebookItems = await getMyNotebooks(user.userId);
        if (cancelled) return;

        setNotebooks(notebookItems);

        if (notebookItems.length === 0) {
          setSelectedNotebookId(null);
          setSessions([]);
          setActiveSessionId(null);
          setActiveSession(null);
          setMessages([]);
          return;
        }

        setSelectedNotebookId((current) => {
          if (current && notebookItems.some((item) => item.id === current)) {
            return current;
          }
          return notebookItems[0].id;
        });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Không thể tải notebook.";
        setErrorMessage(message);
        Notify.failure(message);
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotebookSessions() {
      if (!selectedNotebookId) {
        setSessions([]);
        setActiveSessionId(null);
        setActiveSession(null);
        setMessages([]);
        return;
      }

      setIsLoadingSessions(true);
      setErrorMessage("");

      try {
        const page = await getChatSessions(selectedNotebookId, 0, 50);
        if (cancelled) return;

        setSessions(page.items);

        setActiveSessionId((current) => {
          if (current && page.items.some((session) => session.id === current)) {
            return current;
          }
          return page.items[0]?.id ?? null;
        });

        if (page.items.length === 0) {
          setActiveSession(null);
          setMessages([]);
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Không thể tải danh sách phiên chat.";
        setErrorMessage(message);
      } finally {
        if (!cancelled) {
          setIsLoadingSessions(false);
        }
      }
    }

    void loadNotebookSessions();

    return () => {
      cancelled = true;
    };
  }, [selectedNotebookId]);

  useEffect(() => {
    let cancelled = false;

    async function loadAttachedDocuments() {
      if (!selectedNotebookId) {
        setAttachedDocuments([]);
        return;
      }

      setIsLoadingAttachedDocuments(true);

      try {
        const page = await getNotebookDocuments(selectedNotebookId, 0, 20);
        if (!cancelled) {
          setAttachedDocuments(page.items);
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Không thể tải tài liệu đã gắn vào notebook.";
        setErrorMessage(message);
      } finally {
        if (!cancelled) {
          setIsLoadingAttachedDocuments(false);
        }
      }
    }

    void loadAttachedDocuments();

    return () => {
      cancelled = true;
    };
  }, [selectedNotebookId]);

  useEffect(() => {
    let cancelled = false;

    async function loadLibraryDocuments() {
      if (!isLibraryOpen) {
        return;
      }

      setIsLoadingLibraryDocuments(true);

      try {
        const page = await getMyDocuments({ page: 0, size: 12, sort: "createdAt,desc" });
        if (!cancelled) {
          setLibraryDocuments(page.items);
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Không thể tải thư viện tài liệu cá nhân.";
        setErrorMessage(message);
      } finally {
        if (!cancelled) {
          setIsLoadingLibraryDocuments(false);
        }
      }
    }

    void loadLibraryDocuments();

    return () => {
      cancelled = true;
    };
  }, [isLibraryOpen]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    const fromList = sessions.find((session) => session.id === activeSessionId) ?? null;
    if (fromList) {
      setActiveSession(fromList);
    }
  }, [activeSessionId, sessions]);

  useEffect(() => {
    let cancelled = false;

    async function loadActiveSessionDetail() {
      if (!activeSessionId) {
        setActiveSession(null);
        return;
      }

      setIsLoadingDetail(true);

      try {
        const detail = await getChatSession(activeSessionId);
        if (!cancelled) {
          setActiveSession(detail);
          setSessions((prev) =>
            prev.map((item) => (item.id === detail.id ? { ...item, ...detail } : item))
          );
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Không thể tải chi tiết phiên chat.";
        setErrorMessage(message);
      } finally {
        if (!cancelled) {
          setIsLoadingDetail(false);
        }
      }
    }

    void loadActiveSessionDetail();

    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }

      const requestId = ++messageRequestRef.current;
      setIsLoadingMessages(true);

      try {
        const history = await getChatMessages(activeSessionId);
        if (!cancelled && requestId === messageRequestRef.current) {
          setMessages(sortMessages(history));
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Không thể tải lịch sử hội thoại.";
        setErrorMessage(message);
      } finally {
        if (!cancelled && requestId === messageRequestRef.current) {
          setIsLoadingMessages(false);
        }
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

  async function handleRefresh() {
    if (!user?.userId) return;

    try {
      setIsBootstrapping(true);
      const notebookItems = await getMyNotebooks(user.userId);
      setNotebooks(notebookItems);

      if (notebookItems.length === 0) {
        setSelectedNotebookId(null);
        setAttachedDocuments([]);
        setSessions([]);
        setActiveSessionId(null);
        setActiveSession(null);
        setMessages([]);
      } else {
        const nextNotebookId =
          selectedNotebookId && notebookItems.some((item) => item.id === selectedNotebookId)
            ? selectedNotebookId
            : notebookItems[0].id;
        setSelectedNotebookId(nextNotebookId);
      }
      Notify.success("Đã làm mới danh sách notebook.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể làm mới dữ liệu.";
      setErrorMessage(message);
      Notify.failure(message);
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function createSessionInternal(title: string): Promise<ChatSessionItem> {
    if (!selectedNotebookId) {
      throw new Error("Hãy chọn notebook trước khi tạo phiên chat.");
    }

    const created = await createChatSession(selectedNotebookId, { title });
    setSessions((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
    setActiveSessionId(created.id);
    setActiveSession(created);
    setMessages([]);
    return created;
  }

  async function handleCreateSession() {
    if (!selectedNotebookId) {
      Notify.failure("Hãy chọn notebook trước khi tạo phiên chat.");
      return;
    }

    setIsCreatingSession(true);
    setErrorMessage("");

    try {
      await createSessionInternal(buildDefaultTitle(activeNotebook));
      Notify.success("Tạo phiên chat thành công.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tạo phiên chat thất bại.";
      setErrorMessage(message);
      Notify.failure(message);
    } finally {
      setIsCreatingSession(false);
    }
  }

  async function handleDeleteSession(sessionId: number, e: React.MouseEvent) {
    e.stopPropagation();

    const session = sessions.find((item) => item.id === sessionId);
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa phiên chat "${session?.title ?? `#${sessionId}`}" không?`
    );

    if (!confirmed) return;

    setDeletingSessionId(sessionId);
    setErrorMessage("");

    try {
      await deleteChatSession(sessionId);

      const remainingSessions = sessions.filter((item) => item.id !== sessionId);
      setSessions(remainingSessions);

      if (activeSessionId === sessionId) {
        setActiveSessionId(remainingSessions[0]?.id ?? null);
        if (remainingSessions.length === 0) {
          setActiveSession(null);
          setMessages([]);
        }
      }

      Notify.success("Đã xóa phiên chat.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Xóa phiên chat thất bại.";
      setErrorMessage(message);
      Notify.failure(message);
    } finally {
      setDeletingSessionId(null);
    }
  }

  async function refreshAttachedDocuments() {
    if (!selectedNotebookId) return;
    const page = await getNotebookDocuments(selectedNotebookId, 0, 20);
    setAttachedDocuments(page.items);
  }

  async function refreshLibraryDocuments() {
    const page = await getMyDocuments({ page: 0, size: 12, sort: "createdAt,desc" });
    setLibraryDocuments(page.items);
  }

  async function ensureDocumentProcessed(document: DocumentItem) {
    if (document.processingStatus === "SUCCESS") {
      return;
    }
    await processDocument(document.id, {});
  }

  async function handleUploadDocument(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !selectedNotebookId) {
      return;
    }

    setIsUploadingDocument(true);
    setErrorMessage("");

    try {
      const uploaded = await uploadDocument({
        file,
        subjectId: activeNotebook?.subjectId ?? undefined,
      });
      await ensureDocumentProcessed(uploaded);
      await attachDocumentToNotebook(selectedNotebookId, uploaded.id);
      await Promise.all([refreshAttachedDocuments(), isLibraryOpen ? refreshLibraryDocuments() : Promise.resolve()]);
      Notify.success("Tài liệu đã được upload, xử lý và gắn vào notebook.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload tài liệu thất bại.";
      setErrorMessage(message);
      Notify.failure(message);
    } finally {
      setIsUploadingDocument(false);
    }
  }

  async function handleAttachExistingDocument(document: DocumentItem) {
    if (!selectedNotebookId) {
      Notify.failure("Hãy chọn notebook trước khi gắn tài liệu.");
      return;
    }

    setAttachingDocumentId(document.id);
    setErrorMessage("");

    try {
      await ensureDocumentProcessed(document);
      await attachDocumentToNotebook(selectedNotebookId, document.id);
      await Promise.all([refreshAttachedDocuments(), refreshLibraryDocuments()]);
      Notify.success(`Đã gắn "${document.title}" vào notebook.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gắn tài liệu thất bại.";
      setErrorMessage(message);
      Notify.failure(message);
    } finally {
      setAttachingDocumentId(null);
    }
  }

  async function handleDetachDocument(documentId: number) {
    if (!selectedNotebookId) {
      return;
    }

    setDetachingDocumentId(documentId);
    setErrorMessage("");

    try {
      await detachDocumentFromNotebook(selectedNotebookId, documentId);
      await refreshAttachedDocuments();
      Notify.success("Đã gỡ tài liệu khỏi notebook.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gỡ tài liệu thất bại.";
      setErrorMessage(message);
      Notify.failure(message);
    } finally {
      setDetachingDocumentId(null);
    }
  }

  async function handleSendMessage(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedNotebookId) {
      Notify.failure("Hãy chọn notebook trước khi gửi câu hỏi.");
      return;
    }

    const content = draftMessage.trim();
    if (!content) {
      Notify.failure("Nhập câu hỏi trước khi gửi.");
      return;
    }

    setIsSendingMessage(true);
    setErrorMessage("");

    try {
      let targetSession = activeSession;

      if (!targetSession) {
        targetSession = await createSessionInternal(buildQuestionBasedTitle(content, activeNotebook));
      }

      const result = await sendChatMessage(targetSession.id, {
        content,
        topK: 3,
      });

      messageRequestRef.current += 1;
      setMessages((prev) =>
        sortMessages([...prev, result.userMessage, result.aiMessage])
      );
      setDraftMessage("");
      setActiveSessionId(targetSession.id);
      setActiveSession((current) => current ?? targetSession);
      Notify.success("AI đã phản hồi.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gửi câu hỏi thất bại.";
      setErrorMessage(message);
      Notify.failure(message);
    } finally {
      setIsSendingMessage(false);
    }
  }

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-sidebar">
        <div className="section-doc">
          <div className="section-title">Notebook đang dùng</div>
          <select
            value={selectedNotebookId ?? ""}
            onChange={(event) => setSelectedNotebookId(Number(event.target.value) || null)}
            className="select-doc"
            disabled={isBootstrapping || notebooks.length === 0}
          >
            {notebooks.length === 0 && <option value="">-- Chưa có notebook --</option>}
            {notebooks.map((notebook) => (
              <option key={notebook.id} value={notebook.id}>
                📘 {notebook.title}
              </option>
            ))}
          </select>

          <div className="notebook-meta">
            {activeNotebook ? (
              <>
                <span>ID #{activeNotebook.id}</span>
                <span>•</span>
                <span>Tạo lúc {formatSessionTime(activeNotebook.createdAt)}</span>
              </>
            ) : (
              <span>Hãy chọn một notebook để bắt đầu trò chuyện.</span>
            )}
          </div>

          <div className="sidebar-actions">
            <motion.button
              className="secondary-action-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={isBootstrapping}
            >
              <RefreshCw size={14} />
              Làm mới
            </motion.button>

            <motion.button
              onClick={() => void handleCreateSession()}
              className="new-chat-btn"
              whileHover={{ scale: 1.02, backgroundColor: "#1e4a7a" }}
              whileTap={{ scale: 0.97 }}
              disabled={!selectedNotebookId || isCreatingSession || isSendingMessage}
            >
              {isCreatingSession ? <LoaderCircle size={16} className="spin" /> : <Plus size={16} />}
              Tạo Session
            </motion.button>
          </div>

          <div className="rag-badge">
            <CheckCircle2 size={12} color="#10b981" />
            BE-017 + BE-018 đã kết nối
          </div>
        </div>

        <div className="section-doc">
          <div className="section-title">Nguồn tài liệu cho chat</div>
          <input
            ref={uploadInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
            className="hidden-file-input"
            onChange={(event) => void handleUploadDocument(event)}
          />

          <div className="document-source-actions">
            <motion.button
              type="button"
              className="secondary-action-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!selectedNotebookId || isUploadingDocument}
              onClick={() => uploadInputRef.current?.click()}
            >
              {isUploadingDocument ? <LoaderCircle size={14} className="spin" /> : <ArrowUpFromLine size={14} />}
              Upload & gắn
            </motion.button>

            <motion.button
              type="button"
              className="secondary-action-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!selectedNotebookId}
              onClick={() => setIsLibraryOpen((current) => !current)}
            >
              <BookOpenText size={14} />
              {isLibraryOpen ? "Ẩn thư viện" : "Gắn tài liệu có sẵn"}
            </motion.button>
          </div>

          <div className="attached-documents-panel">
            <div className="attached-documents-head">
              <span>Tài liệu đang gắn</span>
              <strong>{attachedDocuments.length}</strong>
            </div>

            {isLoadingAttachedDocuments ? (
              <div className="mini-empty-state">
                <LoaderCircle size={14} className="spin" />
                <span>Đang tải tài liệu...</span>
              </div>
            ) : attachedDocuments.length === 0 ? (
              <div className="mini-empty-state">
                <FileText size={14} />
                <span>Notebook này chưa có tài liệu để RAG tra cứu.</span>
              </div>
            ) : (
              <div className="attached-documents-list">
                {attachedDocuments.map((document) => (
                  <div key={document.id} className="attached-document-card">
                    <div className="attached-document-copy">
                      <strong>{document.title}</strong>
                      <span>
                        {document.fileType?.toUpperCase() ?? "FILE"} • {document.processingStatus}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="document-icon-btn"
                      disabled={detachingDocumentId === document.id}
                      onClick={() => void handleDetachDocument(document.id)}
                    >
                      {detachingDocumentId === document.id ? (
                        <LoaderCircle size={14} className="spin" />
                      ) : (
                        <Unlink2 size={14} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isLibraryOpen && (
            <div className="library-documents-panel">
              <div className="library-documents-title">Tài liệu cá nhân có thể gắn</div>
              {isLoadingLibraryDocuments ? (
                <div className="mini-empty-state">
                  <LoaderCircle size={14} className="spin" />
                  <span>Đang tải thư viện tài liệu...</span>
                </div>
              ) : attachableDocuments.length === 0 ? (
                <div className="mini-empty-state">
                  <BookOpenText size={14} />
                  <span>Không còn tài liệu nào chưa gắn trong thư viện hiện tại.</span>
                </div>
              ) : (
                <div className="library-documents-list">
                  {attachableDocuments.map((document) => (
                    <div key={document.id} className="library-document-card">
                      <div className="library-document-copy">
                        <strong>{document.title}</strong>
                        <span>
                          {document.fileType?.toUpperCase() ?? "FILE"} • {document.processingStatus}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="attach-document-btn"
                        disabled={attachingDocumentId === document.id}
                        onClick={() => void handleAttachExistingDocument(document)}
                      >
                        {attachingDocumentId === document.id ? (
                          <LoaderCircle size={14} className="spin" />
                        ) : (
                          "Gắn"
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="history-container">
          <div className="section-title">Các phiên chat gần đây</div>

          {isLoadingSessions ? (
            <div className="sidebar-empty">
              <LoaderCircle size={18} className="spin" />
              <span>Đang tải session...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="sidebar-empty">
              <MessageSquare size={16} />
              <span>Notebook này chưa có session nào.</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  layout
                  onClick={() => setActiveSessionId(session.id)}
                  className={`chat-row ${session.id === activeSessionId ? "active" : ""}`}
                  whileHover={{ x: 4, backgroundColor: session.id === activeSessionId ? "#e2e8f0" : "#e8eef8" }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
                >
                  <div className="chat-row-left">
                    <MessageSquare size={16} className="chat-row-icon" />
                    <div className="chat-row-copy">
                      <span className="chat-row-title">{session.title}</span>
                      <span className="chat-row-time">{formatSessionTime(session.createdAt)}</span>
                    </div>
                  </div>

                  <motion.button
                    onClick={(event) => void handleDeleteSession(session.id, event)}
                    className="delete-btn"
                    whileHover={{ scale: 1.15, color: "#ef4444" }}
                    disabled={deletingSessionId === session.id}
                  >
                    {deletingSessionId === session.id ? (
                      <LoaderCircle size={14} className="spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="main-chat">
        <div className="chat-header">
          <div>
            <div className="header-title">
              {activeSession?.title || "AI Session Workspace"}
            </div>
            <div className="header-subtitle">
              {activeSession ? (
                <span className="active-ctx">
                  🎯 Session #{activeSession.id} • Notebook #{activeSession.notebookId}
                </span>
              ) : (
                "Chọn notebook rồi nhập câu hỏi để mở hội thoại đầu tiên"
              )}
            </div>
          </div>
        </div>

        <div className="message-list">
          {errorMessage && (
            <div className="chat-alert error">{errorMessage}</div>
          )}

          {isBootstrapping ? (
            <div className="empty-state-card">
              <LoaderCircle size={24} className="spin" />
              <h3>Đang khởi tạo AI Chat workspace</h3>
              <p>Frontend đang tải notebook, session và trạng thái chat mới nhất từ backend.</p>
            </div>
          ) : !selectedNotebookId ? (
            <div className="empty-state-card">
              <BookOpenText size={24} />
              <h3>Chưa có notebook để gắn hội thoại</h3>
              <p>Tạo hoặc chọn notebook trước, sau đó bạn có thể hỏi trực tiếp để BE-018 tự sinh chat turn.</p>
            </div>
          ) : isLoadingDetail && !activeSession ? (
            <div className="empty-state-card">
              <LoaderCircle size={24} className="spin" />
              <h3>Đang tải chi tiết session</h3>
              <p>Frontend đang đồng bộ metadata của phiên chat đang chọn.</p>
            </div>
          ) : !activeSession ? (
            <div className="empty-state-card">
              <Bot size={24} />
              <h3>Notebook đã sẵn sàng</h3>
              <p>Nhập câu hỏi ở khung bên dưới để tự tạo session mới, hoặc dùng nút ở sidebar để mở phiên chat trước.</p>
            </div>
          ) : (
            <>
              <div className="session-detail-card">
                <div className="session-detail-top">
                  <div>
                    <div className="session-detail-label">Thông tin backend session</div>
                    <h3>{activeSession.title}</h3>
                  </div>
                  <div className="session-status-pill">
                    <CheckCircle2 size={14} />
                    Chat/RAG sẵn sàng
                  </div>
                </div>

                <div className="session-metadata-grid">
                  <div className="session-meta-box">
                    <span className="meta-box-label">Session ID</span>
                    <strong>#{activeSession.id}</strong>
                  </div>
                  <div className="session-meta-box">
                    <span className="meta-box-label">Notebook</span>
                    <strong>{activeNotebook?.title ?? `#${activeSession.notebookId}`}</strong>
                  </div>
                  <div className="session-meta-box">
                    <span className="meta-box-label">User ID</span>
                    <strong>#{activeSession.userId}</strong>
                  </div>
                  <div className="session-meta-box">
                    <span className="meta-box-label">Messages</span>
                    <strong>{messages.length}</strong>
                  </div>
                </div>
              </div>

              {isLoadingMessages ? (
                <div className="empty-state-card compact">
                  <LoaderCircle size={22} className="spin" />
                  <p>Đang tải lịch sử hội thoại từ `GET /api/chat-sessions/{'{sessionId}'}/messages`...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-state-card compact">
                  <Bot size={20} />
                  <p>Phiên chat đã sẵn sàng. Gửi câu hỏi đầu tiên để backend tạo user message, AI message và cited sources.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((message) => {
                    const isUser = message.senderRole === "USER";
                    return (
                      <motion.div
                        key={message.id}
                        layout
                        className={`message-wrapper ${isUser ? "user" : "assistant"}`}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={messageVariants}
                      >
                        {!isUser && (
                          <div className="avatar-bot">
                            <Bot size={16} color="#fff" />
                          </div>
                        )}

                        <div className="message-container">
                          <div className={`bubble ${isUser ? "user" : "assistant"}`}>
                            <div className="message-meta-row">
                              <span className="message-role">
                                {isUser ? (
                                  <>
                                    <UserRound size={13} />
                                    Bạn
                                  </>
                                ) : (
                                  <>
                                    <Bot size={13} />
                                    AI Study Hub
                                  </>
                                )}
                              </span>
                              <span className="message-time">{formatSessionTime(message.createdAt)}</span>
                            </div>

                            <div className="bubble-copy">{message.content}</div>

                            {!isUser && message.citedSources.length > 0 && (
                              <div className="citation-section">
                                <div className="citation-title">Nguồn tham chiếu</div>
                                <div className="citation-list">
                                  {message.citedSources.map((citation, index) => (
                                    <div
                                      key={`${message.id}-${citation.documentId}-${citation.chunkIndex}-${index}`}
                                      className="citation-card"
                                    >
                                      <div className="citation-head">
                                        <FileText size={13} />
                                        <strong>{citation.documentTitle}</strong>
                                      </div>
                                      <div className="citation-meta">
                                        Chunk #{citation.chunkIndex}
                                        {citation.sourcePage ? ` • Trang ${citation.sourcePage}` : ""}
                                      </div>
                                      <div className="citation-excerpt">{citation.excerpt}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}

              {isSendingMessage && (
                <motion.div
                  className="message-wrapper assistant"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={messageVariants}
                >
                  <div className="avatar-bot">
                    <Bot size={16} color="#fff" />
                  </div>
                  <div className="message-container">
                    <div className="bubble assistant typing-bubble">
                      <div className="message-meta-row">
                        <span className="message-role">
                          <Bot size={13} />
                          AI Study Hub
                        </span>
                        <span className="message-time">Đang trả lời...</span>
                      </div>
                      <div className="typing-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={(event) => void handleSendMessage(event)} className="input-area">
          <div className="composer-header">
            <span>Đặt câu hỏi cho notebook hiện tại</span>
            <span className="composer-hint">
              {activeSession
                ? `Đang chat trong "${activeSession.title}"`
                : activeNotebook
                  ? `Chưa có session, gửi câu hỏi sẽ tự tạo trong "${activeNotebook.title}"`
                  : "Chọn notebook trước"}
            </span>
          </div>

          <div className="input-container">
            <input
              type="text"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              placeholder={
                activeNotebook
                  ? "Ví dụ: SRS là gì và tài liệu hiện tại định nghĩa ra sao?"
                  : "Chọn notebook để bắt đầu hỏi"
              }
              className="chat-input"
              disabled={!selectedNotebookId || isSendingMessage}
            />
            <motion.button
              type="submit"
              disabled={!selectedNotebookId || isSendingMessage || !draftMessage.trim()}
              className="send-btn"
              whileHover={!isSendingMessage ? { scale: 1.06, backgroundColor: "#1e4a7a" } : {}}
              whileTap={!isSendingMessage ? { scale: 0.94 } : {}}
            >
              {isSendingMessage ? <LoaderCircle size={18} className="spin" /> : <Send size={18} />}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
