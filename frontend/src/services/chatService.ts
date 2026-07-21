import { safeLocalStorage } from "../utils/safeStorage";
import { safeParseJson } from "../utils/safeParseJson";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ChatSessionDTO {
  id: number;
  notebookId: number;
  userId: number;
  title: string;
  createdAt: string;
}

export interface CitedSourceDTO {
  documentId: number;
  documentTitle: string;
  chunkIndex: number;
  sourcePage: number | null;
  excerpt: string;
}

export interface PracticeSourceRefDTO {
  documentId: number;
  chunkIndex: number;
  sourcePage: number | null;
  excerpt: string;
}

export interface PracticeMetadataDTO {
  language?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  requestedQuestionCount?: number | null;
  generatedQuestionCount?: number | null;
  requestedCardCount?: number | null;
  generatedCardCount?: number | null;
  warnings?: string[];
}

export interface QuizDraftQuestionDTO {
  questionText: string;
  questionType: string;
  explanation?: string;
  options: Array<{ optionText: string; isCorrect: boolean }>;
  sourceRefs?: PracticeSourceRefDTO[];
}

export interface FlashcardDraftCardDTO {
  frontText: string;
  backText: string;
  sourceRefs?: PracticeSourceRefDTO[];
}

export type PracticeDraftDTO =
  | { type: "QUIZ"; title: string; description?: string; metadata?: PracticeMetadataDTO; questions: QuizDraftQuestionDTO[] }
  | { type: "FLASHCARD"; title: string; description?: string; metadata?: PracticeMetadataDTO; cards: FlashcardDraftCardDTO[] };

export interface MessageDTO {
  id: number;
  sessionId: number;
  messageSequence: number;
  senderRole: "USER" | "AI";
  messageType?: "TEXT" | "QUIZ_DRAFT" | "FLASHCARD_DRAFT";
  practiceType?: "QUIZ" | "FLASHCARD" | null;
  practiceStatus?: "NONE" | "READY" | "IMPORTED" | "FAILED";
  content: string;
  citedSources: CitedSourceDTO[];
  generatedPayload?: PracticeDraftDTO | null;
  validationErrors?: unknown;
  importedTargetType?: "QUIZ" | "FLASHCARD_DECK" | null;
  importedTargetId?: number | null;
  importedAt?: string | null;
  createdAt: string;
}

export interface PracticeImportPayload {
  targetMode: "CREATE_NEW" | "ADD_TO_EXISTING" | string;
  target: {
    title: string;
    description: string;
    visibility: "PRIVATE" | "WORKSPACE" | "MARKETPLACE" | string;
  };
  importOptions?: {
    skipDuplicateQuestions?: boolean;
    shuffleQuestions?: boolean;
  };
}

export interface PracticeImportResponseDTO {
  messageId: number;
  practiceType: string;
  targetMode: string;
  targetType: string;
  targetId: number;
  createdQuizId?: number;
  createdDeckId?: number;
  createdQuestions?: number;
  createdOptions?: number;
  createdCards?: number;
  skippedDuplicates?: number;
  practiceStatus: string;
  importedAt: string;
}

export interface ChatResponseData {
  userMessage: MessageDTO;
  aiMessage: MessageDTO;
}

export interface SendMessageRequest {
  content: string;
  documentIds?: number[];
  topK?: number;
  language?: string;
  options?: {
    numberOfQuestions?: number;
    numberOfCards?: number;
    questionType?: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";
    difficulty?: "EASY" | "MEDIUM" | "HARD";
  };
}

export interface PracticeImportRequest {
  targetMode: "CREATE_NEW" | "APPEND_EXISTING";
  target: {
    title?: string;
    description?: string;
    notebookId?: number;
    subjectId?: number;
    visibility?: "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";
    quizId?: number;
    deckId?: number;
  };
  importOptions?: {
    skipDuplicateQuestions?: boolean;
    shuffleQuestions?: boolean;
    skipDuplicateCards?: boolean;
  };
}

