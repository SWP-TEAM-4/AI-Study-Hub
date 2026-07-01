"use client";

export interface UserDTO {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  currentSemesterId: number | null;
  currentSemesterCode: string | null;
  currentSemesterName: string | null;
  comboId: number | null;
  comboCode: string | null;
  comboName: string | null;
  role: "STUDENT" | "REVIEWER" | "ADMIN";
  reputationPoints: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ActivityLogDTO {
  id: number;
  actorId: number;
  action: string;
  targetType: string;
  targetId: number;
  metadata: {
    fileType?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export interface AIUsageDTO {
  userId: number;
  period: string;
  chatRequests: number;
  quizGenerations: number;
  flashcardGenerations: number;
  estimatedTokens: number;
}

export interface BadgeDTO {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  createdAt: string;
}

export interface TestHistoryDTO {
  id: number;
  quizId: number;
  userId: number;
  title: string;
  totalScore: number;
  duration: number;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  createdAt: string;
}

const BASE_URL = "/api";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) {
    const cleanToken = token.replace(/['"]+/g, "");
    headers.set("Authorization", `Bearer ${cleanToken}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const textData = await response.text();
  let result: any = {};
  if (textData && textData.trim().length > 0) {
    try {
      result = JSON.parse(textData);
    } catch {
      result = { message: textData.substring(0, 200) };
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
      message: result.message || "Lỗi hệ thống",
      errorCode: result.errorCode,
    };
  }
  return result as T;
}

function buildQueryString(params?: {
  page?: number;
  size?: number;
  keyword?: string;
  sort?: string;
  role?: string;
  isActive?: boolean;
}): string {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.append("page", params.page.toString());
  if (params?.size !== undefined) query.append("size", params.size.toString());
  if (params?.keyword) query.append("keyword", params.keyword);
  if (params?.sort) query.append("sort", params.sort);
  if (params?.role) query.append("role", params.role);
  if (params?.isActive !== undefined) query.append("isActive", params.isActive.toString());
  const str = query.toString();
  return str ? `?${str}` : "";
}

export const userService = {
  // ==========================================
  // PHÂN HỆ QUẢN TRỊ (ADMIN SCOPE)
  // ==========================================

  async adminGetUsers(params?: {
    page?: number;
    size?: number;
    keyword?: string;
    sort?: string;
    role?: string;
    isActive?: boolean;
  }) {
    return request<{ success: boolean; message: string; data: PaginatedResponse<UserDTO> }>(
      `/admin/users${buildQueryString(params)}`
    );
  },

  async adminGetUserById(id: number | string) {
    return request<{ success: boolean; message: string; data: UserDTO }>(`/admin/users/${id}`);
  },

  async adminToggleUserActive(id: number | string, isActive: boolean) {
    return request<{ success: boolean; message: string; data: UserDTO }>(`/admin/users/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },

  async adminUpdateUserRole(id: number | string, role: "STUDENT" | "REVIEWER" | "ADMIN") {
    return request<{ success: boolean; message: string; data: UserDTO }>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  async adminAssignBadgeToUser(userId: number | string, badgeId: number | string) {
    return request<{ success: boolean; message: string; data: BadgeDTO }>(
      `/admin/users/${userId}/badges/${badgeId}`,
      { method: "POST" }
    );
  },

  async adminGetAIUsageAnalytics() {
    return request<{
      success: boolean;
      message: string;
      data: {
        totalRequests: number;
        totalTokens: number;
        estimatedCost: number;
        actionCounts: Record<string, number>;
      };
    }>("/admin/analytics/ai-usage");
  },

  // ==========================================
  // PHÂN HỆ NGƯỜI DÙNG CÁ NHÂN (STUDENT+)
  // ==========================================

  async getMyProfile() {
    return request<{ success: boolean; message: string; data: UserDTO }>("/users/me");
  },

  async updateMyProfile(
    profileData: Partial<Pick<UserDTO, "fullName" | "avatarUrl" | "currentSemesterId" | "comboId">>
  ) {
    return request<{ success: boolean; message: string; data: UserDTO }>("/users/me", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  async getMyActivityLogs(params?: { page?: number; size?: number; keyword?: string; sort?: string }) {
    return request<{ success: boolean; message: string; data: PaginatedResponse<ActivityLogDTO> }>(
      `/users/me/activity-logs${buildQueryString(params)}`
    );
  },

  async changeMyPassword(passwordPayload: { oldPasswordInput: string; newPasswordInput: string }) {
    const contractPayload = {
      oldPassword: passwordPayload.oldPasswordInput,
      newPassword: passwordPayload.newPasswordInput,
    };
    return request<{ success: boolean; message: string; data: UserDTO }>("/users/me/change-password", {
      method: "PATCH",
      body: JSON.stringify(contractPayload),
    });
  },

  async getMyAIUsage(params?: { page?: number; size?: number; keyword?: string; sort?: string }) {
    return request<{ success: boolean; message: string; data: AIUsageDTO }>(
      `/users/me/ai-usage${buildQueryString(params)}`
    );
  },

  async getMyBadges(params?: { page?: number; size?: number; keyword?: string; sort?: string }) {
    return request<{ success: boolean; message: string; data: BadgeDTO[] }>(
      `/users/me/badges${buildQueryString(params)}`
    );
  },

  async getMyTestHistory(params?: { page?: number; size?: number; keyword?: string; sort?: string }) {
    return request<{ success: boolean; message: string; data: PaginatedResponse<TestHistoryDTO> }>(
      `/users/me/tests${buildQueryString(params)}`
    );
  },
};
