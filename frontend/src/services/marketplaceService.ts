import { ApiResponse, PaginatedResponse } from "./types";
import { safeLocalStorage } from "../utils/safeStorage";
import { safeParseJson } from "../utils/safeParseJson";

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
  visibility?: "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";
  submittedAt?: string;
  createdAt?: string;
  ownerId?: number;
  adminRequired?: boolean;
  policyMode?: "SINGLE_REVIEWER" | "QUORUM";
  requiredVotes?: number;
  fileUrl?: string | null;
  fileType?: string | null;
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
  reviewerRewardPointsDelta?: number | null;
  reviewerRewardTitle?: string | null;
  reviewerRewardMessage?: string | null;
}

export interface ReviewPolicyDTO {
  subjectId: number;
  mode: "SINGLE_REVIEWER" | "QUORUM";
  requiredVotes: number;
  approvalPercentage: number;
  subjectOverride: boolean;
}

const BASE_URL = "/api";

async function marketRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = safeLocalStorage.getItem("auth_token");
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token.replace(/['\"]+/g, "")}`);
  const method = (options.method || "GET").toUpperCase();
  if (!headers.has("Content-Type") && method !== "GET" && method !== "DELETE") headers.set("Content-Type", "application/json");
  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const result = safeParseJson<any>(text, {});
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

  updateVisibility(targetType: string, targetId: number, visibility: "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE"): Promise<ApiResponse<AdminContentDTO>> {
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

  async searchMarketplace(pageNumber = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<AdminContentDTO>>> {
    return marketRequest(`/marketplace/search?page=${pageNumber}&size=${size}&keyword=${encodeURIComponent(keyword)}`);
  },

  async getMarketplaceFlashcardDecks(pageNumber = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<AdminContentDTO>>> {
    return marketRequest(`/marketplace/flashcard-decks?page=${pageNumber}&size=${size}&keyword=${encodeURIComponent(keyword)}&sort=createdAt,desc`);
  },

  async cloneFlashcardDeck(id: number, targetNotebookId?: number): Promise<ApiResponse<unknown>> {
    return marketRequest(`/marketplace/flashcard-decks/${id}/clone`, { method: "POST", body: JSON.stringify({ targetNotebookId }) });
  },

  async submitFlashcardDeck(id: number): Promise<ApiResponse<unknown>> {
    return marketRequest(`/marketplace/flashcard-decks/${id}/submit`, { method: "POST", body: JSON.stringify({ note: "Submit for marketplace review" }) });
  },
};
