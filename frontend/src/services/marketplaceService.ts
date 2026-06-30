import { ApiResponse, PaginatedResponse } from "./types";

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface AdminContentDTO {
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  title: string;
  subjectId?: number | null;
  creatorName?: string;
  downloadCount?: number;
  reviewCount?: number;
  acceptPercentage?: number;
  marketStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  visibility?: "PRIVATE" | "WORKSPACE" | "MARKETPLACE";
  submittedAt?: string;
  createdAt?: string;
}

export interface VoteResultDTO {
  id: number;
  reviewerId: number;
  targetType: string;
  targetId: number;
  voteResult: string;
  reviewNote?: string;
  createdAt: string;
}

// ─── BASE REQUEST ────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function marketRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      message: result.message || "Lỗi giao tiếp API Marketplace",
      errorCode: result.errorCode || "MARKET_ERROR"
    };
  }
  return result;
}

// ─── MOCK DATA FALLBACKS ─────────────────────────────────────────────────────

let mockContents: AdminContentDTO[] = [
  {
    targetType: "QUIZ",
    targetId: 3,
    title: "Đề thi thử Midterm PRF192 - Lập trình C có đáp án chi tiết",
    subjectId: 1,
    creatorName: "Student Creator",
    downloadCount: 42,
    reviewCount: 4,
    acceptPercentage: 100.0,
    marketStatus: "PENDING",
    visibility: "MARKETPLACE",
    submittedAt: "2026-06-30T17:17:35"
  },
  {
    targetType: "DOCUMENT",
    targetId: 3,
    title: "Giáo trình PRF192 - Kỹ thuật Lập trình C cơ bản cho K19",
    subjectId: 1,
    creatorName: "Student Creator",
    downloadCount: 12,
    reviewCount: 2,
    acceptPercentage: 95.0,
    marketStatus: "PENDING",
    visibility: "MARKETPLACE",
    submittedAt: "2026-06-30T17:12:03"
  },
  {
    targetType: "FLASHCARD_DECK",
    targetId: 3,
    title: "Flashcard 50 từ khóa lập trình C cơ bản PRF192",
    subjectId: 1,
    creatorName: "Student Creator",
    downloadCount: 105,
    reviewCount: 12,
    acceptPercentage: 91.0,
    marketStatus: "PENDING",
    visibility: "MARKETPLACE",
    submittedAt: "2026-06-30T12:12:03"
  },
  {
    targetType: "DOCUMENT",
    targetId: 5001,
    title: "Calculus Exam Cheat Sheet",
    subjectId: 2,
    creatorName: "Student Creator",
    downloadCount: 0,
    reviewCount: 0,
    acceptPercentage: 0,
    marketStatus: "PENDING",
    visibility: "MARKETPLACE",
    submittedAt: "2026-06-30T15:15:40"
  },
  {
    targetType: "QUIZ",
    targetId: 6001,
    title: "Calculus Integration Quiz",
    subjectId: 2,
    creatorName: "Student Creator",
    downloadCount: 0,
    reviewCount: 0,
    acceptPercentage: 0,
    marketStatus: "PENDING",
    visibility: "MARKETPLACE",
    submittedAt: "2026-06-30T15:15:40"
  },
  {
    targetType: "FLASHCARD_DECK",
    targetId: 7001,
    title: "Romeo and Juliet Characters Deck",
    subjectId: 5,
    creatorName: "Student Creator",
    downloadCount: 0,
    reviewCount: 0,
    acceptPercentage: 0,
    marketStatus: "PENDING",
    visibility: "MARKETPLACE",
    submittedAt: "2026-06-30T15:15:40"
  }
];

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const marketplaceService = {

  // ==========================================
  // 1. ADMIN CONTENT (TẤT CẢ NỘI DUNG)
  // ==========================================

  async getAdminContents(page = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<AdminContentDTO>>> {
    try {
      return await marketRequest(`/admin/contents?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        let items = mockContents;
        if (keyword) items = items.filter(c => c.title.toLowerCase().includes(keyword.toLowerCase()));
        res({ success: true, message: "Success", data: { items, page, size, totalElements: items.length, totalPages: 1 } });
      }, 300));
    }
  },

  async deleteAdminContent(targetType: string, targetId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      return await marketRequest(`/admin/contents/${targetType}/${targetId}`, { method: "DELETE" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        mockContents = mockContents.filter(c => !(c.targetType === targetType && c.targetId === targetId));
        res({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 300));
    }
  },

  async getAdminContentDetails(targetType: string, targetId: number): Promise<ApiResponse<AdminContentDTO>> {
    try {
      return await marketRequest(`/admin/contents/${targetType}/${targetId}`, { method: "GET" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const item = mockContents.find(c => c.targetType === targetType && c.targetId === targetId);
        if (item) res({ success: true, message: "Success", data: item });
        else rej({ message: "Not found" });
      }, 200));
    }
  },

  async updateMarketStatus(targetType: string, targetId: number, marketStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED", note?: string): Promise<ApiResponse<AdminContentDTO>> {
    try {
      return await marketRequest(`/admin/contents/${targetType}/${targetId}/market-status`, {
        method: "PATCH",
        body: JSON.stringify({ marketStatus, note })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockContents.findIndex(c => c.targetType === targetType && c.targetId === targetId);
        if (idx === -1) return rej({ message: "Not found" });
        mockContents[idx] = { ...mockContents[idx], marketStatus };
        res({ success: true, message: "Success", data: mockContents[idx] });
      }, 300));
    }
  },

  async updateVisibility(targetType: string, targetId: number, visibility: "PRIVATE" | "WORKSPACE" | "MARKETPLACE"): Promise<ApiResponse<AdminContentDTO>> {
    try {
      return await marketRequest(`/admin/contents/${targetType}/${targetId}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ visibility })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockContents.findIndex(c => c.targetType === targetType && c.targetId === targetId);
        if (idx === -1) return rej({ message: "Not found" });
        mockContents[idx] = { ...mockContents[idx], visibility };
        res({ success: true, message: "Success", data: mockContents[idx] });
      }, 300));
    }
  },

  // ==========================================
  // 2. ADMIN MARKETPLACE PENDING (HÀNG CHỜ DUYỆT)
  // ==========================================

  async getAdminPending(page = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<AdminContentDTO>>> {
    try {
      return await marketRequest(`/admin/marketplace/pending?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        let items = mockContents.filter(c => c.marketStatus === "PENDING" && c.visibility === "MARKETPLACE");
        if (keyword) items = items.filter(c => c.title.toLowerCase().includes(keyword.toLowerCase()));
        res({ success: true, message: "Success", data: { items, page, size, totalElements: items.length, totalPages: 1 } });
      }, 300));
    }
  },

  async approveAdminContent(targetType: string, targetId: number, reviewNote?: string): Promise<ApiResponse<VoteResultDTO>> {
    try {
      return await marketRequest(`/admin/marketplace/${targetType}/${targetId}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ reviewNote })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockContents.findIndex(c => c.targetType === targetType && c.targetId === targetId);
        if (idx === -1) return rej({ message: "Not found" });
        mockContents[idx].marketStatus = "APPROVED";
        res({
          success: true, message: "Success", data: {
            id: Date.now(), reviewerId: 1, targetType, targetId, voteResult: "APPROVED", reviewNote, createdAt: new Date().toISOString()
          }
        });
      }, 300));
    }
  },

  async rejectAdminContent(targetType: string, targetId: number, reviewNote?: string): Promise<ApiResponse<VoteResultDTO>> {
    try {
      return await marketRequest(`/admin/marketplace/${targetType}/${targetId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reviewNote })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockContents.findIndex(c => c.targetType === targetType && c.targetId === targetId);
        if (idx === -1) return rej({ message: "Not found" });
        mockContents[idx].marketStatus = "REJECTED";
        res({
          success: true, message: "Success", data: {
            id: Date.now(), reviewerId: 1, targetType, targetId, voteResult: "REJECTED", reviewNote, createdAt: new Date().toISOString()
          }
        });
      }, 300));
    }
  },

  // ==========================================
  // 3. PUBLIC MARKETPLACE SEARCH
  // ==========================================

  async searchMarketplace(page = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<AdminContentDTO>>> {
    try {
      return await marketRequest(`/marketplace/search?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        let items = mockContents.filter(c => c.marketStatus === "APPROVED" && c.visibility === "MARKETPLACE");
        if (keyword) items = items.filter(c => c.title.toLowerCase().includes(keyword.toLowerCase()));
        res({ success: true, message: "Success", data: { items, page, size, totalElements: items.length, totalPages: 1 } });
      }, 300));
    }
  },

  // ==========================================
  // 4. REVIEWER (NHÂN VIÊN KIỂM DUYỆT)
  // ==========================================

  async getReviewerPending(page = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<AdminContentDTO>>> {
    try {
      return await marketRequest(`/reviewer/marketplace/pending?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
    } catch (e) {
      // Reviewer logic is similar to Admin Pending in mock
      return new Promise(res => setTimeout(() => {
        let items = mockContents.filter(c => c.marketStatus === "PENDING" && c.visibility === "MARKETPLACE");
        if (keyword) items = items.filter(c => c.title.toLowerCase().includes(keyword.toLowerCase()));
        res({ success: true, message: "Success", data: { items, page, size, totalElements: items.length, totalPages: 1 } });
      }, 300));
    }
  },

  async getReviewerContentDetails(targetType: string, targetId: number): Promise<ApiResponse<AdminContentDTO>> {
    try {
      return await marketRequest(`/reviewer/marketplace/${targetType}/${targetId}`, { method: "GET" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const item = mockContents.find(c => c.targetType === targetType && c.targetId === targetId);
        if (item) res({ success: true, message: "Success", data: item });
        else rej({ message: "Not found" });
      }, 200));
    }
  },

  async voteReviewerContent(targetType: string, targetId: number, voteResult: "APPROVED" | "REJECTED", reviewNote?: string): Promise<ApiResponse<VoteResultDTO>> {
    try {
      return await marketRequest(`/reviewer/marketplace/${targetType}/${targetId}/vote`, {
        method: "POST",
        body: JSON.stringify({ voteResult, reviewNote })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockContents.findIndex(c => c.targetType === targetType && c.targetId === targetId);
        if (idx === -1) return rej({ message: "Not found" });
        mockContents[idx].marketStatus = voteResult;
        res({
          success: true, message: "Success", data: {
            id: Date.now(), reviewerId: 2, targetType, targetId, voteResult, reviewNote, createdAt: new Date().toISOString()
          }
        });
      }, 300));
    }
  }

};
