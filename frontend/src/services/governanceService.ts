import { ApiResponse, PaginatedResponse } from "./types";

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
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
  authorId?: number;
  replies?: CommentDTO[];
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

<<<<<<< HEAD
=======
=======
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
const BASE_URL = "/api";

async function safeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) {
<<<<<<< HEAD
    headers.set("Authorization", `Bearer ${token.replace(/['"]+/g, "")}`);
=======
<<<<<<< HEAD
    headers.set("Authorization", `Bearer ${token.replace(/['"]+/g, "")}`);
=======
    const cleanToken = token.replace(/['"]+/g, "");
    headers.set("Authorization", `Bearer ${cleanToken}`);
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
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
<<<<<<< HEAD
      message: result.message || "Lỗi giao tiếp API Governance",
      errorCode: result.errorCode || "GOV_ERROR",
=======
<<<<<<< HEAD
      message: result.message || "Lỗi giao tiếp API Governance",
      errorCode: result.errorCode || "GOV_ERROR",
=======
      message: result.message || "Lỗi hệ thống",
      errorCode: result.errorCode,
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
    };
  }
  return result;
}

<<<<<<< HEAD
const govRequest = safeRequest;

=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
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
<<<<<<< HEAD
=======
=======
export interface ReportDTO {
  id: number;
  reporterId: number;
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  targetTitle?: string;
  reasonType: string;
  reportDetails: string;
  severityLevel: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING_ADMIN" | "RESOLVED" | "REJECTED";
  adminNote?: string;
  reporterName?: string;
  resolvedById?: number;
  resolvedByName?: string;
  createdAt: string;
}

export interface CommentDTO {
  id: number;
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  content: string;
  isHidden: boolean;
  createdAt: string;
  authorName?: string;
}

export interface ReviewDTO {
  id: number;
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  rating: number;
  content: string;
  createdAt: string;
  authorName?: string;
}

export const governanceService = {
  async getAdminReports(params?: { page?: number; size?: number; keyword?: string; sort?: string; status?: string; severityLevel?: string }) {
    const query = new URLSearchParams();
    query.append("page", String(params?.page ?? 0));
    query.append("size", String(params?.size ?? 10));
    if (params?.keyword) query.append("keyword", params.keyword);
    if (params?.sort) query.append("sort", params.sort);
    if (params?.status) query.append("status", params.status);
    if (params?.severityLevel) query.append("severityLevel", params.severityLevel);
    return await safeRequest(`/admin/reports?${query.toString()}`, { method: "GET" });
  },
  async getReportDetails(id: number) {
    return await safeRequest(`/admin/reports/${id}`, { method: "GET" });
  },
  async rejectReport(id: number, adminNote: string, page = 0, size = 10) {
    return await safeRequest(`/admin/reports/${id}/reject?page=${page}&size=${size}`, { method: "PATCH", body: JSON.stringify({ adminNote }) });
  },
  async resolveReport(id: number, adminNote: string, page = 0, size = 10) {
    return await safeRequest(`/admin/reports/${id}/resolve?page=${page}&size=${size}`, { method: "PATCH", body: JSON.stringify({ adminNote }) });
  },
  async hideContent(targetType: string, targetId: number, reason: string) {
    return await safeRequest(`/admin/content/${targetType}/${targetId}/hide`, { method: "PATCH", body: JSON.stringify({ reason }) });
  },
  async restoreContent(targetType: string, targetId: number, reason: string) {
    return await safeRequest(`/admin/content/${targetType}/${targetId}/restore`, { method: "PATCH", body: JSON.stringify({ reason }) });
  },
  async hideComment(id: number) {
    return await safeRequest(`/admin/community/comments/${id}/hide`, { method: "PATCH" });
  },
  async adminGetContents(params?: { ownerId?: number; subjectId?: number; visibility?: string; marketStatus?: string }) {
    const query = new URLSearchParams();
    if (params?.ownerId !== undefined) query.append("ownerId", String(params.ownerId));
    if (params?.subjectId !== undefined) query.append("subjectId", String(params.subjectId));
    if (params?.visibility) query.append("visibility", params.visibility);
    if (params?.marketStatus) query.append("marketStatus", params.marketStatus);
    return await safeRequest(`/admin/contents?${query.toString()}`, { method: "GET" });
  },
  async adminGetContentDetails(targetType: string, targetId: number) {
    return await safeRequest(`/admin/contents/${targetType}/${targetId}`, { method: "GET" });
  },
  async adminDeleteContent(targetType: string, targetId: number) {
    return await safeRequest(`/admin/contents/${targetType}/${targetId}`, { method: "DELETE" });
  },
  async adminUpdateContentVisibility(targetType: string, targetId: number, visibility: string) {
    return await safeRequest(`/admin/contents/${targetType}/${targetId}/visibility`, { method: "PATCH", body: JSON.stringify({ visibility }) });
  },
  async createReport(payload: { targetType: string; targetId: number; reasonType: string; reportDetails: string; severityLevel: string }) {
    return await safeRequest(`/reports`, { method: "POST", body: JSON.stringify(payload) });
  },
  async getMyReports(page = 0, size = 10) {
    return await safeRequest(`/reports/my?page=${page}&size=${size}`, { method: "GET" });
  },
  async getComments(targetType: string, targetId: number) {
    return await safeRequest(`/community/comments?targetType=${targetType}&targetId=${targetId}`, { method: "GET" });
  },
  async createComment(targetType: string, targetId: number, content: string) {
    return await safeRequest(`/community/comments`, { method: "POST", body: JSON.stringify({ targetType, targetId, content }) });
  },
  async deleteComment(id: number) {
    return await safeRequest(`/community/comments/${id}`, { method: "DELETE" });
  },
  async getReviews(targetType: string, targetId: number) {
    return await safeRequest(`/community/reviews?targetType=${targetType}&targetId=${targetId}`, { method: "GET" });
  },
  async createReview(targetType: string, targetId: number, rating: number, content: string) {
    return await safeRequest(`/community/reviews`, { method: "POST", body: JSON.stringify({ targetType, targetId, rating, content }) });
  },
  async updateReview(id: number, targetType: string, targetId: number, rating: number, content: string) {
    return await safeRequest(`/community/reviews/${id}`, { method: "PUT", body: JSON.stringify({ targetType, targetId, rating, content }) });
  },
  async deleteReview(id: number) {
    return await safeRequest(`/community/reviews/${id}`, { method: "DELETE" });
  },
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
};
