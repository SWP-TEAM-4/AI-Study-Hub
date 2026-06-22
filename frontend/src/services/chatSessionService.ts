import type { ApiResponse } from "./authService";
import type { PaginationData } from "./documentService";

const BASE_URL = "http://localhost:8080/api";

export type ChatMessageType = "TEXT" | "QUIZ_DRAFT" | "FLASHCARD_DRAFT";
export type AiPracticeType = "QUIZ" | "FLASHCARD";
export type PracticeStatus = "NONE" | "READY" | "IMPORTED" | "FAILED";
export type PracticeImportTargetMode = "CREATE_NEW" | "APPEND_EXISTING";
export type PracticeImportTargetType = "QUIZ" | "FLASHCARD_DECK";
export type AiPracticeDifficulty = "EASY" | "MEDIUM" | "HARD";
export type QuizQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE";

export interface ChatSessionItem {
  id: number;
  notebookId: number;
  userId: number;
  title: string;
  createdAt: string;
}

export interface CreateChatSessionRequest {
  title: string;
}

export interface DeleteChatSessionResponse {
  deleted: boolean;
}

export interface ChatMessageCitationItem {
  documentId: number;
  documentTitle: string;
  chunkIndex: number;
  sourcePage?: number | null;
  excerpt: string;
}

export interface PracticeSourceRef {
  documentId?: number | null;
  chunkIndex?: number | null;
  sourcePage?: number | null;
  excerpt?: string | null;
}

export interface PracticeGenerationMetadata {
  language?: string | null;
  difficulty?: AiPracticeDifficulty | null;
  requestedQuestionCount?: number | null;
  generatedQuestionCount?: number | null;
  requestedCardCount?: number | null;
  generatedCardCount?: number | null;
  warnings?: string[] | null;
}

export interface QuizGeneratedOption {
  optionText: string;
  isCorrect: boolean;
}

export interface QuizGeneratedQuestion {
  questionText: string;
  questionType: QuizQuestionType;
  explanation?: string | null;
  options: QuizGeneratedOption[];
  sourceRefs?: PracticeSourceRef[] | null;
}

export interface QuizGeneratedPayload {
  type: "QUIZ";
  title: string;
  description?: string | null;
  metadata?: PracticeGenerationMetadata | null;
  questions: QuizGeneratedQuestion[];
}

export interface FlashcardGeneratedCard {
  frontText: string;
  backText: string;
  sourceRefs?: PracticeSourceRef[] | null;
}

export interface FlashcardGeneratedPayload {
  type: "FLASHCARD";
  title: string;
  description?: string | null;
  metadata?: PracticeGenerationMetadata | null;
  cards: FlashcardGeneratedCard[];
}

export type PracticeGeneratedPayload = QuizGeneratedPayload | FlashcardGeneratedPayload;

export interface ChatMessageItem {
  id: number;
  sessionId: number;
  messageSequence: number;
  senderRole: "USER" | "AI";
  messageType?: ChatMessageType | null;
  practiceType?: AiPracticeType | null;
  practiceStatus?: PracticeStatus | null;
  content: string;
  citedSources: ChatMessageCitationItem[];
  generatedPayload?: PracticeGeneratedPayload | null;
  validationErrors?: unknown;
  importedTargetType?: PracticeImportTargetType | null;
  importedTargetId?: number | null;
  importedAt?: string | null;
  createdAt: string;
}

export interface PracticeGenerationOptions {
  numberOfQuestions?: number;
  numberOfCards?: number;
  questionType?: QuizQuestionType;
  difficulty?: AiPracticeDifficulty;
}

export interface SendChatMessageRequest {
  content: string;
  topK?: number;
  documentIds?: number[];
  language?: string;
  options?: PracticeGenerationOptions;
}

export interface SendChatMessageResponse {
  userMessage: ChatMessageItem;
  aiMessage: ChatMessageItem;
}

export interface PracticeImportTarget {
  title?: string;
  description?: string;
  quizId?: number;
  deckId?: number;
  notebookId?: number;
  subjectId?: number;
  visibility?: "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";
}

export interface PracticeImportOptions {
  skipDuplicateQuestions?: boolean;
  skipDuplicateCards?: boolean;
  shuffleQuestions?: boolean;
}

export interface PracticeImportRequest {
  targetMode: PracticeImportTargetMode;
  target: PracticeImportTarget;
  importOptions?: PracticeImportOptions;
}

export interface PracticeImportResponse {
  messageId: number;
  practiceType: AiPracticeType;
  targetMode: PracticeImportTargetMode;
  targetType: PracticeImportTargetType;
  targetId: number;
  createdQuizId?: number | null;
  createdDeckId?: number | null;
  createdQuestions?: number | null;
  createdOptions?: number | null;
  createdCards?: number | null;
  skippedDuplicates?: number | null;
  practiceStatus: PracticeStatus;
  importedAt?: string | null;
}

