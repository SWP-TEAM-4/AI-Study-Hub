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
    targetType: "DOCUMENT",
    targetId: 501,
    title: "Chapter 10 Requirement Specification",
    subjectId: 12,
    creatorName: "Nguyen Van A",
    downloadCount: 15,
    reviewCount: 4,
    acceptPercentage: 92.5,
    marketStatus: "APPROVED",
    visibility: "MARKETPLACE",
    createdAt: "2026-05-12T10:00:00",
  },
  {
    targetType: "FLASHCARD_DECK",
    targetId: 1002,
    title: "C# Basic concepts",
    subjectId: 5,
    creatorName: "Tran Thi B",
    downloadCount: 45,
    reviewCount: 12,
    acceptPercentage: 88.0,
    marketStatus: "PENDING",
    visibility: "MARKETPLACE",
    submittedAt: "2026-06-12T22:00:00",
  },
  {
    targetType: "QUIZ",
    targetId: 2001,
    title: "Midterm Test SE",
    subjectId: 12,
    creatorName: "Le Van C",
    downloadCount: 0,
    reviewCount: 0,
    acceptPercentage: 0,
    marketStatus: "PENDING",
    visibility: "MARKETPLACE",
    submittedAt: "2026-06-15T15:30:00",
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
