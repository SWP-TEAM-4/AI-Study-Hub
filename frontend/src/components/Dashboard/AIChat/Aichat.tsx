import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
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
  Sparkles,
  Trash2,
  Unlink2,
  UserRound,
  X,
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
  getPracticeDraft,
  importPracticeDraft,
  sendChatMessage,
  type AiPracticeDifficulty,
  type AiPracticeType,
  type ChatMessageItem,
  type ChatSessionItem,
  type PracticeGeneratedPayload,
  type PracticeImportRequest,
  type PracticeImportResponse,
  type PracticeStatus,
  type QuizGeneratedPayload,
  type QuizQuestionType,
} from "../../../services/chatSessionService";
import { searchMyQuizzes, type QuizItem } from "../../../services/quizService";
import { searchMyDecks, type FlashcardDeck } from "../../../services/flashcardService";

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

type ComposerMode = "CHAT" | AiPracticeType;
type TargetVisibility = "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";

interface PracticePreviewState {
  message: ChatMessageItem | null;
  payload: PracticeGeneratedPayload | null;
  loading: boolean;
  error: string;
}

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

function detectManualPracticeType(value: string): AiPracticeType | null {
  const normalized = value.trim().toUpperCase();
  if (normalized.startsWith("[QUIZ]")) return "QUIZ";
  if (normalized.startsWith("[FLASHCARD]")) return "FLASHCARD";
  return null;
}

function buildOutgoingContent(mode: ComposerMode, value: string): string {
  const trimmed = value.trim();
  if (mode === "QUIZ" && !detectManualPracticeType(trimmed)) {
    return `[QUIZ] ${trimmed}`;
  }
  if (mode === "FLASHCARD" && !detectManualPracticeType(trimmed)) {
    return `[FLASHCARD] ${trimmed}`;
  }
  return trimmed;
}

function getPracticeTypeLabel(type?: AiPracticeType | null): string {
  if (type === "QUIZ") return "Quiz Draft";
  if (type === "FLASHCARD") return "Flashcard Draft";
  return "Chat thường";
}

function getPracticeStatusMeta(status?: PracticeStatus | null): { label: string; className: string } {
  switch (status) {
    case "READY":
      return { label: "Sẵn sàng", className: "ready" };
    case "IMPORTED":
      return { label: "Đã import", className: "imported" };
    case "FAILED":
      return { label: "Thất bại", className: "failed" };
    default:
      return { label: "Thường", className: "default" };
  }
}

function getPayloadItemCount(payload?: PracticeGeneratedPayload | null): number {
  if (!payload) return 0;
  return payload.type === "QUIZ" ? payload.questions.length : payload.cards.length;
}

function getPayloadItemLabel(payload?: PracticeGeneratedPayload | null): string {
  if (!payload) return "mục";
  return payload.type === "QUIZ" ? "câu hỏi" : "flashcards";
}

function summarizeValidationErrors(validationErrors: unknown): string[] {
  if (!validationErrors) return [];
  if (Array.isArray(validationErrors)) {
    return validationErrors.map((item) =>
      typeof item === "string" ? item : JSON.stringify(item)
    );
  }
  if (typeof validationErrors === "object") {
    return Object.entries(validationErrors as Record<string, unknown>).map(([key, value]) =>
      typeof value === "string" ? `${key}: ${value}` : `${key}: ${JSON.stringify(value)}`
    );
  }
  return [String(validationErrors)];
}

function canPreviewPractice(message: ChatMessageItem): boolean {
  return Boolean(message.practiceType && (message.generatedPayload || message.practiceStatus !== "FAILED"));
}

function canImportPractice(message: ChatMessageItem): boolean {
  return message.senderRole === "AI" && message.practiceStatus === "READY" && Boolean(message.practiceType);
}

