import { PaginatedResponse } from "./types";

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

const mockActivityLogs: ActivityLogDTO[] = [
  {
    id: 2001,
    actorId: 1,
    action: "UPLOAD_DOCUMENT",
    targetType: "DOCUMENT",
    targetId: 501,
    metadata: { fileType: "pdf" },
    createdAt: "2026-06-12T23:00:00"
  },
  {
    id: 2002,
    actorId: 2,
    action: "LOGIN",
    targetType: "SYSTEM",
    targetId: 0,
    metadata: { ip: "192.168.1.1" },
    createdAt: "2026-06-12T23:05:00"
  },
  {
    id: 2003,
    actorId: 1,
    action: "DELETE_USER",
    targetType: "USER",
    targetId: 42,
    metadata: { reason: "Spam" },
    createdAt: "2026-06-12T23:10:00"
  }
];

const BASE_URL = "/api";

async function logRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) {
    const cleanToken = token.replace(/['"]+/g, '');
    headers.set("Authorization", `Bearer ${cleanToken}`);
  }
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

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
    throw { status: response.status, message: result.message || "Lỗi xử lý API" };
  }
  return result;
}

export const activityLogService = {
  adminGetActivityLogs: async (params?: ActivityLogParams): Promise<ApiResponse<PaginatedResponse<ActivityLogDTO>>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append("page", params.page.toString());
      if (params?.size !== undefined) queryParams.append("size", params.size.toString());
      if (params?.keyword) queryParams.append("keyword", params.keyword);
      if (params?.sort) queryParams.append("sort", params.sort);

      const qs = queryParams.toString();
      return await logRequest<ApiResponse<PaginatedResponse<ActivityLogDTO>>>(`/admin/activity-logs${qs ? '?' + qs : ''}`);
    } catch (err) {
      console.warn("Fallback: Dùng mock data do chưa có BE", err);
      return new Promise((resolve) => {
        setTimeout(() => {
          let items = [...mockActivityLogs];
          
          if (params?.keyword) {
            items = items.filter(i => 
              i.action.toLowerCase().includes(params.keyword!.toLowerCase()) || 
              i.targetType.toLowerCase().includes(params.keyword!.toLowerCase())
            );
          }

          resolve({
            success: true,
            message: "Success",
            data: {
              items,
              page: params?.page || 0,
              size: params?.size || 10,
              totalElements: items.length,
              totalPages: 1
            }
          });
        }, 500);
      });
    }
  }
};
