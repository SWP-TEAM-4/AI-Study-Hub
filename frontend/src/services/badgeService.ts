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

export interface BadgeDTO {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  createdAt?: string;
}

export const badgeService = {
  async createBadge(payload: { name: string; description: string; iconUrl: string }) {
    return await safeRequest(`/admin/badges`, { method: "POST", body: JSON.stringify(payload) });
  },
  async adminAssignBadgeToUser(userId: number | string, badgeId: number | string) {
    return await safeRequest(`/admin/users/${userId}/badges/${badgeId}`, { method: "POST" });
  },
  async getBadges() {
    return await safeRequest(`/badges`);
  },
};