function describeImportedTarget(message: ChatMessageItem): string | null {
  if (!message.importedTargetType || !message.importedTargetId) return null;
  const targetLabel = message.importedTargetType === "QUIZ" ? "Quiz" : "Deck";
  return `${targetLabel} #${message.importedTargetId}`;
}

function getPracticePlaceholder(mode: ComposerMode, hasNotebook: boolean): string {
  if (!hasNotebook) {
    return "Chọn notebook để bắt đầu hỏi";
  }
  if (mode === "QUIZ") {
    return "Ví dụ: Tạo 10 câu trắc nghiệm ôn tập chương 1, có đáp án và giải thích";
  }
  if (mode === "FLASHCARD") {
    return "Ví dụ: Tạo 20 flashcard thuật ngữ quan trọng từ tài liệu hiện tại";
  }
  return "Ví dụ: SRS là gì và tài liệu hiện tại định nghĩa ra sao?";
}

function getPracticePromptHint(mode: ComposerMode): string {
  if (mode === "QUIZ") {
    return "Frontend sẽ tự thêm prefix [QUIZ] và gửi BE-055 sinh JSON quiz draft.";
  }
  if (mode === "FLASHCARD") {
    return "Frontend sẽ tự thêm prefix [FLASHCARD] và gửi BE-055 sinh JSON flashcard draft.";
  }
  return "Chat thường dùng flow BE-018, AI trả lời dựa trên tài liệu notebook hiện tại.";
}

interface PracticePreviewModalProps {
  state: PracticePreviewState;
  onClose: () => void;
  onImport: (message: ChatMessageItem) => void;
}

