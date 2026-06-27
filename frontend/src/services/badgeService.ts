import { ApiResponse } from "./types";

const BASE_URL = "/api";

async function bRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Lỗi giao tiếp API Badge",
      errorCode: result.errorCode || "BADGE_ERROR"
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
  color?: string; // UI addition
}

let mockBadges: BadgeDTO[] = [
  { id: 1501, name: "First Upload", description: "Uploaded first approved content", iconUrl: "/badges/first-upload.svg", createdAt: "2026-06-12T22:35:00", color: "165" },
  { id: 1502, name: "Quiz Master", description: "Scored 100 on 5 quizzes", iconUrl: "/badges/quiz-master.svg", createdAt: "2026-06-13T10:00:00", color: "35" }
];

export const badgeService = {
  // 1. Admin tạo huy hiệu mới
  async createBadge(payload: { name: string; description: string; iconUrl: string }): Promise<ApiResponse<BadgeDTO>> {
    try {
      return await bRequest(`/admin/badges`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch {
      return new Promise((res) => setTimeout(() => {
        const newBadge: BadgeDTO = {
          id: Date.now(),
          ...payload,
          createdAt: new Date().toISOString(),
          color: ["165", "35", "200", "75"][Math.floor(Math.random() * 4)]
        };
        mockBadges.push(newBadge);
        res({ success: true, message: "Success", data: newBadge });
      }, 300));
    }
  },

  // 2. Lấy danh sách huy hiệu hiện có
  async getBadges(): Promise<ApiResponse<BadgeDTO[]>> {
    try {
      return await bRequest(`/badges`);
    } catch {
      return new Promise((res) => setTimeout(() => {
        res({ success: true, message: "Success", data: [...mockBadges] });
      }, 200));
    }
  }
};
