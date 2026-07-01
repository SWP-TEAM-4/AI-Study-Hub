import { ApiResponse, PaginatedResponse } from "./types";

// ─── DTOS ───────────────────────────────────────────────────────────────────

export interface CommunityRoleDTO {
  id: number;
  userId: number;
  grantedByUserId: number;
  roleType: string; // e.g. "MARKETPLACE_REVIEWER", "MODERATOR", etc.
  scopeType: string; // e.g. "SUBJECT", "GLOBAL"
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

// ─── BASE CONFIG ─────────────────────────────────────────────────────────────

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

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const communityRoleService = {
  // 1. GET /api/admin/community-roles
  async getAdminCommunityRoles(page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<CommunityRoleDTO>>> {
    return roleRequest(`/admin/community-roles?page=${page}&size=${size}`, { method: "GET" });
  },

  // 2. POST /api/admin/community-roles
  async grantAdminCommunityRole(payload: GrantRoleRequest): Promise<ApiResponse<CommunityRoleDTO>> {
    return roleRequest(`/admin/community-roles`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
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
    return roleRequest(`/community-roles/me`, { method: "GET" });
  }
};
