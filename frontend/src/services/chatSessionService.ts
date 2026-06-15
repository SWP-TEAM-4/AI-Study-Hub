import type { ApiResponse } from "./authService";
import type { PaginationData } from "./documentService";

const BASE_URL = "http://localhost:8080/api";

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

export interface ChatMessageItem {
  id: number;
  sessionId: number;
  messageSequence: number;
  senderRole: "USER" | "AI";
  content: string;
  citedSources: ChatMessageCitationItem[];
  createdAt: string;
}

export interface SendChatMessageRequest {
  content: string;
  topK?: number;
}

export interface SendChatMessageResponse {
  userMessage: ChatMessageItem;
  aiMessage: ChatMessageItem;
}

const CHAT_SESSION_ERROR_MESSAGES: Record<string, string> = {
  CHAT_SESSION_NOT_FOUND: "Không tìm thấy phiên chat.",
  CHAT_SESSION_ACCESS_DENIED: "Bạn không có quyền truy cập phiên chat này.",
  NOTEBOOK_NOT_FOUND: "Notebook không tồn tại.",
  NOTEBOOK_ACCESS_DENIED: "Bạn không có quyền truy cập notebook này.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  ACCESS_DENIED: "Bạn không có quyền thực hiện thao tác này.",
  VALIDATION_ERROR: "Dữ liệu phiên chat không hợp lệ.",
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
