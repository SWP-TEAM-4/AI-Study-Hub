// ─────────────────────────────────────────────────────────────────────────────
// quizService.ts  –  Kết nối với Quiz API Backend
// Base URL: http://localhost:8080/api/quizzes
// Yêu cầu: Bearer Token (lấy từ authStore.accessToken)
// ─────────────────────────────────────────────────────────────────────────────

import type { ApiResponse } from "./authService";

const BASE_URL = "http://localhost:8080/api/quizzes";

// ─── TypeScript Types (mirror backend DTOs) ──────────────────────────────────

export type Visibility = "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";
export type MarketStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

/**
 * Mirror của QuizResponse.java
 */
export interface QuizItem {
  id: number;
  notebookId: number | null;
  notebookTitle: string | null;
  subjectId: number | null;
  subjectName: string | null;
  creatorId: number;
  creatorFullName: string;
  title: string;
  description: string | null;
  academicTermId: number | null;
  academicTermName: string | null;
  examType: string | null;
  visibility: Visibility;
  marketStatus: MarketStatus;
  downloadCount: number;
  reviewCount: number;
  acceptPercentage: number | null;
  aiVerdictNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mirror của PaginationResponse.java
 */
export interface PaginationData<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Params cho GET /api/quizzes (mirror QuizSearchRequest.java)
 */
export interface QuizSearchParams {
  keyword?: string;
  subjectId?: number;
  notebookId?: number;
  academicTermId?: number;
  examType?: string;
  visibility?: Visibility;
  marketStatus?: MarketStatus;
  page?: number;
  size?: number;
  sort?: string; // "createdAt,desc" | "title,asc" | ...
}

/**
 * Payload để tạo/update quiz (mirror QuizRequest.java)
 */
export interface QuizRequest {
  title: string;
  description?: string;
  notebookId?: number;
  subjectId?: number;
  academicTermId?: number;
  examType?: string;
  visibility?: Visibility;
}

// ─── Shared auth header helper ────────────────────────────────────────────────

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── Shared error handler ─────────────────────────────────────────────────────

const QUIZ_ERROR_MESSAGES: Record<string, string> = {
  QUIZ_NOT_FOUND: "Không tìm thấy quiz này.",
  QUIZ_ACCESS_DENIED: "Bạn không có quyền truy cập quiz này.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  ACCESS_DENIED: "Bạn không có quyền thực hiện thao tác này.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ!",
  INTERNAL_ERROR: "Lỗi hệ thống từ server. Vui lòng thử lại sau.",
};

async function handleQuizError(response: Response, fallback: string): Promise<never> {
  // Lỗi 500 – server crash, không parse JSON tiếp vì body có thể là HTML stacktrace
  if (response.status >= 500) {
    throw new Error(`Lỗi hệ thống server (${response.status}). Vui lòng thử lại sau hoặc báo admin.`);
  }

  let body: ApiResponse<unknown> | null = null;
  try {
    body = await response.json();
  } catch {
    // ignore non-JSON body
  }
  const code = body?.errorCode;
  if (code && QUIZ_ERROR_MESSAGES[code]) throw new Error(QUIZ_ERROR_MESSAGES[code]);
  if (body?.message) throw new Error(body.message);
  throw new Error(fallback);
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * GET /api/quizzes
 * Tìm kiếm + phân trang danh sách quiz cá nhân.
 */
export async function searchMyQuizzes(
  token: string,
  params: QuizSearchParams = {}
): Promise<PaginationData<QuizItem>> {
  const query = new URLSearchParams();
  if (params.keyword)      query.set("keyword", params.keyword);
  if (params.subjectId)    query.set("subjectId", String(params.subjectId));
  if (params.notebookId)   query.set("notebookId", String(params.notebookId));
  if (params.academicTermId) query.set("academicTermId", String(params.academicTermId));
  if (params.examType)     query.set("examType", params.examType);
  if (params.visibility)   query.set("visibility", params.visibility);
  if (params.marketStatus) query.set("marketStatus", params.marketStatus);
  query.set("page", String(params.page ?? 0));
  query.set("size", String(params.size ?? 12));
  query.set("sort", params.sort ?? "createdAt,desc");

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}?${query.toString()}`, {
      headers: authHeaders(token),
    });
  } catch {
    throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!");
  }

  if (!res.ok) await handleQuizError(res, "Tải danh sách quiz thất bại.");

  const body: ApiResponse<PaginationData<QuizItem>> = await res.json();
  return body.data!;
}

/**
 * GET /api/quizzes/:id
 * Lấy chi tiết một quiz theo ID.
 */
export async function getQuizById(token: string, id: number): Promise<QuizItem> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${id}`, { headers: authHeaders(token) });
  } catch {
    throw new Error("Không thể kết nối đến server.");
  }
  if (!res.ok) await handleQuizError(res, "Không thể tải thông tin quiz.");
  const body: ApiResponse<QuizItem> = await res.json();
  return body.data!;
}

/**
 * POST /api/quizzes
 * Tạo quiz mới.
 */
export async function createQuiz(token: string, request: QuizRequest): Promise<QuizItem> {
  let res: Response;
  try {
    res = await fetch(BASE_URL, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Không thể kết nối đến server.");
  }
  if (!res.ok) await handleQuizError(res, "Tạo quiz thất bại.");
  const body: ApiResponse<QuizItem> = await res.json();
  return body.data!;
}

/**
 * PUT /api/quizzes/:id
 * Cập nhật metadata của quiz.
 */
export async function updateQuiz(
  token: string,
  id: number,
  request: QuizRequest
): Promise<QuizItem> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Không thể kết nối đến server.");
  }
  if (!res.ok) await handleQuizError(res, "Cập nhật quiz thất bại.");
  const body: ApiResponse<QuizItem> = await res.json();
  return body.data!;
}

/**
 * DELETE /api/quizzes/:id
 * Xóa quiz (chỉ creator mới có quyền).
 */
export async function deleteQuiz(token: string, id: number): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
  } catch {
    throw new Error("Không thể kết nối đến server.");
  }
  if (!res.ok) await handleQuizError(res, "Xóa quiz thất bại.");
}
