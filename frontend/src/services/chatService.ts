// ─── TYPES ──────────────────────────────────────────────────────────────────

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

// ─── DTOS ───────────────────────────────────────────────────────────────────

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
  content: string;
  citedSources: CitedSourceDTO[];
  createdAt: string;
}

export interface ChatResponseData {
  userMessage: MessageDTO;
  aiMessage: MessageDTO;
}

// ─── BASE CONFIG ─────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function chatRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Lỗi giao tiếp Chat API",
      errorCode: result.errorCode || "CHAT_ERROR"
    };
  }
  return result;
}

// ─── MOCK DATA FALLBACKS ─────────────────────────────────────────────────────

let mockSessions: ChatSessionDTO[] = [
  { id: 301, notebookId: 101, userId: 1, title: "Ôn tập SRS", createdAt: "2026-06-12T21:55:00" },
  { id: 302, notebookId: 101, userId: 1, title: "Hỏi về UML Diagrams", createdAt: "2026-06-13T10:00:00" }
];

let mockMessages: Record<number, MessageDTO[]> = {
  301: [
    {
      id: 701,
      sessionId: 301,
      messageSequence: 1,
      senderRole: "USER",
      content: "SRS là gì?",
      citedSources: [],
      createdAt: "2026-06-12T21:56:00"
    },
    {
      id: 702,
      sessionId: 301,
      messageSequence: 2,
      senderRole: "AI",
      content: "SRS là tài liệu đặc tả yêu cầu phần mềm, mô tả chức năng, phi chức năng, ràng buộc và tiêu chí chấp nhận.",
      citedSources: [
        {
          documentId: 501,
          documentTitle: "Chapter 10 Requirement Specification",
          chunkIndex: 0,
          sourcePage: 12,
          excerpt: "Requirement specification should be clear..."
        }
      ],
      createdAt: "2026-06-12T21:56:04"
    }
  ]
};

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const chatService = {
  // 1. DELETE /api/chat-sessions/{sessionId}
  async deleteChatSession(sessionId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      return await chatRequest(`/chat-sessions/${sessionId}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Fallback: Delete chat session", err);
      return new Promise(resolve => setTimeout(() => {
        mockSessions = mockSessions.filter(s => s.id !== sessionId);
        delete mockMessages[sessionId];
        resolve({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 500));
    }
  },

  // 2. GET /api/chat-sessions/{sessionId}
  async getChatSessionDetails(sessionId: number): Promise<ApiResponse<ChatSessionDTO>> {
    try {
      return await chatRequest(`/chat-sessions/${sessionId}`, { method: "GET" });
    } catch (err) {
      console.warn("Fallback: Get chat session details", err);
      return new Promise((resolve, reject) => setTimeout(() => {
        const session = mockSessions.find(s => s.id === sessionId);
        if (session) resolve({ success: true, message: "Success", data: session });
        else reject({ message: "Session not found" });
      }, 300));
    }
  },

  // 3. GET /api/chat-sessions/{sessionId}/messages
  async getChatMessages(sessionId: number): Promise<ApiResponse<MessageDTO[]>> {
    try {
      return await chatRequest(`/chat-sessions/${sessionId}/messages`, { method: "GET" });
    } catch (err) {
      console.warn("Fallback: Get chat messages", err);
      return new Promise(resolve => setTimeout(() => {
        resolve({ success: true, message: "Success", data: mockMessages[sessionId] || [] });
      }, 400));
    }
  },

  // 4. POST /api/chat-sessions/{sessionId}/messages
  async sendMessage(sessionId: number, content: string, topK: number = 3, signal?: AbortSignal): Promise<ApiResponse<ChatResponseData>> {
    try {
      return await chatRequest(`/chat-sessions/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content, topK }),
        signal
      });
    } catch (err) {
      console.warn("Fallback: Send chat message", err);
      return new Promise(resolve => setTimeout(() => {
        const userMsgId = Math.floor(Math.random() * 1000000000);
        const userMsg: MessageDTO = {
          id: userMsgId,
          sessionId,
          messageSequence: (mockMessages[sessionId]?.length || 0) + 1,
          senderRole: "USER",
          content,
          citedSources: [],
          createdAt: new Date().toISOString()
        };

        const aiMsg: MessageDTO = {
          id: userMsgId + 1,
          sessionId,
          messageSequence: userMsg.messageSequence + 1,
          senderRole: "AI",
          content: `Đây là phản hồi AI mock cho câu hỏi: "${content}". Trong thực tế, AI sẽ tổng hợp từ ${topK} chunk tài liệu phù hợp nhất qua vector DB.`,
          citedSources: [
            {
              documentId: 501,
              documentTitle: "Chapter 10 Requirement Specification",
              chunkIndex: Math.floor(Math.random() * 10),
              sourcePage: Math.floor(Math.random() * 50) + 1,
              excerpt: "Tài liệu minh họa RAG từ hệ thống AI Study Hub."
            }
          ],
          createdAt: new Date(Date.now() + 2000).toISOString()
        };

        if (!mockMessages[sessionId]) mockMessages[sessionId] = [];
        mockMessages[sessionId].push(userMsg, aiMsg);

        resolve({
          success: true,
          message: "Success",
          data: { userMessage: userMsg, aiMessage: aiMsg }
        });
      }, 1500)); // Simulate AI thinking time
    }
  },

  // 5. GET /api/notebooks/{notebookId}/chat-sessions
  async getNotebookChatSessions(notebookId: number, page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<ChatSessionDTO>>> {
    try {
      return await chatRequest(`/notebooks/${notebookId}/chat-sessions?page=${page}&size=${size}`, { method: "GET" });
    } catch (err) {
      console.warn("Fallback: Get notebook chat sessions", err);
      return new Promise(resolve => setTimeout(() => {
        const items = mockSessions.filter(s => s.notebookId === notebookId);
        resolve({
          success: true,
          message: "Success",
          data: { items, page, size, totalElements: items.length, totalPages: 1 }
        });
      }, 300));
    }
  },

  // 6. POST /api/notebooks/{notebookId}/chat-sessions
  async createChatSession(notebookId: number, title: string): Promise<ApiResponse<ChatSessionDTO>> {
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
    }
  }
};
