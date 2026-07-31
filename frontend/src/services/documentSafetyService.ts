import { ApiResponse, PaginatedResponse } from "./types";
import { safeLocalStorage } from "../utils/safeStorage";
import { safeParseJson } from "../utils/safeParseJson";

const BASE_URL = "/api";

async function safetyRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = safeLocalStorage.getItem("auth_token");
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token.replace(/['"]+/g, "")}`);
  }
  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const result = safeParseJson<any>(text, { message: text.substring(0, 200) });

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
    throw {
      status: response.status,
      message: result.message || "Không thể xử lý kiểm duyệt an toàn tài liệu",
      errorCode: result.errorCode,
    };
  }

  return result;
}

export type DocumentSafetyReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DocumentViolationSeverity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DocumentSafetySettingsDTO {
  configKey: string;
  enabled: boolean;
  description?: string;
}

export interface DocumentSafetyReviewDTO {
  id: number;
  documentId: number | null;
  documentTitle: string | null;
  ownerUserId: number | null;
  ownerName: string | null;
  triggeredByUserId: number | null;
  reviewerUserId: number | null;
  eventType: "PROCESS_CHUNKING" | "EDITED_CHUNKS_REVIEW" | string;
  reviewStatus: DocumentSafetyReviewStatus;
  documentModerationStatus: "REVIEW_REQUIRED" | "BLOCKED" | "SAFE" | "PENDING" | string;
  violationSeverity: DocumentViolationSeverity;
  category: string | null;
  confidence: number | null;
  policyFlags: string[];
  reason: string | null;
  moderationNote: string | null;
  textExcerpt: string | null;
  reviewedNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface DocumentSafetyReviewParams {
  page?: number;
  size?: number;
  status?: string;
  severity?: string;
  keyword?: string;
  sort?: string;
}

export const documentSafetyService = {
  async getSettings(): Promise<ApiResponse<DocumentSafetySettingsDTO>> {
    return safetyRequest(`/admin/document-safety/settings`, { method: "GET" });
  },

  async updateSettings(enabled: boolean): Promise<ApiResponse<DocumentSafetySettingsDTO>> {
    return safetyRequest(`/admin/document-safety/settings`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
  },

  async getReviews(
    params: DocumentSafetyReviewParams = {},
  ): Promise<ApiResponse<PaginatedResponse<DocumentSafetyReviewDTO>>> {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.size !== undefined) query.set("size", String(params.size));
    if (params.status) query.set("status", params.status);
    if (params.severity) query.set("severity", params.severity);
    if (params.keyword?.trim()) query.set("keyword", params.keyword.trim());
    if (params.sort) query.set("sort", params.sort);
    const qs = query.toString();
    return safetyRequest(`/admin/document-safety/reviews${qs ? `?${qs}` : ""}`, { method: "GET" });
  },

  async approveReview(id: number, note?: string): Promise<ApiResponse<DocumentSafetyReviewDTO>> {
    return safetyRequest(`/admin/document-safety/reviews/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ note: note || "" }),
    });
  },

  async rejectReview(id: number, note?: string): Promise<ApiResponse<DocumentSafetyReviewDTO>> {
    return safetyRequest(`/admin/document-safety/reviews/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ note: note || "" }),
    });
  },
};
