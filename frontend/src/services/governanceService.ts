import { ApiResponse, PaginatedResponse } from "./types";

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface ReportDTO {
  id: number;
  reporterId: number;
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  reasonType: string;
  reportDetails: string;
  severityLevel: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING_ADMIN" | "RESOLVED" | "REJECTED";
  adminNote?: string;
  createdAt: string;
}

export interface CommentDTO {
  id: number;
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  content: string;
  isHidden: boolean;
  createdAt: string;
  // Bổ sung cho UI
  authorName?: string;
}

export interface ReviewDTO {
  id: number;
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  rating: number;
  content: string;
  createdAt: string;
  // Bổ sung cho UI
  authorName?: string;
}

// ─── BASE REQUEST ────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function govRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) {
    const cleanToken = token.replace(/['"]+/g, '');
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
    throw { status: 401, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." };
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Lỗi giao tiếp API Governance",
      errorCode: result.errorCode || "GOV_ERROR"
    };
  }
  return result;
}

// ─── MOCK DATA FALLBACKS ─────────────────────────────────────────────────────

let mockReports: ReportDTO[] = [
  {
    id: 1301,
    reporterId: 1,
    targetType: "DOCUMENT",
    targetId: 501,
    reasonType: "COPYRIGHT",
    reportDetails: "Tài liệu này sao chép nguyên bản từ sách giáo khoa mà không trích nguồn.",
    severityLevel: "HIGH",
    status: "PENDING_ADMIN",
    createdAt: "2026-06-12T22:25:00"
  },
  {
    id: 1302,
    reporterId: 2,
    targetType: "FLASHCARD_DECK",
    targetId: 1002,
    reasonType: "INAPPROPRIATE",
    reportDetails: "Có chứa từ ngữ nhạy cảm trong một số thẻ.",
    severityLevel: "MEDIUM",
    status: "RESOLVED",
    adminNote: "Đã xóa các thẻ vi phạm.",
    createdAt: "2026-06-11T10:00:00"
  }
];

let mockComments: CommentDTO[] = [
  {
    id: 1951,
    targetType: "DOCUMENT",
    targetId: 501,
    content: "Bạn có phần đáp án cho chương 2 không?",
    isHidden: false,
    authorName: "Tuấn Anh",
    createdAt: "2026-06-12T22:55:00"
  }
];

