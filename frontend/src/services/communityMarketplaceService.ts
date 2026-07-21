import { ApiResponse, PaginatedResponse } from "./types";
import { safeLocalStorage } from "../utils/safeStorage";
import { safeParseJson } from "../utils/safeParseJson";

const BASE_URL = "/api";

export type CommunityTargetType = "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
export type CommunityCategory = "all" | "documents" | "quizzes" | "flashcards";
export type CommunitySort = "newest" | "downloadCount" | "acceptPercentage";

export interface MarketplaceItemDTO {
  targetType: CommunityTargetType;
  targetId: number;
  title: string;
  subjectId?: number | null;
  creatorName?: string | null;
  downloadCount?: number | null;
  reviewCount?: number | null;
  acceptPercentage?: number | string | null;
  marketStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  visibility?: "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";
  clonedFromId?: number | null;
  createdAt?: string | null;
}

export interface CloneResultDTO {
  id: number;
  title: string;
  clonedFromId?: number | null;
  targetType?: CommunityTargetType;
}

export interface ContributorDTO {
  rank: number;
  userId: number;
  fullName: string;
  reputationPoints: number;
  approvedContents: number;
}

export interface MarketplaceFilters {
  category?: CommunityCategory;
  page?: number;
  size?: number;
  keyword?: string;
  sort?: CommunitySort;
  subjectId?: number;
  academicTermId?: number;
  examType?: string;
}

async function communityMarketRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = safeLocalStorage.getItem("auth_token");
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
  const result = safeParseJson<any>(text, {});

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
      message: result.message || "Lỗi giao tiếp Community Marketplace API",
      errorCode: result.errorCode || "COMMUNITY_MARKETPLACE_ERROR",
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

function categoryEndpoint(category: CommunityCategory = "all") {
  if (category === "documents") return "/marketplace/documents";
  if (category === "quizzes") return "/marketplace/quizzes";
  if (category === "flashcards") return "/marketplace/flashcard-decks";
  return "/marketplace/search";
}

function cloneEndpoint(targetType: CommunityTargetType, id: number) {
  if (targetType === "DOCUMENT") return `/marketplace/documents/${id}/clone`;
  if (targetType === "QUIZ") return `/marketplace/quizzes/${id}/clone`;
  return `/marketplace/flashcard-decks/${id}/clone`;
}

export const communityMarketplaceService = {
  browse(filters: MarketplaceFilters = {}) {
    const endpoint = categoryEndpoint(filters.category);
    return communityMarketRequest<ApiResponse<PaginatedResponse<MarketplaceItemDTO>>>(
      `${endpoint}${toQuery({
        page: filters.page ?? 0,
        size: filters.size ?? 24,
        keyword: filters.keyword,
        sort: filters.sort ?? "newest",
        subjectId: filters.subjectId,
        academicTermId: filters.academicTermId,
        examType: filters.examType,
      })}`,
      { method: "GET" },
    );
  },

  clone(targetType: CommunityTargetType, id: number, targetNotebookId?: number) {
    return communityMarketRequest<ApiResponse<CloneResultDTO>>(cloneEndpoint(targetType, id), {
      method: "POST",
      body: JSON.stringify({ targetNotebookId }),
    });
  },

  getLeaderboard(page = 0, size = 10) {
    return communityMarketRequest<ApiResponse<PaginatedResponse<ContributorDTO>>>(
      `/community/leaderboard/contributors${toQuery({ page, size })}`,
      { method: "GET" },
    );
  },
};
