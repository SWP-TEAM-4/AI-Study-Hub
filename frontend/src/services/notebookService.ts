import { Notify } from "notiflix";
import { safeLocalStorage } from "../utils/safeStorage";
import { safeParseJson } from "../utils/safeParseJson";
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
  const token = safeLocalStorage.getItem("auth_token");
  const headers = new Headers(options.headers);

  if (token) {
    const cleanToken = token.replace(/['\"]+/g, "");
    headers.set("Authorization", `Bearer ${cleanToken}`);
  }

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
    throw { status: 401, message: "Phien dang nhap da het han, vui long dang nhap lai." };
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

function getUserId(): number {
  try {
    const user = safeLocalStorage.getJSON<any>("auth_user", null);
    const userId = Number(user.userId ?? user.id);
    if (Number.isFinite(userId) && userId > 0) return userId;
  } catch (e) {
    console.error("Error parsing auth_user in getUserId:", e);
  }

  try {
    const parsed = safeLocalStorage.getJSON<any>("auth-storage", null);
    const user = parsed?.state?.user;
    const userId = Number(user?.userId ?? user?.id);
    if (Number.isFinite(userId) && userId > 0) return userId;
  } catch (e) {
    console.error("Error parsing auth-storage in getUserId:", e);
  }

  safeLocalStorage.removeItem("auth_token");
  safeLocalStorage.removeItem("auth_user");
  safeLocalStorage.removeItem("auth-storage");
  if (typeof window !== "undefined") {
    Notify.failure("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    setTimeout(() => { window.location.href = "/"; }, 800);
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
  const needHydrate = items.filter((notebook) => !notebook.documentCount || notebook.documentCount === 0);
  if (needHydrate.length === 0) return items;

  const results = await Promise.allSettled(
    needHydrate.map(async (notebook) => {
      const res = await nbRequest<ApiResponse<PaginatedResponse<unknown>>>(`/notebooks/${notebook.id}/documents?page=0&size=1`, { method: "GET" });
      return { id: notebook.id, count: res.data?.totalElements ?? 0 };
    }),
  );

  const countMap = new Map<number, number>();
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      countMap.set(needHydrate[index].id, result.value.count);
    }
  });

  return items.map((notebook) => {
    const hydrated = countMap.get(notebook.id);
    if (hydrated === undefined) return notebook;
    return { ...notebook, documentCount: hydrated };
  });
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