const CHAT_SESSION_ERROR_MESSAGES: Record<string, string> = {
  CHAT_SESSION_NOT_FOUND: "Không tìm thấy phiên chat.",
  CHAT_MESSAGE_NOT_FOUND: "Không tìm thấy chat message.",
  CHAT_SESSION_ACCESS_DENIED: "Bạn không có quyền truy cập phiên chat này.",
  NOTEBOOK_NOT_FOUND: "Notebook không tồn tại.",
  NOTEBOOK_ACCESS_DENIED: "Bạn không có quyền truy cập notebook này.",
  DOCUMENT_ACCESS_DENIED: "Một hoặc nhiều tài liệu không thuộc notebook hiện tại.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  ACCESS_DENIED: "Bạn không có quyền thực hiện thao tác này.",
  VALIDATION_ERROR: "Dữ liệu phiên chat không hợp lệ.",
  AI_PRACTICE_TYPE_INVALID: "Prefix practice không hợp lệ. Hãy dùng [QUIZ] hoặc [FLASHCARD].",
  AI_PRACTICE_GENERATION_FAILED: "AI không thể tạo practice draft lúc này.",
  AI_PRACTICE_INVALID_JSON: "AI trả về JSON không hợp lệ.",
  AI_PRACTICE_SCHEMA_INVALID: "AI đã tạo draft nhưng payload chưa đúng schema.",
  CHAT_MESSAGE_NOT_PRACTICE_DRAFT: "Message này không phải practice draft.",
  PRACTICE_DRAFT_ALREADY_IMPORTED: "Draft này đã được import trước đó.",
  PRACTICE_DRAFT_NOT_READY: "Draft này chưa sẵn sàng để xem hoặc import.",
  PRACTICE_IMPORT_TARGET_INVALID: "Dữ liệu target import chưa hợp lệ.",
  PRACTICE_IMPORT_PERMISSION_DENIED: "Bạn không có quyền import vào target này.",
  PRACTICE_IMPORT_DUPLICATE_ITEM: "Dữ liệu import có nội dung trùng lặp.",
};

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleApiError(response: Response, fallback: string): Promise<never> {
  let body: ApiResponse<unknown> | null = null;
  try {
    body = await response.json();
  } catch {
    // ignore
  }

  if (body?.errorCode && CHAT_SESSION_ERROR_MESSAGES[body.errorCode]) {
    throw new Error(CHAT_SESSION_ERROR_MESSAGES[body.errorCode]);
  }
  if (body?.message) {
    throw new Error(body.message);
  }
  throw new Error(fallback);
}

export async function getChatSessions(
  notebookId: number,
  page = 0,
  size = 20
): Promise<PaginationData<ChatSessionItem>> {
  let response: Response;
  try {
    response = await fetch(
      `${BASE_URL}/notebooks/${notebookId}/chat-sessions?page=${page}&size=${size}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
  } catch {
    throw new Error("Không thể kết nối đến server để tải phiên chat.");
  }

  if (!response.ok) {
    await handleApiError(response, "Không thể tải danh sách phiên chat.");
  }

  const body: ApiResponse<PaginationData<ChatSessionItem>> = await response.json();
  return body.data ?? {
    items: [],
    page,
    size,
    totalElements: 0,
    totalPages: 0,
  };
}

export async function createChatSession(
  notebookId: number,
  request: CreateChatSessionRequest
): Promise<ChatSessionItem> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/notebooks/${notebookId}/chat-sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Không thể kết nối đến server để tạo phiên chat.");
  }

  if (!response.ok) {
    await handleApiError(response, "Tạo phiên chat thất bại.");
  }

  const body: ApiResponse<ChatSessionItem> = await response.json();
  return body.data!;
}

export async function getChatSession(sessionId: number): Promise<ChatSessionItem> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat-sessions/${sessionId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server để tải chi tiết phiên chat.");
  }

  if (!response.ok) {
    await handleApiError(response, "Không thể tải chi tiết phiên chat.");
  }

  const body: ApiResponse<ChatSessionItem> = await response.json();
  return body.data!;
}

export async function deleteChatSession(sessionId: number): Promise<DeleteChatSessionResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat-sessions/${sessionId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server để xóa phiên chat.");
  }

  if (!response.ok) {
    await handleApiError(response, "Xóa phiên chat thất bại.");
  }

  const body: ApiResponse<DeleteChatSessionResponse> = await response.json();
  return body.data!;
}

export async function getChatMessages(sessionId: number): Promise<ChatMessageItem[]> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat-sessions/${sessionId}/messages`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server để tải lịch sử chat.");
  }

  if (!response.ok) {
    await handleApiError(response, "Không thể tải lịch sử chat.");
  }

  const body: ApiResponse<ChatMessageItem[]> = await response.json();
  return Array.isArray(body.data) ? body.data : [];
}

export async function sendChatMessage(
  sessionId: number,
  request: SendChatMessageRequest
): Promise<SendChatMessageResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat-sessions/${sessionId}/messages`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Không thể kết nối đến server để gửi câu hỏi.");
  }

  if (!response.ok) {
    await handleApiError(response, "Gửi câu hỏi thất bại.");
  }

  const body: ApiResponse<SendChatMessageResponse> = await response.json();
  return body.data!;
}

export async function getPracticeDraft(messageId: number): Promise<PracticeGeneratedPayload> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat-messages/${messageId}/practice-draft`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server để tải practice draft.");
  }

  if (!response.ok) {
    await handleApiError(response, "Không thể tải practice draft.");
  }

  const body: ApiResponse<PracticeGeneratedPayload> = await response.json();
  return body.data!;
}

export async function importPracticeDraft(
  messageId: number,
  request: PracticeImportRequest
): Promise<PracticeImportResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat-messages/${messageId}/practice-import`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Không thể kết nối đến server để import practice draft.");
  }

  if (!response.ok) {
    await handleApiError(response, "Import practice draft thất bại.");
  }

  const body: ApiResponse<PracticeImportResponse> = await response.json();
  return body.data!;
}
