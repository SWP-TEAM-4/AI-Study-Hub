import { ApiResponse, PaginatedResponse } from "./types";

// ─── DTOS ───────────────────────────────────────────────────────────────────

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
      message: result.message || "Lỗi giao tiếp Community API",
      errorCode: result.errorCode || "COMMUNITY_ERROR"
    };
  }
  return result;
}

// ─── MOCK DATA FALLBACKS ─────────────────────────────────────────────────────

const mockContributors: ContributorDTO[] = [
  { rank: 1, userId: 2, fullName: "Tran Thi B", reputationPoints: 980, approvedContents: 42 },
  { rank: 2, userId: 15, fullName: "Nguyen Van C", reputationPoints: 850, approvedContents: 35 },
  { rank: 3, userId: 8, fullName: "Le Hoang D", reputationPoints: 720, approvedContents: 28 },
  { rank: 4, userId: 1, fullName: "Lê Trần Anh Khoa", reputationPoints: 650, approvedContents: 21 },
  { rank: 5, userId: 22, fullName: "Pham Nhat E", reputationPoints: 500, approvedContents: 15 },
];

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

  // 2. GET /api/referrals/me
  async getMyReferralInfo(): Promise<ApiResponse<ReferralDTO>> {
    try {
      return await communityRequest(`/referrals/me`, { method: "GET" });
    } catch (err) {
      console.warn("Fallback: Get My Referral Info", err);
      return new Promise(resolve => setTimeout(() => {
        resolve({ success: true, message: "Success", data: mockMyReferral });
      }, 300));
    }
  },

  // 3. POST /api/referrals/apply
  async applyReferralCode(referralCode: string): Promise<ApiResponse<ReferralDTO>> {
    try {
      return await communityRequest(`/referrals/apply`, {
        method: "POST",
        body: JSON.stringify({ referralCode })
      });
    } catch (err: any) {
      console.warn("Fallback: Apply Referral Code", err);
      return new Promise((resolve, reject) => setTimeout(() => {
        // Logic mock validate code
        if (!referralCode || referralCode.trim().length < 5) {
          return reject({ message: "Mã giới thiệu không hợp lệ" });
        }
        if (referralCode.toUpperCase() === mockMyReferral.code) {
          return reject({ message: "Không thể nhập mã của chính mình!" });
        }
        
        // Cập nhật trạng thái
        mockMyReferral = {
          ...mockMyReferral,
          appliedByUserId: 99, // ai đó
          status: "APPLIED",
          rewardPoints: mockMyReferral.rewardPoints + 20
        };

        resolve({ success: true, message: "Success", data: mockMyReferral });
      }, 500));
    }
  }
};
