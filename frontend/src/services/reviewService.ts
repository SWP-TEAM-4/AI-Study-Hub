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

export type ReviewTargetType = "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";

export interface ReviewDTO {
  id: number;
  targetType: ReviewTargetType;
  targetId: number;
  rating: number;
  content: string;
  reviewerId: number;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
  createdAt: string;
}

export const reviewService = {
  async getReviews(targetType: ReviewTargetType, targetId: number, page = 0, size = 10) {
    return await safeRequest(`/community/reviews?targetType=${targetType}&targetId=${targetId}&page=${page}&size=${size}`, { method: "GET" });
  },
  async createReview(payload: { targetType: ReviewTargetType; targetId: number; rating: number; content: string }) {
    return await safeRequest(`/community/reviews`, { method: "POST", body: JSON.stringify(payload) });
  },
  async updateReview(id: number, payload: { targetType: ReviewTargetType; targetId: number; rating: number; content: string }) {
    return await safeRequest(`/community/reviews/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  async deleteReview(id: number) {
    return await safeRequest(`/community/reviews/${id}`, { method: "DELETE" });
  },
};
