import { ApiResponse, PaginatedResponse } from "./types";

const BASE_URL = "/api";

async function safeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
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
      message: result.message || "Lỗi hệ thống",
      errorCode: result.errorCode,
    };
  }
  return result;
}

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

export const marketplaceService = {
  async getAdminContents(page = 0, size = 10, keyword = "") {
    return await safeRequest(`/admin/contents?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
  },
  async deleteAdminContent(targetType: string, targetId: number) {
    return await safeRequest(`/admin/contents/${targetType}/${targetId}`, { method: "DELETE" });
  },
  async getAdminContentDetails(targetType: string, targetId: number) {
    return await safeRequest(`/admin/contents/${targetType}/${targetId}`, { method: "GET" });
  },
  async updateMarketStatus(targetType: string, targetId: number, marketStatus: string, note?: string) {
    return await safeRequest(`/admin/contents/${targetType}/${targetId}/market-status`, { method: "PATCH", body: JSON.stringify({ marketStatus, note }) });
  },
  async updateVisibility(targetType: string, targetId: number, visibility: string) {
    return await safeRequest(`/admin/contents/${targetType}/${targetId}/visibility`, { method: "PATCH", body: JSON.stringify({ visibility }) });
  },
  async getAdminPending(page = 0, size = 10, keyword = "") {
    return await safeRequest(`/admin/marketplace/pending?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
  },
  async approveAdminContent(targetType: string, targetId: number, reviewNote?: string) {
    return await safeRequest(`/admin/marketplace/${targetType}/${targetId}/approve`, { method: "PATCH", body: JSON.stringify({ reviewNote }) });
  },
  async rejectAdminContent(targetType: string, targetId: number, reviewNote?: string) {
    return await safeRequest(`/admin/marketplace/${targetType}/${targetId}/reject`, { method: "PATCH", body: JSON.stringify({ reviewNote }) });
  },
  async searchMarketplace(page = 0, size = 10, keyword = "") {
    return await safeRequest(`/marketplace/search?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
  },
  async getReviewerPending(page = 0, size = 10, keyword = "") {
    return await safeRequest(`/reviewer/marketplace/pending?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
  },
  async getReviewerContentDetails(targetType: string, targetId: number) {
    return await safeRequest(`/reviewer/marketplace/${targetType}/${targetId}`, { method: "GET" });
  },
  async voteReviewerContent(targetType: string, targetId: number, voteResult: string, reviewNote?: string) {
    return await safeRequest(`/reviewer/marketplace/${targetType}/${targetId}/vote`, { method: "POST", body: JSON.stringify({ voteResult, reviewNote }) });
  },
  async getMarketplaceFlashcardDecks(page = 0, size = 10, keyword = "") {
    return await safeRequest(`/marketplace/flashcard-decks?page=${page}&size=${size}&keyword=${keyword}&sort=createdAt,desc`, { method: "GET" });
  },
  async cloneFlashcardDeck(id: number, targetNotebookId?: number) {
    return await safeRequest(`/marketplace/flashcard-decks/${id}/clone`, { method: "POST", body: JSON.stringify({ targetNotebookId }) });
  },
  async submitFlashcardDeck(id: number) {
    return await safeRequest(`/marketplace/flashcard-decks/${id}/submit`, { method: "POST", body: JSON.stringify({ note: "Submit for marketplace review" }) });
  },
};