let mockReviews: ReviewDTO[] = [
  {
    id: 1901,
    targetType: "DOCUMENT",
    targetId: 501,
    rating: 5,
    content: "Tài liệu cực kỳ chi tiết, cảm ơn bạn!",
    authorName: "Hải Yến",
    createdAt: "2026-06-12T22:50:00"
  }
];

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const governanceService = {

  // ==========================================
  // 1. ADMIN REPORTS
  // ==========================================
  
  async getAdminReports(page = 0, size = 10, status?: string): Promise<ApiResponse<PaginatedResponse<ReportDTO>>> {
    try {
      const q = status ? `&status=${status}` : "";
      return await govRequest(`/admin/reports?page=${page}&size=${size}${q}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        let items = mockReports;
        if (status) items = items.filter(r => r.status === status);
        res({ success: true, message: "Success", data: { items, page, size, totalElements: items.length, totalPages: 1 } });
      }, 300));
    }
  },

  async getReportDetails(id: number): Promise<ApiResponse<ReportDTO>> {
    try {
      return await govRequest(`/admin/reports/${id}`, { method: "GET" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const item = mockReports.find(r => r.id === id);
        if (item) res({ success: true, message: "Success", data: item });
        else rej({ message: "Not found" });
      }, 200));
    }
  },

  async rejectReport(id: number, adminNote: string): Promise<ApiResponse<any>> {
    try {
      return await govRequest(`/admin/reports/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ adminNote })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockReports.findIndex(r => r.id === id);
        if (idx === -1) return rej({ message: "Not found" });
        mockReports[idx] = { ...mockReports[idx], status: "REJECTED", adminNote };
        res({ success: true, message: "Success", data: mockReports[idx] });
      }, 300));
    }
  },

  async resolveReport(id: number, adminNote: string): Promise<ApiResponse<any>> {
    try {
      return await govRequest(`/admin/reports/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ adminNote })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockReports.findIndex(r => r.id === id);
        if (idx === -1) return rej({ message: "Not found" });
        mockReports[idx] = { ...mockReports[idx], status: "RESOLVED", adminNote };
        res({ success: true, message: "Success", data: mockReports[idx] });
      }, 300));
    }
  },

  // ==========================================
  // 2. USER REPORTS
  // ==========================================

  async createReport(payload: { targetType: string; targetId: number; reasonType: string; reportDetails: string; severityLevel: string }): Promise<ApiResponse<ReportDTO>> {
    try {
      return await govRequest(`/reports`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const newReport: ReportDTO = {
          id: Date.now(),
          reporterId: 1,
          ...payload,
          status: "PENDING_ADMIN",
          createdAt: new Date().toISOString()
        } as ReportDTO;
        mockReports.unshift(newReport);
        res({ success: true, message: "Report submitted", data: newReport });
      }, 400));
    }
  },

  async getMyReports(page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<ReportDTO>>> {
    try {
      return await govRequest(`/reports/my?page=${page}&size=${size}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const items = mockReports.filter(r => r.reporterId === 1);
        res({ success: true, message: "Success", data: { items, page, size, totalElements: items.length, totalPages: 1 } });
      }, 300));
    }
  },

  // ==========================================
  // 3. COMMENTS
  // ==========================================

  async getComments(targetType: string, targetId: number): Promise<ApiResponse<PaginatedResponse<CommentDTO>>> {
    try {
      return await govRequest(`/community/comments?targetType=${targetType}&targetId=${targetId}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const items = mockComments.filter(c => c.targetType === targetType && c.targetId === targetId && !c.isHidden);
        res({ success: true, message: "Success", data: { items, page: 0, size: 50, totalElements: items.length, totalPages: 1 } });
      }, 200));
    }
  },

  async createComment(targetType: string, targetId: number, content: string): Promise<ApiResponse<CommentDTO>> {
    try {
      return await govRequest(`/community/comments`, {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, content })
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const newComment: CommentDTO = {
          id: Date.now(),
          targetType: targetType as any,
          targetId,
          content,
          isHidden: false,
          authorName: "Bạn (Current User)",
          createdAt: new Date().toISOString()
        };
        mockComments.push(newComment);
        res({ success: true, message: "Success", data: newComment });
      }, 300));
    }
  },

  async deleteComment(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      return await govRequest(`/community/comments/${id}`, { method: "DELETE" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        mockComments = mockComments.filter(c => c.id !== id);
        res({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 300));
    }
  },

  async hideComment(id: number, reason: string): Promise<ApiResponse<CommentDTO>> {
    try {
      return await govRequest(`/community/comments/${id}/hide`, {
        method: "PATCH",
        body: JSON.stringify({ reason })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockComments.findIndex(c => c.id === id);
        if (idx === -1) return rej({ message: "Not found" });
        mockComments[idx].isHidden = true;
        res({ success: true, message: "Success", data: mockComments[idx] });
      }, 300));
    }
  },

  // ==========================================
  // 4. REVIEWS
  // ==========================================

  async getReviews(targetType: string, targetId: number): Promise<ApiResponse<PaginatedResponse<ReviewDTO>>> {
    try {
      return await govRequest(`/community/reviews?targetType=${targetType}&targetId=${targetId}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const items = mockReviews.filter(c => c.targetType === targetType && c.targetId === targetId);
        res({ success: true, message: "Success", data: { items, page: 0, size: 50, totalElements: items.length, totalPages: 1 } });
      }, 200));
    }
  },

  async createReview(targetType: string, targetId: number, rating: number, content: string): Promise<ApiResponse<ReviewDTO>> {
    try {
      return await govRequest(`/community/reviews`, {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, rating, content })
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const newReview: ReviewDTO = {
          id: Date.now(),
          targetType: targetType as any,
          targetId,
          rating,
          content,
          authorName: "Bạn (Current User)",
          createdAt: new Date().toISOString()
        };
        mockReviews.push(newReview);
        res({ success: true, message: "Success", data: newReview });
      }, 300));
    }
  },

  async updateReview(id: number, targetType: string, targetId: number, rating: number, content: string): Promise<ApiResponse<ReviewDTO>> {
    try {
      return await govRequest(`/community/reviews/${id}`, {
        method: "PUT",
        body: JSON.stringify({ targetType, targetId, rating, content })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockReviews.findIndex(r => r.id === id);
        if (idx === -1) return rej({ message: "Not found" });
        mockReviews[idx] = { ...mockReviews[idx], rating, content };
        res({ success: true, message: "Success", data: mockReviews[idx] });
      }, 300));
    }
  },

  async deleteReview(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      return await govRequest(`/community/reviews/${id}`, { method: "DELETE" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        mockReviews = mockReviews.filter(r => r.id !== id);
        res({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 300));
    }
  },

  // ==========================================
  // 5. CONTENT MODERATION (SYSTEM/OTHER)
  // ==========================================

  async hideContent(targetType: string, targetId: number, reason: string): Promise<ApiResponse<any>> {
    try {
      return await govRequest(`/admin/content/${targetType}/${targetId}/hide`, {
        method: "PATCH",
        body: JSON.stringify({ reason })
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        res({ success: true, message: "Success", data: { targetType, targetId, action: "hide" } });
      }, 300));
    }
  },

  async restoreContent(targetType: string, targetId: number, reason: string): Promise<ApiResponse<any>> {
    try {
      return await govRequest(`/admin/content/${targetType}/${targetId}/restore`, {
        method: "PATCH",
        body: JSON.stringify({ reason })
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        res({ success: true, message: "Success", data: { targetType, targetId, action: "restore" } });
      }, 300));
    }
  }

};
