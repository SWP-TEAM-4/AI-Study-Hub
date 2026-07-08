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
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
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
<<<<<<< HEAD
=======
=======
  senderRole: "USER" | "AI" | string;
  messageType?: "TEXT" | "PRACTICE_DRAFT" | string;
  practiceType?: "QUIZ" | "FLASHCARD_DECK" | "NONE" | string;
  practiceStatus?: "NONE" | "GENERATED" | "IMPORTED" | string;
  content: string;
  citedSources: CitedSourceDTO[];
  generatedPayload?: string;
  validationErrors?: string;
  importedTargetType?: "QUIZ" | "FLASHCARD_DECK" | string;
  importedTargetId?: number;
  importedAt?: string;
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
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
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token.replace(/['\"]+/g, "")}`);
  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  let result: any = {};
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    throw { status: response.status, message: "Backend trả về JSON không hợp lệ", errorCode: "INVALID_RESPONSE" };
<<<<<<< HEAD
=======
=======
  if (text && text.trim().length > 0) {
    try { result = JSON.parse(text); } catch { result = { message: text.substring(0, 200) }; }
  }

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth-storage");
      window.location.href = "/";
    }
    throw { status: 401, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." };
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
  }

  if (response.status === 401) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth-storage");
    window.location.href = "/";
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
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
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
<<<<<<< HEAD
=======
=======
    try {
      return await chatRequest(`/notebooks/${notebookId}/chat-sessions`, {
        method: "POST",
        body: JSON.stringify({ title })
      });
    } catch (err) {
      console.warn("Fallback: Create chat session", err);
      return new Promise(resolve => setTimeout(() => {
        const newSession: ChatSessionDTO = {
          id: Date.now(),
          notebookId,
          userId: 1, // mock user
          title,
          createdAt: new Date().toISOString()
        };
        mockSessions = [newSession, ...mockSessions];
        mockMessages[newSession.id] = [];
        resolve({ success: true, message: "Success", data: newSession });
      }, 400));
    } // <-- Sửa lỗi: Đóng ngoặc catch ở đây
  }, // <-- Sửa lỗi: Đóng ngoặc hàm ở đây
  // 7. GET /api/chat-messages/{messageId}/practice-draft
  async getPracticeDraft(messageId: number): Promise<ApiResponse<string>> {
    try {
      return await chatRequest(`/chat-messages/${messageId}/practice-draft`, { method: "GET" });
    } catch (err) {
      console.warn("Fallback: Get practice draft", err);
      return new Promise((resolve) => setTimeout(() => {
        const mockDraft = JSON.stringify({
          title: "Mock Quiz from Chat",
          description: "This is a mock draft generated from AI chat.",
          questions: [
            {
              questionText: "What does SRS stand for?",
              questionType: "SINGLE_CHOICE",
              options: [
                { optionText: "Software Requirement Specification", isCorrect: true },
                { optionText: "System Requirement Specification", isCorrect: false }
              ]
            }
          ]
        }, null, 2);
        resolve({ success: true, message: "Success", data: mockDraft });
      }, 500));
    }
  },

  // 8. POST /api/chat-messages/{messageId}/practice-import
  async importPracticeDraft(messageId: number, payload: PracticeImportPayload): Promise<ApiResponse<PracticeImportResponseDTO>> {
    try {
      return await chatRequest(`/chat-messages/${messageId}/practice-import`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Fallback: Import practice draft", err);
      return new Promise((resolve) => setTimeout(() => {
        const mockResponse: PracticeImportResponseDTO = {
          messageId,
          practiceType: "QUIZ",
          targetMode: payload.targetMode,
          targetType: "QUIZ",
          targetId: Math.floor(Math.random() * 1000),
          createdQuizId: Math.floor(Math.random() * 1000),
          createdQuestions: 5,
          createdOptions: 20,
          skippedDuplicates: 0,
          practiceStatus: "IMPORTED",
          importedAt: new Date().toISOString()
        };
        resolve({ success: true, message: "Import successful", data: mockResponse });
      }, 800));
    }
  } // <-- Sửa lỗi: Đóng ngoặc hàm importPracticeDraft ở đây
}; // <-- Sửa lỗi: Đóng ngoặc nhọn của đối tượng chatService tại đây
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
