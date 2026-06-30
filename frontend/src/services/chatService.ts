export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
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
  sourcePage: number;
  excerpt: string;
}

export interface MessageDTO {
  id: number;
  sessionId: number;
  messageSequence: number;
  senderRole: "USER" | "AI";
  messageType?: string;
  practiceType?: string | null;
  practiceStatus?: string | null;
  content: string;
  citedSources: CitedSourceDTO[];
  generatedPayload?: unknown;
  validationErrors?: unknown;
  importedTargetType?: string | null;
  importedTargetId?: number | null;
  importedAt?: string | null;
  createdAt: string;
}

export interface ChatResponseData {
  userMessage: MessageDTO;
  aiMessage: MessageDTO;
}

const BASE_URL = "/api";

async function chatRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);

  if (token) {
    const cleanToken = token.replace(/[\'"]+/g, "");
    headers.set("Authorization", `Bearer ${cleanToken}`);
  }

  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth-storage");
      window.location.href = "/";
    }
    throw { status: 401, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." };
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Lỗi giao tiếp Chat API",
      errorCode: result.errorCode || "CHAT_ERROR",
    };
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

  async sendMessage(sessionId: number, content: string, topK: number = 3, signal?: AbortSignal): Promise<ApiResponse<ChatResponseData>> {
    return chatRequest(`/chat-sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, topK }),
      signal,
    });
  },

  async getNotebookChatSessions(notebookId: number, page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<ChatSessionDTO>>> {
    return chatRequest(`/notebooks/${notebookId}/chat-sessions?page=${page}&size=${size}`, { method: "GET" });
  },

  async createChatSession(notebookId: number, title: string): Promise<ApiResponse<ChatSessionDTO>> {
    return chatRequest(`/notebooks/${notebookId}/chat-sessions`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  },
};
