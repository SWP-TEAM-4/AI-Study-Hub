import { PaginatedResponse } from "./types";

export interface AiUsageDTO {
  userId: number;
  period: string;
  chatRequests: number;
  quizGenerations: number;
  flashcardGenerations: number;
  estimatedTokens: number;
}

const BASE_URL = "/api";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  const textData = await response.text();
  const result = textData ? JSON.parse(textData) : {};

  if (!response.ok) {
    throw { status: response.status, message: result.message || "Lỗi hệ thống" };
  }
  return result as T;
}

function buildQueryString(params?: { page?: number; size?: number }): string {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.append("page", params.page.toString());
  if (params?.size !== undefined) query.append("size", params.size.toString());
  const str = query.toString();
  return str ? `?${str}` : "";
}

export const analyticsService = {
  adminGetAiUsage: async (params?: { page?: number; size?: number }) => {
    return request<{ success: boolean; message: string; data: PaginatedResponse<AiUsageDTO> }>(
      `/admin/analytics/ai-usage${buildQueryString(params)}`
    );
  }
};
