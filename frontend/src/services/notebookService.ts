import { ApiResponse, PaginatedResponse } from "./types";

export interface NotebookDTO {
  id: number;
  userId?: number;
  subjectId: number;
  subjectCode?: string;
  title: string;
  documentCount: number;
  createdAt: string;
  color?: string;
}

const BASE_URL = "/api";

type BackendNotebookResponse = {
  id: number;
  title: string;
  subjectId: number;
  subjectCode?: string;
  documentCount?: number;
  createdAt: string;
};

async function nbRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
    throw { status: 401, message: "Phien dang nhap da het han, vui long dang nhap lai." };
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Loi giao tiep API Notebook",
      errorCode: result.errorCode || "NOTEBOOK_ERROR",
    };
  }

  return result;
}

function getUserId(): number {
  try {
    const userStr = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
    if (userStr && userStr !== "undefined") {
      const user = JSON.parse(userStr);
      const userId = Number(user.userId ?? user.id);
      if (Number.isFinite(userId) && userId > 0) return userId;
    }

    const persistedAuth = typeof window !== "undefined" ? localStorage.getItem("auth-storage") : null;
    if (persistedAuth && persistedAuth !== "undefined") {
      const parsed = JSON.parse(persistedAuth);
      const user = parsed?.state?.user;
      const userId = Number(user?.userId ?? user?.id);
      if (Number.isFinite(userId) && userId > 0) return userId;
    }
  } catch (e) {
    console.error("Error parsing auth_user in getUserId:", e);
  }

  throw {
    status: 401,
    message: "Không xác định được userId hiện tại. Vui lòng đăng nhập lại trước khi dùng Notebook.",
    errorCode: "AUTH_USER_NOT_FOUND",
  };
}

function normalizeNotebook(item: BackendNotebookResponse): NotebookDTO {
  return {
    ...item,
    subjectCode: item.subjectCode,
    documentCount: item.documentCount ?? 0,
    color: String((Number(item.id) * 47) % 360),
  };
}

function toPaginatedNotebooks(
  response: ApiResponse<BackendNotebookResponse[] | PaginatedResponse<BackendNotebookResponse>>,
  page: number,
  size: number,
): ApiResponse<PaginatedResponse<NotebookDTO>> {
  const data = response.data;

  if (Array.isArray(data)) {
    const items = data.map(normalizeNotebook);
    return {
      success: response.success,
      message: response.message,
      data: {
        items,
        page,
        size,
        totalElements: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / size)),
      },
    };
  }

  return {
    success: response.success,
    message: response.message,
    data: {
      ...data,
      items: data.items.map(normalizeNotebook),
    },
  };
}

async function hydrateDocumentCounts(items: NotebookDTO[]): Promise<NotebookDTO[]> {
  return Promise.all(
    items.map(async (notebook) => {
      if (notebook.documentCount > 0) return notebook;

      const res = await nbRequest<ApiResponse<PaginatedResponse<unknown>>>(`/notebooks/${notebook.id}/documents?page=0&size=1`, { method: "GET" });
      return {
        ...notebook,
        documentCount: res.data?.totalElements ?? notebook.documentCount,
      };
    }),
  );
}

export const notebookService = {
  async getNotebooks(page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<NotebookDTO>>> {
    const userId = getUserId();
    const res = await nbRequest<ApiResponse<BackendNotebookResponse[] | PaginatedResponse<BackendNotebookResponse>>>(
      `/notebooks?userId=${userId}`,
      { method: "GET" },
    );
    const normalized = toPaginatedNotebooks(res, page, size);
    const items = await hydrateDocumentCounts(normalized.data.items);
    return {
      ...normalized,
      data: {
        ...normalized.data,
        items,
      },
    };
  },

  async getNotebookDetails(id: number): Promise<ApiResponse<NotebookDTO>> {
    const userId = getUserId();
    const res = await nbRequest<ApiResponse<BackendNotebookResponse>>(`/notebooks/${id}?userId=${userId}`, { method: "GET" });
    return { ...res, data: normalizeNotebook(res.data) };
  },

  async createNotebook(subjectId: number, title: string): Promise<ApiResponse<NotebookDTO>> {
    const userId = getUserId();
    const res = await nbRequest<ApiResponse<BackendNotebookResponse>>(`/notebooks?userId=${userId}`, {
      method: "POST",
      body: JSON.stringify({ subjectId, title }),
    });
    return { ...res, data: normalizeNotebook(res.data) };
  },

  async updateNotebook(id: number, subjectId: number, title: string): Promise<ApiResponse<NotebookDTO>> {
    const userId = getUserId();
    const res = await nbRequest<ApiResponse<BackendNotebookResponse>>(`/notebooks/${id}?userId=${userId}`, {
      method: "PUT",
      body: JSON.stringify({ subjectId, title }),
    });
    return { ...res, data: normalizeNotebook(res.data) };
  },

  async deleteNotebook(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    const userId = getUserId();
    const res = await nbRequest<ApiResponse<void | { deleted: boolean }>>(`/notebooks/${id}?userId=${userId}`, { method: "DELETE" });
    return {
      success: res.success,
      message: res.message,
      data: res.data ?? { deleted: true },
    };
  },
};
