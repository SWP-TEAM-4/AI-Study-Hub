import { ApiResponse, PaginatedResponse } from "./types";

export interface CommunityRoleDTO {
  id: number;
  userId: number;
  grantedByUserId: number;
  roleType: string;
  scopeType: string;
  scopeId: number | null;
  startAt: string;
  endAt: string | null;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  createdAt: string;
}

export interface GrantRoleRequest {
  userId: number;
  roleType: string;
  scopeType: string;
  scopeId: number | null;
  startAt: string;
  endAt: string | null;
}

export interface AdminCommunityRoleParams {
  keyword?: string;
  userId?: number;
  roleType?: string;
  status?: string;
  scopeType?: string;
  scopeId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

const BASE_URL = "/api";

async function roleRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      message: result.message || "Lỗi giao tiếp API Phân quyền",
      errorCode: result.errorCode || "ROLE_ERROR"
    };
  }
  return result;
}

<<<<<<< HEAD
// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const communityRoleService = {
  // 1. GET /api/admin/community-roles
  async getAdminCommunityRoles(page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<CommunityRoleDTO>>> {
    return roleRequest(`/admin/community-roles?page=${page}&size=${size}`, { method: "GET" });
=======
let mockRoles: CommunityRoleDTO[] = [
  {
    id: 1401,
    userId: 2,
    grantedByUserId: 99,
    roleType: "MARKETPLACE_REVIEWER",
    scopeType: "SUBJECT",
    scopeId: 12,
    startAt: "2026-06-12T00:00:00",
    endAt: "2026-07-12T00:00:00",
    status: "ACTIVE",
    createdAt: "2026-06-12T22:30:00"
  },
  {
    id: 1402,
    userId: 1,
    grantedByUserId: 99,
    roleType: "COMMUNITY_MODERATOR",
    scopeType: "GLOBAL",
    scopeId: null,
    startAt: "2026-01-01T00:00:00",
    endAt: "2027-01-01T00:00:00",
    status: "ACTIVE",
    createdAt: "2025-12-30T10:00:00"
  }
];

export const communityRoleService = {
  // 1. GET /api/admin/community-roles (Bổ sung bộ lọc chi tiết từ Swagger)
  async getAdminCommunityRoles(params?: AdminCommunityRoleParams): Promise<ApiResponse<PaginatedResponse<CommunityRoleDTO>>> {
    try {
      const query = new URLSearchParams();
      if (params?.keyword) query.append("keyword", params.keyword);
      if (params?.userId !== undefined) query.append("userId", String(params.userId));
      if (params?.roleType) query.append("roleType", params.roleType);
      if (params?.status) query.append("status", params.status);
      if (params?.scopeType) query.append("scopeType", params.scopeType);
      if (params?.scopeId !== undefined) query.append("scopeId", String(params.scopeId));
      query.append("page", String(params?.page ?? 0));
      query.append("size", String(params?.size ?? 10));
      query.append("sort", params?.sort ?? "newest");

      return await roleRequest(`/admin/community-roles?${query.toString()}`, { method: "GET" });
    } catch (err) {
      console.warn("Fallback: getAdminCommunityRoles", err);
      return new Promise(resolve => setTimeout(() => {
        resolve({
          success: true,
          message: "Success",
          data: { items: [...mockRoles].reverse(), page: params?.page || 0, size: params?.size || 10, totalElements: mockRoles.length, totalPages: 1 }
        });
      }, 400));
    }
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
  },

  // 2. POST /api/admin/community-roles
  async grantAdminCommunityRole(payload: GrantRoleRequest): Promise<ApiResponse<CommunityRoleDTO>> {
<<<<<<< HEAD
    return roleRequest(`/admin/community-roles`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
=======
    try {
      return await roleRequest(`/admin/community-roles`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (err: any) {
      console.warn("Fallback: grantAdminCommunityRole", err);
      return new Promise((resolve, reject) => setTimeout(() => {
        if (!payload.userId || !payload.roleType || !payload.scopeType) {
          return reject({ message: "Thiếu thông tin bắt buộc" });
        }
        const newRole: CommunityRoleDTO = {
          id: Date.now(),
          ...payload,
          grantedByUserId: 99,
          status: "ACTIVE",
          createdAt: new Date().toISOString()
        };
        mockRoles.push(newRole);
        resolve({ success: true, message: "Success", data: newRole });
      }, 500));
    }
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
  },

  // 3. PATCH /api/admin/community-roles/{id}/revoke
  async revokeAdminCommunityRole(id: number, reason: string): Promise<ApiResponse<CommunityRoleDTO>> {
    return roleRequest(`/admin/community-roles/${id}/revoke`, {
      method: "PATCH",
      body: JSON.stringify({ reason })
    });
  },

  // 4. GET /api/community-roles/me
  async getMyCommunityRoles(): Promise<ApiResponse<CommunityRoleDTO[]>> {
<<<<<<< HEAD
    return roleRequest(`/community-roles/me`, { method: "GET" });
=======
    try {
      return await roleRequest(`/community-roles/me`, { method: "GET" });
    } catch (err) {
      console.warn("Fallback: getMyCommunityRoles", err);
      return new Promise(resolve => setTimeout(() => {
        const myRoles = mockRoles.filter(r => r.userId === 1 && r.status === "ACTIVE");
        resolve({ success: true, message: "Success", data: myRoles });
      }, 300));
    }
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
  }
};