import { ApiResponse, PaginatedResponse } from "./types";
import { safeLocalStorage } from "../utils/safeStorage";
import { safeParseJson } from "../utils/safeParseJson";
import type { BadgeDTO } from "./badgeService";

// ─── DTOS ────────────────────────────────────────────────────────────────────

export interface ContributorDTO {
  rank: number;
  userId: number;
  fullName: string;
  reputationPoints: number;
  approvedContents: number;
  avatarUrl?: string | null;
  downloadCount?: number;
  reviewCount?: number;
  acceptPercentage?: number;
}

export interface ReferralDTO {
  id: number;
  code: string;
  appliedByUserId: number | null;
  status: "ACTIVE" | "APPLIED";
  rewardPoints: number;
}

export interface CommunityProfileSubjectDTO {
  subjectId: number;
  subjectCode?: string | null;
  subjectName?: string | null;
  score: number;
  eventCount: number;
}

export interface CommunityProfileContributionDTO {
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  title: string;
  subjectId?: number | null;
  subjectCode?: string | null;
  downloadCount: number;
  communityReviewCount: number;
  communityRatingAvg?: number | null;
  approvedAt?: string | null;
}

export interface CommunityProfileReviewDTO {
  id: number;
  targetType?: string | null;
  targetId?: number | null;
  targetTitle?: string | null;
  rating?: number | null;
  content?: string | null;
  createdAt?: string | null;
}

export interface CommunityProfileDTO {
  userId: number;
  fullName: string;
  avatarUrl?: string | null;
  reputationPoints: number;
  joinedAt?: string | null;
  badges: BadgeDTO[];
  topSubjects: CommunityProfileSubjectDTO[];
  contributions: CommunityProfileContributionDTO[];
  reviewHistory: CommunityProfileReviewDTO[];
}

// ─── BASE CONFIG ─────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function communityRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = safeLocalStorage.getItem("auth_token");
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
    result = safeParseJson<any>(text, { message: text.substring(0, 200) });
  }

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
      message: result.message || "Lỗi giao tiếp Community API",
      errorCode: result.errorCode || "COMMUNITY_ERROR",
    };
  }
  return result;
}

// ─── MOCK DATA FALLBACKS ─────────────────────────────────────────────────────

let mockMyReferral: ReferralDTO = {
  id: 2101,
  code: "KHOA2026",
  appliedByUserId: null,
  status: "ACTIVE",
  rewardPoints: 0
};

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const communityService = {
  // 1. GET /api/community/leaderboard/contributors
  async getLeaderboardContributors(page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<ContributorDTO>>> {
    return communityRequest(`/community/leaderboard/contributors?page=${page}&size=${size}`, { method: "GET" });
  },

  async getCommunityProfile(userId: number): Promise<ApiResponse<CommunityProfileDTO>> {
    return communityRequest(`/community/users/${userId}/profile`, { method: "GET" });
  },

  // 2. GET /api/referrals/me
  async getMyReferralInfo(): Promise<ApiResponse<ReferralDTO>> {
    return await communityRequest(`/referrals/me`, { method: "GET" });
  },

  // 3. POST /api/referrals/apply
  async applyReferralCode(referralCode: string): Promise<ApiResponse<ReferralDTO>> {
    return await communityRequest(`/referrals/apply`, {
      method: "POST",
      body: JSON.stringify({ referralCode }),
    });
  },
};
