import type { ApiResponse } from "./authService";

const BASE_URL = "http://localhost:8080/api/notebooks";

export interface NotebookItem {
  id: number;
  title: string;
  subjectId?: number | null;
  subjectCode?: string | null;
  createdAt: string;
  documentCount?: number;
}

interface NotebookPaginationData {
  items: NotebookItem[];
}

const NOTEBOOK_ERROR_MESSAGES: Record<string, string> = {
  NOTEBOOK_NOT_FOUND: "Không tìm thấy notebook.",
  NOTEBOOK_ACCESS_DENIED: "Bạn không có quyền truy cập notebook này.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  ACCESS_DENIED: "Bạn không có quyền thực hiện thao tác này.",
  VALIDATION_ERROR: "Dữ liệu notebook không hợp lệ.",
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

  if (body?.errorCode && NOTEBOOK_ERROR_MESSAGES[body.errorCode]) {
    throw new Error(NOTEBOOK_ERROR_MESSAGES[body.errorCode]);
  }
  if (body?.message) {
    throw new Error(body.message);
  }
  throw new Error(fallback);
}

export async function getMyNotebooks(userId: number): Promise<NotebookItem[]> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}?userId=${userId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server để tải notebook.");
  }

  if (!response.ok) {
    await handleApiError(response, "Không thể tải danh sách notebook.");
  }

  const body: ApiResponse<NotebookItem[] | NotebookPaginationData> = await response.json();
  const data = body.data;

  if (Array.isArray(data)) {
    return data;
  }
  if (data && "items" in data && Array.isArray(data.items)) {
    return data.items;
  }
  return [];
}
