export interface AdminAiUsageDTO {
  totalRequests: number;
  totalTokens: number;
  estimatedCost: number;
  actionCounts: Record<string, number>;
}

export interface AdminContentSummaryItem {
  id: number;
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK" | string;
  title: string;
  visibility: string;
  marketStatus: string;
}

const BASE_URL = "/api";

async function analyticsRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
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
