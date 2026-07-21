import { PaginatedResponse } from "./types";
import { safeLocalStorage } from "../utils/safeStorage";
import { safeParseJson } from "../utils/safeParseJson";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ActivityLogDTO {
  id: number;
  actorId: number;
  action: string;
  targetType: string;
  targetId: number;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface ActivityLogParams {
  page?: number;
  size?: number;
  keyword?: string;
  sort?: string;
}

const BASE_URL = "/api";

async function logRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = safeLocalStorage.getItem("auth_token");
  const headers = new Headers(options.headers);
  if (token) {
    const cleanToken = token.replace(/['"]+/g, '');
    headers.set("Authorization", `Bearer ${cleanToken}`);
  }
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

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
    throw { status: response.status, message: result.message || "Lỗi xử lý API" };
  }
  return result;
}

export const activityLogService = {
  adminGetActivityLogs: async (params?: ActivityLogParams): Promise<ApiResponse<PaginatedResponse<ActivityLogDTO>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append("page", params.page.toString());
    if (params?.size !== undefined) queryParams.append("size", params.size.toString());
    if (params?.keyword) queryParams.append("keyword", params.keyword);
    if (params?.sort) queryParams.append("sort", params.sort);

    const qs = queryParams.toString();
    return await logRequest<ApiResponse<PaginatedResponse<ActivityLogDTO>>>(`/admin/activity-logs${qs ? '?' + qs : ''}`);
  }
};
