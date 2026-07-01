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
  color?: string;
}

// ─── BASE REQUEST ────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function nbRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) {
    const cleanToken = token.replace(/['"]+/g, "");
    headers.set("Authorization", `Bearer ${cleanToken}`);
  }
  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  let result: any = {};
  if (text && text.trim().length > 0) {
    try {
      result = JSON.parse(text);
    } catch {
      result = { message: text.substring(0, 200) };
    }
  }

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
      message: result.message || "Lỗi giao tiếp API Notebook",
      errorCode: result.errorCode || "NOTEBOOK_ERROR",
    };
  }
  return result;
}

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const notebookService = {
  async getNotebooks(page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<NotebookDTO>>> {
    return await nbRequest<ApiResponse<PaginatedResponse<NotebookDTO>>>(`/notebooks?page=${page}&size=${size}`, {
      method: "GET",
    });
  },

  async getNotebookDetails(id: number): Promise<ApiResponse<NotebookDTO>> {
    return await nbRequest(`/notebooks/${id}`, { method: "GET" });
  },

  async createNotebook(subjectId: number, title: string): Promise<ApiResponse<NotebookDTO>> {
    return await nbRequest(`/notebooks`, {
      method: "POST",
      body: JSON.stringify({ subjectId, title }),
    });
  },

  async updateNotebook(
    id: number,
    subjectId: number,
    title: string
  ): Promise<ApiResponse<NotebookDTO>> {
    return await nbRequest(`/notebooks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ subjectId, title }),
    });
  },

  async deleteNotebook(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return await nbRequest(`/notebooks/${id}`, { method: "DELETE" });
  },
};
