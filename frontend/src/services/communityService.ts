import { ApiResponse, PaginatedResponse } from "./types";

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

// ─── BASE CONFIG ─────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function communityRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
    try {
      result = JSON.parse(text);
    } catch {
      result = { message: text.substring(0, 200) };
    }
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
      message: result.message || "Lỗi giao tiếp Community API",
      errorCode: result.errorCode || "COMMUNITY_ERROR",
    };
  }
  return result;
}

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
// ─── MOCK DATA FALLBACKS ─────────────────────────────────────────────────────

let mockMyReferral: ReferralDTO = {
  id: 2101,
  code: "KHOA2026",
  appliedByUserId: null,
  status: "ACTIVE",
  rewardPoints: 0
};

<<<<<<< HEAD
=======
=======
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const communityService = {
  // 1. GET /api/community/leaderboard/contributors
<<<<<<< HEAD
  async getLeaderboardContributors(page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<ContributorDTO>>> {
    return communityRequest(`/community/leaderboard/contributors?page=${page}&size=${size}`, { method: "GET" });
=======
<<<<<<< HEAD
  async getLeaderboardContributors(page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<ContributorDTO>>> {
    return communityRequest(`/community/leaderboard/contributors?page=${page}&size=${size}`, { method: "GET" });
=======
  async getLeaderboardContributors(
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PaginatedResponse<ContributorDTO>>> {
    return await communityRequest(
      `/community/leaderboard/contributors?page=${page}&size=${size}`,
      { method: "GET" }
    );
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
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