export interface PracticeImportResponse {
  messageId: number;
  practiceType: "QUIZ" | "FLASHCARD";
  targetMode: "CREATE_NEW" | "APPEND_EXISTING";
  targetType: "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  createdQuizId?: number | null;
  createdDeckId?: number | null;
  createdQuestions: number;
  createdOptions: number;
  createdCards: number;
  skippedDuplicates: number;
  practiceStatus: "IMPORTED";
  importedAt: string;
}

export interface RelatedQuizDTO { id: number; notebookId?: number | null; title: string; }
export interface RelatedDeckDTO { id: number; notebookId?: number | null; title: string; cards?: unknown[]; }

const BASE_URL = "/api";

async function chatRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = safeLocalStorage.getItem("auth_token");
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token.replace(/['\"]+/g, "")}`);
  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  let result: any = {};
  result = safeParseJson<any>(text, {});

  if (response.status === 401) {
    safeLocalStorage.removeItem("auth_token");
    safeLocalStorage.removeItem("auth_user");
    safeLocalStorage.removeItem("auth-storage");
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw { status: 401, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." };
  }
  if (!response.ok) {
    throw { status: response.status, message: result.message || "Lỗi giao tiếp Chat API", errorCode: result.errorCode || "CHAT_ERROR" };
  }
  return result;
}

export const chatService = {
  async deleteChatSession(sessionId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return chatRequest(`/chat-sessions/${sessionId}`, { method: "DELETE" });
  },
  async getChatSessionDetails(sessionId: number): Promise<ApiResponse<ChatSessionDTO>> {
    return chatRequest(`/chat-sessions/${sessionId}`, { method: "GET" });
  },
  async getChatMessages(sessionId: number): Promise<ApiResponse<MessageDTO[]>> {
    return chatRequest(`/chat-sessions/${sessionId}/messages`, { method: "GET" });
  },
  async sendMessage(
    sessionId: number,
    payload: SendMessageRequest | string,
    topKOrSignal?: number | AbortSignal,
    legacySignal?: AbortSignal,
  ): Promise<ApiResponse<ChatResponseData>> {
    const request = typeof payload === "string"
      ? { content: payload, topK: typeof topKOrSignal === "number" ? topKOrSignal : 3 }
      : payload;
    const signal = topKOrSignal instanceof AbortSignal ? topKOrSignal : legacySignal;
    return chatRequest(`/chat-sessions/${sessionId}/messages`, { method: "POST", body: JSON.stringify(request), signal });
  },
  async getNotebookChatSessions(notebookId: number, page = 0, size = 20): Promise<ApiResponse<PaginatedResponse<ChatSessionDTO>>> {
    return chatRequest(`/notebooks/${notebookId}/chat-sessions?page=${page}&size=${size}`, { method: "GET" });
  },
  async createChatSession(notebookId: number, title: string): Promise<ApiResponse<ChatSessionDTO>> {
    return chatRequest(`/notebooks/${notebookId}/chat-sessions`, { method: "POST", body: JSON.stringify({ title }) });
  },
  async previewPracticeDraft(messageId: number): Promise<ApiResponse<PracticeDraftDTO>> {
    return chatRequest(`/chat-messages/${messageId}/practice-draft`, { method: "GET" });
  },
  async importPracticeDraft(messageId: number, payload: PracticeImportRequest): Promise<ApiResponse<PracticeImportResponse>> {
    return chatRequest(`/chat-messages/${messageId}/practice-import`, { method: "POST", body: JSON.stringify(payload) });
  },
  async getNotebookQuizzes(notebookId: number): Promise<RelatedQuizDTO[]> {
    const response = await chatRequest<ApiResponse<PaginatedResponse<RelatedQuizDTO>>>(`/quizzes?notebookId=${notebookId}&page=0&size=50`);
    return response.data?.items ?? [];
  },
  async getNotebookDecks(notebookId: number): Promise<RelatedDeckDTO[]> {
    const response = await chatRequest<ApiResponse<PaginatedResponse<RelatedDeckDTO>>>(`/flashcard-decks?page=0&size=50`);
    return (response.data?.items ?? []).filter((deck) => Number(deck.notebookId) === notebookId);
  },
};