function PracticePreviewModal({ state, onClose, onImport }: PracticePreviewModalProps) {
  const message = state.message;
  const payload = state.payload;

  if (!message) return null;

  const itemCount = getPayloadItemCount(payload);
  const itemLabel = getPayloadItemLabel(payload);
  const metadata = payload?.metadata;

  return (
    <motion.div
      className="practice-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="practice-modal"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="practice-modal-header">
          <div>
            <div className="practice-modal-kicker">{getPracticeTypeLabel(message.practiceType)}</div>
            <h3>{payload?.title ?? "Practice Draft Preview"}</h3>
            <p>
              {payload
                ? `${itemCount} ${itemLabel} • ${metadata?.language ?? "auto"} • ${metadata?.difficulty ?? "MIXED"}`
                : "Backend đang trả practice payload cho message này."}
            </p>
          </div>

          <button type="button" className="practice-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {state.loading && (
          <div className="practice-modal-loading">
            <LoaderCircle size={18} className="spin" />
            <span>Đang tải preview từ `GET /api/chat-messages/{'{messageId}'}/practice-draft`...</span>
          </div>
        )}

        {state.error && (
          <div className="practice-inline-error">
            <AlertCircle size={15} />
            <span>{state.error}</span>
          </div>
        )}

        {payload?.description && <div className="practice-modal-description">{payload.description}</div>}

        {payload && (
          <>
            <div className="practice-preview-metadata">
              {metadata?.generatedQuestionCount != null && (
                <span>{metadata.generatedQuestionCount} câu đã sinh</span>
              )}
              {metadata?.generatedCardCount != null && (
                <span>{metadata.generatedCardCount} thẻ đã sinh</span>
              )}
              {metadata?.warnings && metadata.warnings.length > 0 && (
                <span>{metadata.warnings.length} cảnh báo</span>
              )}
            </div>

            <div className="practice-preview-list">
              {payload.type === "QUIZ"
                ? payload.questions.map((question, index) => (
                    <div key={`${question.questionText}-${index}`} className="practice-preview-item">
                      <div className="practice-preview-head">
                        <strong>
                          Câu {index + 1}. {question.questionText}
                        </strong>
                        <span>{question.questionType}</span>
                      </div>

                      <ul className="practice-option-list">
                        {question.options.map((option, optionIndex) => (
                          <li key={`${question.questionText}-${optionIndex}`}>
                            <span>{option.optionText}</span>
                            {option.isCorrect && <em>Đáp án đúng</em>}
                          </li>
                        ))}
                      </ul>

                      {question.explanation && (
                        <div className="practice-explanation">Giải thích: {question.explanation}</div>
                      )}

                      {question.sourceRefs && question.sourceRefs.length > 0 && (
                        <div className="practice-source-list">
                          {question.sourceRefs.map((ref, refIndex) => (
                            <div key={`${question.questionText}-ref-${refIndex}`} className="practice-source-chip">
                              {ref.documentId ? `Doc #${ref.documentId}` : "Doc ?"}
                              {ref.sourcePage ? ` • Trang ${ref.sourcePage}` : ""}
                              {ref.chunkIndex != null ? ` • Chunk ${ref.chunkIndex}` : ""}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                : payload.cards.map((card, index) => (
                    <div key={`${card.frontText}-${index}`} className="practice-preview-item">
                      <div className="practice-preview-head">
                        <strong>Thẻ {index + 1}</strong>
                        <span>FLASHCARD</span>
                      </div>
                      <div className="practice-flashcard-side">
                        <label>Front</label>
                        <p>{card.frontText}</p>
                      </div>
                      <div className="practice-flashcard-side">
                        <label>Back</label>
                        <p>{card.backText}</p>
                      </div>

                      {card.sourceRefs && card.sourceRefs.length > 0 && (
                        <div className="practice-source-list">
                          {card.sourceRefs.map((ref, refIndex) => (
                            <div key={`${card.frontText}-ref-${refIndex}`} className="practice-source-chip">
                              {ref.documentId ? `Doc #${ref.documentId}` : "Doc ?"}
                              {ref.sourcePage ? ` • Trang ${ref.sourcePage}` : ""}
                              {ref.chunkIndex != null ? ` • Chunk ${ref.chunkIndex}` : ""}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
            </div>
          </>
        )}

        <div className="practice-modal-footer">
          <button type="button" className="practice-btn-secondary" onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className="practice-btn-primary"
            onClick={() => onImport(message)}
            disabled={!payload || !canImportPractice(message)}
          >
            Import draft
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface PracticeImportModalProps {
  message: ChatMessageItem;
  notebook: NotebookItem | null;
  accessToken: string | null;
  onClose: () => void;
  onImported: (result: PracticeImportResponse) => Promise<void> | void;
}

function PracticeImportModal({
  message,
  notebook,
  accessToken,
  onClose,
  onImported,
}: PracticeImportModalProps) {
  const practiceType = message.practiceType!;
  const [targetMode, setTargetMode] = useState<"CREATE_NEW" | "APPEND_EXISTING">("CREATE_NEW");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<TargetVisibility>("PRIVATE");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [quizTargets, setQuizTargets] = useState<QuizItem[]>([]);
  const [deckTargets, setDeckTargets] = useState<FlashcardDeck[]>([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTargets() {
      if (targetMode !== "APPEND_EXISTING") {
        return;
      }

      setIsLoadingTargets(true);
      setError("");

      try {
        if (practiceType === "QUIZ") {
          if (!accessToken) {
            throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          }
          const data = await searchMyQuizzes(accessToken, {
            page: 0,
            size: 20,
            sort: "createdAt,desc",
          });
          if (!cancelled) {
            setQuizTargets(data.items);
            setSelectedTargetId((current) => current ?? data.items[0]?.id ?? null);
          }
        } else {
          const data = await searchMyDecks({
            page: 0,
            size: 20,
            sort: "createdAt,desc",
          });
          if (!cancelled) {
            setDeckTargets(data.items);
            setSelectedTargetId((current) => current ?? data.items[0]?.id ?? null);
          }
        }
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách target import.");
      } finally {
        if (!cancelled) {
          setIsLoadingTargets(false);
        }
      }
    }

    void loadTargets();

    return () => {
      cancelled = true;
    };
  }, [accessToken, practiceType, targetMode]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (targetMode === "CREATE_NEW" && !title.trim()) {
      setError("Tên target mới là bắt buộc.");
      return;
    }

    if (targetMode === "APPEND_EXISTING" && !selectedTargetId) {
      setError("Hãy chọn một target để append.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const request: PracticeImportRequest = {
      targetMode,
      target:
        targetMode === "CREATE_NEW"
          ? {
              title: title.trim(),
              description: description.trim() || undefined,
              notebookId: notebook?.id,
              subjectId: notebook?.subjectId ?? undefined,
              visibility,
            }
          : practiceType === "QUIZ"
            ? { quizId: selectedTargetId! }
            : { deckId: selectedTargetId! },
      importOptions:
        practiceType === "QUIZ"
          ? {
              skipDuplicateQuestions: skipDuplicates,
              shuffleQuestions: false,
            }
          : {
              skipDuplicateCards: skipDuplicates,
            },
    };

    try {
      const result = await importPracticeDraft(message.id, request);
      await onImported(result);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Import practice draft thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const appendTargets = practiceType === "QUIZ" ? quizTargets : deckTargets;

  return (
    <motion.div
      className="practice-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="practice-modal practice-modal-sm"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="practice-modal-header">
          <div>
            <div className="practice-modal-kicker">Practice Import</div>
            <h3>Import {getPracticeTypeLabel(practiceType)}</h3>
            <p>Reuse backend import flow để tạo mới hoặc append vào target đã có.</p>
          </div>

          <button type="button" className="practice-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="practice-import-form" onSubmit={handleSubmit}>
          <div className="practice-mode-toggle">
            <button
              type="button"
              className={targetMode === "CREATE_NEW" ? "active" : ""}
              onClick={() => setTargetMode("CREATE_NEW")}
            >
              Tạo mới
            </button>
            <button
              type="button"
              className={targetMode === "APPEND_EXISTING" ? "active" : ""}
              onClick={() => setTargetMode("APPEND_EXISTING")}
            >
              Append existing
            </button>
          </div>

          {targetMode === "CREATE_NEW" ? (
            <>
              <label className="practice-field">
                <span>Tiêu đề target mới</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={practiceType === "QUIZ" ? "Quiz từ AI Chat" : "Flashcard deck từ AI Chat"}
                  maxLength={255}
                />
              </label>

              <label className="practice-field">
                <span>Mô tả</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Mô tả ngắn cho target import"
                />
              </label>

              <label className="practice-field">
                <span>Visibility</span>
                <select
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as TargetVisibility)}
                >
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="PUBLIC_LINK">PUBLIC_LINK</option>
                  <option value="MARKETPLACE">MARKETPLACE</option>
                </select>
              </label>

              <div className="practice-field-hint">
                Notebook và subject sẽ default theo notebook hiện tại nếu bạn không đổi gì thêm.
              </div>
            </>
          ) : (
            <div className="practice-target-picker">
              {isLoadingTargets ? (
                <div className="practice-modal-loading">
                  <LoaderCircle size={16} className="spin" />
                  <span>Đang tải danh sách target có sẵn...</span>
                </div>
              ) : appendTargets.length === 0 ? (
                <div className="practice-inline-empty">
                  Chưa có target nào phù hợp để append. Bạn có thể chuyển sang tạo mới.
                </div>
              ) : (
                appendTargets.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    className={`practice-target-card ${selectedTargetId === target.id ? "selected" : ""}`}
                    onClick={() => setSelectedTargetId(target.id)}
                  >
                    <strong>{target.title}</strong>
                    <span>
                      {practiceType === "QUIZ"
                        ? (target as QuizItem).subjectName ?? `Quiz #${target.id}`
                        : `Deck #${target.id}`}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          <label className="practice-checkbox">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(event) => setSkipDuplicates(event.target.checked)}
            />
            <span>Bỏ qua nội dung trùng khi import</span>
          </label>

          {error && (
            <div className="practice-inline-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="practice-modal-footer">
            <button type="button" className="practice-btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="practice-btn-primary"
              disabled={
                isSubmitting ||
                (targetMode === "APPEND_EXISTING" && appendTargets.length === 0)
              }
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={15} className="spin" />
                  Đang import...
                </>
              ) : (
                "Xác nhận import"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function AIChat() {
  const { user, accessToken } = useAuthStore();
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<number | null>(null);
  const [attachedDocuments, setAttachedDocuments] = useState<DocumentItem[]>([]);
  const [libraryDocuments, setLibraryDocuments] = useState<DocumentItem[]>([]);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<ChatSessionItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [composerMode, setComposerMode] = useState<ComposerMode>("CHAT");
  const [practiceLanguage, setPracticeLanguage] = useState("vi");
  const [practiceDifficulty, setPracticeDifficulty] = useState<AiPracticeDifficulty>("MEDIUM");
  const [quizQuestionCount, setQuizQuestionCount] = useState(10);
  const [flashcardCount, setFlashcardCount] = useState(20);
  const [quizQuestionType, setQuizQuestionType] = useState<QuizQuestionType>("SINGLE_CHOICE");
  const [previewState, setPreviewState] = useState<PracticePreviewState>({
    message: null,
    payload: null,
    loading: false,
    error: "",
  });
  const [importingMessage, setImportingMessage] = useState<ChatMessageItem | null>(null);
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

  const attachedDocumentIds = useMemo(
    () => attachedDocuments.map((item) => item.id),
    [attachedDocuments]
  );

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

    void bootstrap();

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

  async function refreshMessagesForSession(sessionId: number) {
    const history = await getChatMessages(sessionId);
    setMessages(sortMessages(history));
  }

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

  async function handleDeleteSession(sessionId: number, event: React.MouseEvent) {
    event.stopPropagation();

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
      await Promise.all([
        refreshAttachedDocuments(),
        isLibraryOpen ? refreshLibraryDocuments() : Promise.resolve(),
      ]);
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

  async function handleOpenPracticePreview(message: ChatMessageItem) {
    setPreviewState({
      message,
      payload: message.generatedPayload ?? null,
      loading: !message.generatedPayload,
      error: "",
    });

    try {
      const payload = await getPracticeDraft(message.id);
      setPreviewState({
        message,
        payload,
        loading: false,
        error: "",
      });
      setMessages((prev) =>
        prev.map((item) => (item.id === message.id ? { ...item, generatedPayload: payload } : item))
      );
    } catch (error) {
      setPreviewState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof Error ? error.message : "Không thể tải preview practice draft.",
      }));
    }
  }

  async function handlePracticeImported(result: PracticeImportResponse) {
    if (activeSessionId) {
      await refreshMessagesForSession(activeSessionId);
    }

    const importedLabel = result.targetType === "QUIZ" ? "quiz" : "deck";
    Notify.success(`Đã import thành công vào ${importedLabel} #${result.targetId}.`);
    setImportingMessage(null);
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

    const detectedManualMode = detectManualPracticeType(content);
    const effectiveMode: ComposerMode = composerMode !== "CHAT" ? composerMode : detectedManualMode ?? "CHAT";
    const outgoingContent = buildOutgoingContent(effectiveMode, content);

    setIsSendingMessage(true);
    setErrorMessage("");

    try {
      let targetSession = activeSession;

      if (!targetSession) {
        targetSession = await createSessionInternal(buildQuestionBasedTitle(content, activeNotebook));
      }

      const result = await sendChatMessage(targetSession.id, {
        content: outgoingContent,
        topK: effectiveMode === "CHAT" ? 3 : 8,
        documentIds: attachedDocumentIds.length > 0 ? attachedDocumentIds : undefined,
        language: effectiveMode === "CHAT" ? undefined : practiceLanguage,
        options:
          effectiveMode === "QUIZ"
            ? {
                numberOfQuestions: Math.min(Math.max(quizQuestionCount, 1), 30),
                questionType: quizQuestionType,
                difficulty: practiceDifficulty,
              }
            : effectiveMode === "FLASHCARD"
              ? {
                  numberOfCards: Math.min(Math.max(flashcardCount, 1), 50),
                  difficulty: practiceDifficulty,
                }
              : undefined,
      });

      messageRequestRef.current += 1;
      setMessages((prev) => sortMessages([...prev, result.userMessage, result.aiMessage]));
      setDraftMessage("");
      setActiveSessionId(targetSession.id);
      setActiveSession((current) => current ?? targetSession);

      if (result.aiMessage.practiceType && result.aiMessage.practiceStatus === "READY") {
        Notify.success(`Đã tạo ${getPracticeTypeLabel(result.aiMessage.practiceType).toLowerCase()} thành công.`);
      } else if (result.aiMessage.practiceType && result.aiMessage.practiceStatus === "FAILED") {
        Notify.warning("AI đã phản hồi nhưng draft practice chưa hợp lệ. Hãy xem chi tiết lỗi trong chat.");
      } else {
        Notify.success("AI đã phản hồi.");
      }
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
            BE-017 • BE-018 • BE-055 đã kết nối
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
                  whileHover={{
                    x: 4,
                    backgroundColor: session.id === activeSessionId ? "#e2e8f0" : "#e8eef8",
                  }}
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
            <div className="header-title">{activeSession?.title || "AI Session Workspace"}</div>
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
          {errorMessage && <div className="chat-alert error">{errorMessage}</div>}

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
              <p>
                Tạo hoặc chọn notebook trước, sau đó bạn có thể hỏi trực tiếp để backend dùng
                Chat/RAG và practice draft flow mới nhất.
              </p>
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
              <p>
                Nhập câu hỏi ở khung bên dưới để tự tạo session mới, hoặc dùng nút ở sidebar để mở
                phiên chat trước.
              </p>
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
                    Chat/RAG + Practice sẵn sàng
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
                    <span className="meta-box-label">Nguồn RAG</span>
                    <strong>{attachedDocuments.length} tài liệu đang gắn</strong>
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
                  <p>
                    Phiên chat đã sẵn sàng. Bạn có thể hỏi trực tiếp, hoặc chuyển sang Quiz Draft /
                    Flashcard Draft để BE-055 sinh practice payload ngay trong chat.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((message) => {
                    const isUser = message.senderRole === "USER";
                    const practiceStatusMeta = getPracticeStatusMeta(message.practiceStatus);
                    const importedTarget = describeImportedTarget(message);
                    const validationMessages = summarizeValidationErrors(message.validationErrors);
                    const generatedCount = getPayloadItemCount(message.generatedPayload);
                    const generatedLabel = getPayloadItemLabel(message.generatedPayload);

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

                            {!isUser && message.practiceType && (
                              <div className="practice-message-card">
                                <div className="practice-message-head">
                                  <span className="practice-type-chip">
                                    <Sparkles size={12} />
                                    {getPracticeTypeLabel(message.practiceType)}
                                  </span>
                                  <span className={`practice-status-chip ${practiceStatusMeta.className}`}>
                                    {practiceStatusMeta.label}
                                  </span>
                                </div>

                                {message.generatedPayload && (
                                  <div className="practice-summary-line">
                                    <strong>{message.generatedPayload.title}</strong>
                                    <span>
                                      {generatedCount} {generatedLabel}
                                    </span>
                                  </div>
                                )}

                                {importedTarget && (
                                  <div className="practice-imported-line">
                                    Đã import vào <strong>{importedTarget}</strong>
                                    {message.importedAt ? ` lúc ${formatSessionTime(message.importedAt)}` : ""}
                                  </div>
                                )}

                                {validationMessages.length > 0 && (
                                  <div className="practice-error-box">
                                    {validationMessages.slice(0, 4).map((item, index) => (
                                      <p key={`${message.id}-validation-${index}`}>{item}</p>
                                    ))}
                                  </div>
                                )}

                                <div className="practice-action-row">
                                  <button
                                    type="button"
                                    className="practice-action-btn"
                                    onClick={() => void handleOpenPracticePreview(message)}
                                    disabled={!canPreviewPractice(message)}
                                  >
                                    Xem draft
                                  </button>
                                  <button
                                    type="button"
                                    className="practice-action-btn primary"
                                    onClick={() => setImportingMessage(message)}
                                    disabled={!canImportPractice(message)}
                                  >
                                    Import
                                  </button>
                                </div>
                              </div>
                            )}

                            {!isUser && message.citedSources?.length > 0 && (
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

          <div className="composer-mode-row">
            <button
              type="button"
              className={`composer-mode-pill ${composerMode === "CHAT" ? "active" : ""}`}
              onClick={() => setComposerMode("CHAT")}
            >
              Chat thường
            </button>
            <button
              type="button"
              className={`composer-mode-pill ${composerMode === "QUIZ" ? "active" : ""}`}
              onClick={() => setComposerMode("QUIZ")}
            >
              Quiz Draft
            </button>
            <button
              type="button"
              className={`composer-mode-pill ${composerMode === "FLASHCARD" ? "active" : ""}`}
              onClick={() => setComposerMode("FLASHCARD")}
            >
              Flashcard Draft
            </button>
          </div>

          <div className="composer-subhint">{getPracticePromptHint(composerMode)}</div>

          {composerMode !== "CHAT" && (
            <div className="practice-config-panel">
              <label>
                <span>Ngôn ngữ</span>
                <select
                  value={practiceLanguage}
                  onChange={(event) => setPracticeLanguage(event.target.value)}
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </label>

              <label>
                <span>Độ khó</span>
                <select
                  value={practiceDifficulty}
                  onChange={(event) => setPracticeDifficulty(event.target.value as AiPracticeDifficulty)}
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </label>

              {composerMode === "QUIZ" ? (
                <>
                  <label>
                    <span>Số câu</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={quizQuestionCount}
                      onChange={(event) => setQuizQuestionCount(Number(event.target.value) || 10)}
                    />
                  </label>

                  <label>
                    <span>Loại câu hỏi</span>
                    <select
                      value={quizQuestionType}
                      onChange={(event) => setQuizQuestionType(event.target.value as QuizQuestionType)}
                    >
                      <option value="SINGLE_CHOICE">SINGLE_CHOICE</option>
                      <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
                    </select>
                  </label>
                </>
              ) : (
                <label>
                  <span>Số thẻ</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={flashcardCount}
                    onChange={(event) => setFlashcardCount(Number(event.target.value) || 20)}
                  />
                </label>
              )}
            </div>
          )}

          <div className="composer-context-row">
            <span className="composer-context-pill">
              {attachedDocumentIds.length} tài liệu sẽ được gửi theo `documentIds`
            </span>
            <span className="composer-context-pill">
              {composerMode === "CHAT" ? "topK = 3" : "topK = 8"}
            </span>
          </div>

          <div className="input-container">
            <input
              type="text"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              placeholder={getPracticePlaceholder(composerMode, Boolean(activeNotebook))}
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

      <AnimatePresence>
        {previewState.message && (
          <PracticePreviewModal
            state={previewState}
            onClose={() =>
              setPreviewState({ message: null, payload: null, loading: false, error: "" })
            }
            onImport={(message) => {
              setPreviewState({ message: null, payload: null, loading: false, error: "" });
              setImportingMessage(message);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {importingMessage && (
          <PracticeImportModal
            message={importingMessage}
            notebook={activeNotebook}
            accessToken={accessToken}
            onClose={() => setImportingMessage(null)}
            onImported={handlePracticeImported}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
