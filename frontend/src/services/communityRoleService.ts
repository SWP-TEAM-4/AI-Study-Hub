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

// ─── MOCK DATA FALLBACKS ─────────────────────────────────────────────────────

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
    userId: 1, // Current User
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

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const communityRoleService = {
  // 1. GET /api/admin/community-roles
  async getAdminCommunityRoles(page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<CommunityRoleDTO>>> {
    try {
      return await roleRequest(`/admin/community-roles?page=${page}&size=${size}`, { method: "GET" });
    } catch (err) {
      console.warn("Fallback: getAdminCommunityRoles", err);
      return new Promise(resolve => setTimeout(() => {
        resolve({
          success: true,
          message: "Success",
          data: { items: [...mockRoles].reverse(), page, size, totalElements: mockRoles.length, totalPages: 1 }
        });
      }, 400));
    }
  },

  // 2. POST /api/admin/community-roles
  async grantAdminCommunityRole(payload: GrantRoleRequest): Promise<ApiResponse<CommunityRoleDTO>> {
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
          grantedByUserId: 99, // admin id
          status: "ACTIVE",
          createdAt: new Date().toISOString()
        };
        mockRoles.push(newRole);
        resolve({ success: true, message: "Success", data: newRole });
      }, 500));
    }
  },

  // 3. PATCH /api/admin/community-roles/{id}/revoke
  async revokeAdminCommunityRole(id: number, reason: string): Promise<ApiResponse<CommunityRoleDTO>> {
    try {
      return await roleRequest(`/admin/community-roles/${id}/revoke`, {
        method: "PATCH",
        body: JSON.stringify({ reason })
      });
    } catch (err) {
      console.warn("Fallback: revokeAdminCommunityRole", err);
      return new Promise((resolve, reject) => setTimeout(() => {
        const roleIndex = mockRoles.findIndex(r => r.id === id);
        if (roleIndex === -1) return reject({ message: "Role not found" });
        
        mockRoles[roleIndex] = { ...mockRoles[roleIndex], status: "REVOKED" };
        resolve({ success: true, message: "Success", data: mockRoles[roleIndex] });
      }, 500));
    }
  },

  // 4. GET /api/community-roles/me
  async getMyCommunityRoles(): Promise<ApiResponse<CommunityRoleDTO[]>> {
    try {
      return await roleRequest(`/community-roles/me`, { method: "GET" });
    } catch (err) {
      console.warn("Fallback: getMyCommunityRoles", err);
      return new Promise(resolve => setTimeout(() => {
        // Mock current user has ID = 1
        const myRoles = mockRoles.filter(r => r.userId === 1 && r.status === "ACTIVE");
        resolve({ success: true, message: "Success", data: myRoles });
      }, 300));
    }
  }
};
