export interface AdminAiUsageDTO {
  totalRequests: number;
  totalTokens: number;
  estimatedTokens?: number;
  estimatedCost: number;
  chatRequests?: number;
  summaryRequests?: number;
  quizGenerations?: number;
  flashcardGenerations?: number;
  documentChunkingRequests?: number;
  documentEmbeddingRequests?: number;
  actionCounts: Record<string, number>;
}

export interface AdminContentSummaryItem {
  id: number;
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK" | string;
  title: string;
  visibility: string;
  marketStatus: string;
}

import { safeLocalStorage } from "../utils/safeStorage";
import { safeParseJson } from "../utils/safeParseJson";

const BASE_URL = "/api";

async function analyticsRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = safeLocalStorage.getItem("auth_token");
  const headers = new Headers(options.headers);
  if (token) {
    const cleanToken = token.replace(/['"]+/g, "");
    headers.set("Authorization", `Bearer ${cleanToken}`);
  }
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

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
      message: result.message || "Lỗi giao tiếp Analytics API",
      errorCode: result.errorCode || "ANALYTICS_ERROR",
    };
  }
  return result as T;
}

const request = analyticsRequest;

export const analyticsService = {
  adminGetAiUsage: async () => {
    return request<{ success: boolean; message: string; data: AdminAiUsageDTO }>(
      "/admin/analytics/ai-usage"
    );
  },

  adminGetContents: async () => {
    return request<{ success: boolean; message: string; data: AdminContentSummaryItem[] }>(
      "/admin/contents"
    );
  },
};
