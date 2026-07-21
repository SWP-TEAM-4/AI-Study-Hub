import { safeLocalStorage } from "../utils/safeStorage";
import { safeParseJson } from "../utils/safeParseJson";
import { ApiResponse, PaginatedResponse } from "./types";

const BASE_URL = "/api";

async function safeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = safeLocalStorage.getItem("auth_token");
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
  result = safeParseJson<any>(text, { message: text.substring(0, 200) });

  if (response.status === 401) {
    safeLocalStorage.removeItem("auth_token");
    safeLocalStorage.removeItem("auth_user");
    safeLocalStorage.removeItem("auth-storage");
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw { status: 401, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." };
  }

  if (!response.ok) {
    throw { status: response.status, message: result.message || "Lỗi hệ thống", errorCode: result.errorCode };
  }
  return result;
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface MyReportDTO {
  id: number;
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  targetTitle?: string;
  reasonType: string;
  reportDetails: string;
  severityLevel: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING_ADMIN" | "RESOLVED" | "REJECTED";
  reporterId: number;
  reporterName?: string;
  adminNote?: string;
  resolvedById?: number;
  resolvedByName?: string;
  createdAt: string;
}

export interface MyFeedbackDTO {
  id: number;
  title: string;
  content: string;
  screenUrl: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
}

export interface MySubmissionDTO {
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  title: string;
  marketStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  submittedAt?: string;
  createdAt: string;
}

// ─── SERVICE ─────────────────────────────────────────────────────────────────

export const trackingService = {

  // 1. GET /api/reports/my — danh sách báo cáo vi phạm của tôi
  async getMyReports(params?: {
    page?: number;
    size?: number;
    keyword?: string;
    sort?: string;
  }): Promise<ApiResponse<PaginatedResponse<MyReportDTO>>> {
    const query = new URLSearchParams();
    query.append("page", String(params?.page ?? 0));
    query.append("size", String(params?.size ?? 10));
    if (params?.keyword) query.append("keyword", params.keyword);
    if (params?.sort) query.append("sort", params.sort);
    return await safeRequest(`/reports/my?${query.toString()}`);
  },

  // 2. GET /api/feedbacks?page=... — danh sách feedback của tôi (backend trả theo user)
  async getMyFeedbacks(params?: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedResponse<MyFeedbackDTO>>> {
    const query = new URLSearchParams();
    query.append("page", String(params?.page ?? 0));
    query.append("size", String(params?.size ?? 10));
    // Backend feedback list trả tất cả feedbacks; FE có thể filter theo userId
    return await safeRequest(`/feedbacks?${query.toString()}`);
  },

  // 3. GET /api/documents?visibility=MARKETPLACE — tài liệu của tôi đã gửi marketplace
  async getMyMarketplaceSubmissions(params?: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedResponse<MySubmissionDTO>>> {
    const query = new URLSearchParams();
    query.append("page", String(params?.page ?? 0));
    query.append("size", String(params?.size ?? 10));
    query.append("visibility", "MARKETPLACE");
    return await safeRequest(`/documents?${query.toString()}`);
  },
};
