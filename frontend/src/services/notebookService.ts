import { ApiResponse, PaginatedResponse } from "./types";

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface NotebookDTO {
  id: number;
  userId: number;
  subjectId: number;
  subjectCode: string;
  title: string;
  documentCount: number;
  createdAt: string;
  // Bổ sung cho giao diện
  color?: string;
}

// ─── BASE REQUEST ────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function nbRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Lỗi giao tiếp API Notebook",
      errorCode: result.errorCode || "NOTEBOOK_ERROR"
    };
  }
  return result;
}

// ─── MOCK DATA FALLBACKS ─────────────────────────────────────────────────────

let mockNotebooks: NotebookDTO[] = [
  {
    id: 101,
    userId: 1,
    subjectId: 12,
    subjectCode: "SWR302",
    title: "SWR302 - Requirements Engineering",
    documentCount: 3,
    createdAt: "2026-06-12T21:40:00",
    color: "250"
  },
  {
    id: 102,
    userId: 1,
    subjectId: 5,
    subjectCode: "PRN221",
    title: "C# Advanced Techniques",
    documentCount: 5,
    createdAt: "2026-06-10T09:15:00",
    color: "330"
  }
];

// Mảng môn học ảo dùng để mock
const MOCK_SUBJECTS = {
  12: "SWR302",
  5: "PRN221",
  1: "SWP391",
  2: "SWT301",
  3: "PRJ301"
};

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

function getUserId(): number {
  try {
    const userStr = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
    if (userStr && userStr !== "undefined") {
      const user = JSON.parse(userStr);
      return user.id || user.userId || 1;
    }
  } catch (e) {
    console.error("Error parsing auth_user in getUserId:", e);
  }
  return 1;
}

export const notebookService = {
  async getNotebooks(page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<NotebookDTO>>> {
    try {
      const userId = getUserId();
      const res = await nbRequest<ApiResponse<PaginatedResponse<NotebookDTO>>>(`/notebooks?page=${page}&size=${size}&userId=${userId}`, { method: "GET" });
      if (!res.data || !res.data.items || res.data.items.length === 0) {
        return {
          success: true,
          message: "Success (Mock)",
          data: { items: mockNotebooks, page, size, totalElements: mockNotebooks.length, totalPages: 1 }
        };
      }
      return res;
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        res({
          success: true,
          message: "Success",
          data: {
            items: mockNotebooks,
            page, size, totalElements: mockNotebooks.length, totalPages: 1
          }
        });
      }, 300));
    }
  },

  async getNotebookDetails(id: number): Promise<ApiResponse<NotebookDTO>> {
    try {
      const userId = getUserId();
      return await nbRequest(`/notebooks/${id}?userId=${userId}`, { method: "GET" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const item = mockNotebooks.find(n => n.id === id);
        if (item) res({ success: true, message: "Success", data: item });
        else rej({ message: "Not found" });
      }, 200));
    }
  },

  async createNotebook(subjectId: number, title: string): Promise<ApiResponse<NotebookDTO>> {
    try {
      const userId = getUserId();
      return await nbRequest(`/notebooks?userId=${userId}`, {
        method: "POST",
        body: JSON.stringify({ subjectId, title })
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const newNb: NotebookDTO = {
          id: Date.now(),
          userId: 1,
          subjectId,
          subjectCode: MOCK_SUBJECTS[subjectId as keyof typeof MOCK_SUBJECTS] || "UNKNOWN",
          title,
          documentCount: 0,
          createdAt: new Date().toISOString(),
          color: Math.floor(Math.random() * 360).toString()
        };
        mockNotebooks.push(newNb);
        res({ success: true, message: "Success", data: newNb });
      }, 400));
    }
  },

  async updateNotebook(id: number, subjectId: number, title: string): Promise<ApiResponse<NotebookDTO>> {
    try {
      const userId = getUserId();
      return await nbRequest(`/notebooks/${id}?userId=${userId}`, {
        method: "PUT",
        body: JSON.stringify({ subjectId, title })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockNotebooks.findIndex(n => n.id === id);
        if (idx === -1) return rej({ message: "Not found" });
        mockNotebooks[idx] = {
          ...mockNotebooks[idx],
          subjectId,
          subjectCode: MOCK_SUBJECTS[subjectId as keyof typeof MOCK_SUBJECTS] || mockNotebooks[idx].subjectCode,
          title
        };
        res({ success: true, message: "Success", data: mockNotebooks[idx] });
      }, 300));
    }
  },

  async deleteNotebook(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const userId = getUserId();
      return await nbRequest(`/notebooks/${id}?userId=${userId}`, { method: "DELETE" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        mockNotebooks = mockNotebooks.filter(n => n.id !== id);
        res({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 300));
    }
  }
};
