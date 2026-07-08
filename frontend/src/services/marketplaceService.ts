import { ApiResponse, PaginatedResponse } from "./types";

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
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

>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
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
  visibility?: "PRIVATE" | "PUBLIC_LINK" | "WORKSPACE" | "MARKETPLACE";
  submittedAt?: string;
  createdAt?: string;
  ownerId?: number;
  adminRequired?: boolean;
  policyMode?: "SINGLE_REVIEWER" | "QUORUM";
  requiredVotes?: number;
}

export interface VoteResultDTO {
  id: number;
  reviewerId: number;
  targetType: string;
  targetId: number;
  voteResult: string;
  reviewNote?: string;
  createdAt: string;
  submissionId: number;
  submissionStatus: "PENDING" | "APPROVED" | "REJECTED";
  approvedVotes: number;
  rejectedVotes: number;
  totalVotes: number;
  requiredVotes: number;
  approvalPercentageRequired: number;
  decisionReached: boolean;
}

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
export interface ReviewPolicyDTO {
  subjectId: number;
  mode: "SINGLE_REVIEWER" | "QUORUM";
  requiredVotes: number;
  approvalPercentage: number;
  subjectOverride: boolean;
}

const BASE_URL = "/api";

async function marketRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token.replace(/['"]+/g, "")}`);
  const method = (options.method || "GET").toUpperCase();
  if (!headers.has("Content-Type") && method !== "GET" && method !== "DELETE") headers.set("Content-Type", "application/json");
  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};
  if (!response.ok) throw { status: response.status, message: result.message || "Lỗi giao tiếp API Marketplace", errorCode: result.errorCode };
  return result;
}

function page<T>(items: T[], pageNumber: number, size: number): PaginatedResponse<T> {
  const start = pageNumber * size;
  return { items: items.slice(start, start + size), page: pageNumber, size, totalElements: items.length, totalPages: Math.ceil(items.length / size) };
}

export const marketplaceService = {
  getReviewPolicy(subjectId: number): Promise<ApiResponse<ReviewPolicyDTO>> {
    return marketRequest(`/admin/marketplace/review-policies/${subjectId}`);
  },

  updateReviewPolicy(subjectId: number, payload: Pick<ReviewPolicyDTO, "mode" | "requiredVotes" | "approvalPercentage">): Promise<ApiResponse<ReviewPolicyDTO>> {
    return marketRequest(`/admin/marketplace/review-policies/${subjectId}`, { method: "PUT", body: JSON.stringify(payload) });
  },

  async getAdminContents(pageNumber = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<AdminContentDTO>>> {
    const response = await marketRequest<ApiResponse<Array<any>>>("/admin/contents");
    const items = response.data.map((item) => ({
      ...item, targetId: item.id, creatorName: item.ownerName,
    } as AdminContentDTO)).filter((item) => !keyword || item.title.toLowerCase().includes(keyword.toLowerCase()));
    return { ...response, data: page(items, pageNumber, size) };
  },

  deleteAdminContent(targetType: string, targetId: number): Promise<ApiResponse<null>> {
    return marketRequest(`/admin/contents/${targetType}/${targetId}`, { method: "DELETE" });
  },

  getAdminContentDetails(targetType: string, targetId: number): Promise<ApiResponse<AdminContentDTO>> {
    return marketRequest(`/admin/contents/${targetType}/${targetId}`);
  },

  updateVisibility(targetType: string, targetId: number, visibility: "PRIVATE" | "WORKSPACE" | "MARKETPLACE"): Promise<ApiResponse<AdminContentDTO>> {
    return marketRequest(`/admin/contents/${targetType}/${targetId}/visibility`, { method: "PATCH", body: JSON.stringify({ visibility }) });
  },

  async getAdminPending(pageNumber = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<AdminContentDTO>>> {
    const response = await marketRequest<ApiResponse<PaginatedResponse<AdminContentDTO>>>(`/admin/marketplace/pending?page=${pageNumber}&size=${size}&keyword=${encodeURIComponent(keyword)}`);
    return { ...response, data: { ...response.data, items: response.data.items.map((item) => ({ ...item, marketStatus: "PENDING", visibility: "MARKETPLACE" })) } };
  },

  approveAdminContent(targetType: string, targetId: number, reviewNote?: string): Promise<ApiResponse<VoteResultDTO>> {
    return marketRequest(`/admin/marketplace/${targetType}/${targetId}/approve`, { method: "PATCH", body: JSON.stringify({ reviewNote }) });
  },

  rejectAdminContent(targetType: string, targetId: number, reviewNote?: string): Promise<ApiResponse<VoteResultDTO>> {
    return marketRequest(`/admin/marketplace/${targetType}/${targetId}/reject`, { method: "PATCH", body: JSON.stringify({ reviewNote }) });
  },

  async getReviewerPending(pageNumber = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<AdminContentDTO>>> {
    const response = await marketRequest<ApiResponse<PaginatedResponse<AdminContentDTO>>>(`/reviewer/marketplace/pending?page=${pageNumber}&size=${size}&keyword=${encodeURIComponent(keyword)}`);
    return { ...response, data: { ...response.data, items: response.data.items.map((item) => ({ ...item, marketStatus: "PENDING", visibility: "MARKETPLACE" })) } };
  },

  getReviewerContentDetails(targetType: string, targetId: number): Promise<ApiResponse<AdminContentDTO>> {
    return marketRequest(`/reviewer/marketplace/${targetType}/${targetId}`);
  },

  voteReviewerContent(targetType: string, targetId: number, voteResult: "APPROVED" | "REJECTED", reviewNote?: string): Promise<ApiResponse<VoteResultDTO>> {
    return marketRequest(`/reviewer/marketplace/${targetType}/${targetId}/vote`, { method: "POST", body: JSON.stringify({ voteResult, reviewNote }) });
  },
<<<<<<< HEAD
=======
=======
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
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
};
