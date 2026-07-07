import { ApiResponse, PaginatedResponse } from "./types";

export type GovernanceTargetType = "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";

export interface ReportDTO {
  id: number;
  reporterId: number;
  reporterName?: string;
  targetType: GovernanceTargetType;
  targetId: number;
  targetTitle?: string;
  reasonType: string;
  reportDetails: string;
  severityLevel: "LOW" | "MEDIUM" | "HIGH" | string;
  status: "PENDING_ADMIN" | "RESOLVED" | "REJECTED" | string;
  adminNote?: string;
  resolvedById?: number;
  resolvedByName?: string;
  createdAt: string;
}

export interface CommentDTO {
  id: number;
  userId?: number;
  fullName?: string;
  avatarUrl?: string | null;
  targetType?: GovernanceTargetType;
  targetId?: number;
  content: string;
  isHidden?: boolean;
  parentCommentId?: number | null;
  createdAt: string;
  authorName?: string;
}

export interface ReviewDTO {
  id: number;
  targetType: GovernanceTargetType;
  targetId: number;
  rating: number;
  content: string;
  reviewerId?: number;
  reviewerName?: string;
  reviewerAvatarUrl?: string | null;
  createdAt: string;
  authorName?: string;
}

const BASE_URL = "/api";

async function safeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token.replace(/['"]+/g, "")}`);
  }

  const method = (options.method || "GET").toUpperCase();
  if (!headers.has("Content-Type") && method !== "GET" && method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  let result: any = {};
  if (text && text.trim().length > 0) {
    try { result = JSON.parse(text); } catch { result = { message: text.substring(0, 200) }; }
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
      message: result.message || "Lỗi giao tiếp API Governance",
      errorCode: result.errorCode || "GOV_ERROR",
    };
  }
  return result;
}

function toQuery(params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const governanceService = {
  getAdminReports(page = 0, size = 10, status?: string): Promise<ApiResponse<PaginatedResponse<ReportDTO>>> {
    return govRequest(`/admin/reports${toQuery({ page, size, status })}`, { method: "GET" });
  },

  getReportDetails(id: number): Promise<ApiResponse<ReportDTO>> {
    return govRequest(`/admin/reports/${id}`, { method: "GET" });
  },

  rejectReport(id: number, adminNote: string): Promise<ApiResponse<PaginatedResponse<ReportDTO>>> {
    return govRequest(`/admin/reports/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ adminNote }),
    });
  },

  resolveReport(id: number, adminNote: string): Promise<ApiResponse<PaginatedResponse<ReportDTO>>> {
    return govRequest(`/admin/reports/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ adminNote }),
    });
  },

  createReport(payload: {
    targetType: GovernanceTargetType | string;
    targetId: number;
    reasonType: string;
    reportDetails: string;
    severityLevel: string;
  }): Promise<ApiResponse<ReportDTO>> {
    return govRequest("/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMyReports(page = 0, size = 10, keyword = "", sort = "newest"): Promise<ApiResponse<PaginatedResponse<ReportDTO>>> {
    return govRequest(`/reports/my${toQuery({ page, size, keyword, sort })}`, { method: "GET" });
  },

  getComments(documentId: number): Promise<ApiResponse<CommentDTO[]>> {
    return govRequest(`/community/comments${toQuery({ documentId })}`, { method: "GET" });
  },

  createComment(documentId: number, content: string, parentCommentId?: number): Promise<ApiResponse<CommentDTO>> {
    return govRequest("/community/comments", {
      method: "POST",
      body: JSON.stringify({ documentId, content, parentCommentId }),
    });
  },

  deleteComment(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return govRequest(`/community/comments/${id}`, { method: "DELETE" });
  },

  hideComment(id: number, reason: string): Promise<ApiResponse<CommentDTO>> {
    return govRequest(`/community/comments/${id}/hide`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
  },

  getReviews(
    targetType: GovernanceTargetType | string,
    targetId: number,
    page = 0,
    size = 20,
  ): Promise<ApiResponse<PaginatedResponse<ReviewDTO>>> {
    return govRequest(`/community/reviews${toQuery({ targetType, targetId, page, size })}`, { method: "GET" });
  },

  createReview(
    targetType: GovernanceTargetType | string,
    targetId: number,
    rating: number,
    content: string,
  ): Promise<ApiResponse<ReviewDTO>> {
    return govRequest("/community/reviews", {
      method: "POST",
      body: JSON.stringify({ targetType, targetId, rating, content }),
    });
  },

  updateReview(
    id: number,
    targetType: GovernanceTargetType | string,
    targetId: number,
    rating: number,
    content: string,
  ): Promise<ApiResponse<ReviewDTO>> {
    return govRequest(`/community/reviews/${id}`, {
      method: "PUT",
      body: JSON.stringify({ targetType, targetId, rating, content }),
    });
  },

  deleteReview(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return govRequest(`/community/reviews/${id}`, { method: "DELETE" });
  },

  hideContent(targetType: string, targetId: number, reason: string): Promise<ApiResponse<any>> {
    return govRequest(`/admin/content/${targetType}/${targetId}/hide`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
  },

  restoreContent(targetType: string, targetId: number, reason: string): Promise<ApiResponse<any>> {
    return govRequest(`/admin/content/${targetType}/${targetId}/restore`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
  },
};
