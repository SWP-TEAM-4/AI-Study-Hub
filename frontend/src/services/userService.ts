"use client";

export interface UserDTO {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  currentSemesterCode?: string | null;
  currentSemesterName?: string | null;
  currentSemesterId: number | null;
  comboCode?: string | null;
  comboName?: string | null;
  comboId: number | null;
  role: "STUDENT" | "REVIEWER" | "ADMIN";
  reputationPoints: number;
  points?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
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
  userId?: number;
  period?: string;
  chatRequests: number;
  quizGenerations: number;
  flashcardGenerations: number;
  estimatedTokens: number;
  totalRequests: number;
  totalTokens: number;
  estimatedCost?: number;
  maxRequests?: number;
  usedRequests?: number;
  actionCounts: Record<string, number>;
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

// ─── 3. INTERACTION UTILS TO CONSTRUCT PARAMS ───────────────────────────────────

export interface AdminUserQuery {
  page?: number;
  size?: number;
  keyword?: string;
  sort?: "newest" | "oldest";
  role?: "STUDENT" | "REVIEWER" | "ADMIN";
  isActive?: boolean;
}

export interface UserCapabilitiesDTO {
  admin: boolean;
  canReviewMarketplace: boolean;
  canModerateReports: boolean;
}

function buildQueryString(params?: {
  page?: number;
  size?: number;
  keyword?: string;
  sort?: string;
  role?: UserDTO["role"];
  isActive?: boolean;
}): string {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.append("page", params.page.toString());
  if (params?.size !== undefined) query.append("size", params.size.toString());
  if (params?.keyword) query.append("keyword", params.keyword);
  if (params?.sort) query.append("sort", params.sort);
  if (params?.role) query.append("role", params.role);
  if (params?.isActive !== undefined) query.append("isActive", String(params.isActive));
  const str = query.toString();
  return str ? `?${str}` : "";
}

export const userService = {
  // ==========================================
  // PHÂN HỆ QUẢN TRỊ (ADMIN SCOPE)
  // ==========================================

  /**
   * 1. GET /api/admin/users - Admin lấy danh sách người dùng phân trang
   */
  async adminGetUsers(params?: AdminUserQuery) {
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
      currentPassword: passwordPayload.oldPasswordInput,
      newPassword: passwordPayload.newPasswordInput
    };
    return request<{ success: boolean; message: string; data: null }>("/users/me/change-password", {
      method: "PATCH",
      body: JSON.stringify(contractPayload),
    });
  },

  async getMyCapabilities() {
    return request<{ success: boolean; message: string; data: UserCapabilitiesDTO }>("/users/me/capabilities");
  },

  /** GET /api/badges - Danh sách badge thật để admin lựa chọn khi gán. */
  async getAvailableBadges() {
    return request<{ success: boolean; message: string; data: BadgeDTO[] }>("/badges");
  },

  /**
   * 9. GET /api/users/me/ai-usage - Lấy thống kê sử dụng AI của người dùng hiện tại
   */
  async getMyAIUsage(params?: { page?: number; size?: number; keyword?: string; sort?: string }) {
    const res = await request<{ success: boolean; message: string; data: any }>(
      `/users/me/ai-usage${buildQueryString(params)}`
    );
    const actionCounts = res.data?.actionCounts ?? {};
    return {
      ...res,
      data: {
        userId: res.data?.userId,
        period: res.data?.period,
        chatRequests: Number(actionCounts.CHAT_REQUEST ?? actionCounts.CHAT ?? actionCounts.AI_CHAT ?? res.data?.chatRequests ?? res.data?.totalRequests ?? 0),
        quizGenerations: Number(actionCounts.GENERATE_QUIZ ?? actionCounts.QUIZ_GENERATION ?? res.data?.quizGenerations ?? 0),
        flashcardGenerations: Number(actionCounts.GENERATE_FLASHCARD ?? actionCounts.FLASHCARD_GENERATION ?? res.data?.flashcardGenerations ?? 0),
        estimatedTokens: Number(res.data?.totalTokens ?? res.data?.estimatedTokens ?? 0),
        totalRequests: Number(res.data?.totalRequests ?? 0),
        totalTokens: Number(res.data?.totalTokens ?? res.data?.estimatedTokens ?? 0),
        estimatedCost: res.data?.estimatedCost !== undefined ? Number(res.data.estimatedCost) : undefined,
        actionCounts,
      } as AIUsageDTO,
    };
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

  async getMyWeeklyActivity() {
    return request<{ success: boolean; data: any[] }>("/users/me/weekly-activity").catch(() => ({ success: true, data: [] }));
  },

  async getTopContributors(page = 0, size = 10) {
    return request<{ success: boolean; message: string; data: PaginatedResponse<any> }>(
      `/community/leaderboard/contributors?page=${page}&size=${size}`
    );
  },
};

// #,Phương thức & API Path,Tên hàm tương ứng trong userService,Chức năng trên giao diện
// 1,GET /api/admin/users,adminGetUsers(params),Lấy danh sách thành viên phân trang + Tìm kiếm
// 2,GET /api/admin/users/{id},adminGetUserById(id),Xem chi tiết thông tin hồ sơ của 1 người dùng
// 3,PATCH /api/admin/users/{id}/active,"adminToggleUserActive(id, isActive)",Bật/Tắt trạng thái hoạt động (Khóa/Mở khóa tài khoản)
// 4,PATCH /api/admin/users/{id}/role,"adminUpdateUserRole(id, role)","Thay đổi vai trò hệ thống (STUDENT, REVIEWER, ADMIN)"
// 5,POST /api/admin/users/{userId}/badges/{badgeId},"adminAssignBadgeToUser(uId, bId)",Admin gán huy hiệu phần thưởng vinh danh

// #,Phương thức & API Path,Tên hàm tương ứng trong userService,Chức năng trên giao diện
// 6,GET /api/users/me,getMyProfile(),Lấy hồ sơ cá nhân của tài khoản đang đăng nhập
// 7,PUT /api/users/me,updateMyProfile(data),"Cập nhật thông tin cá nhân (Đổi Họ tên, chuỗi Avatar)"
// 8,GET /api/users/me/activity-logs,getMyActivityLogs(),Lấy danh sách nhật ký lịch sử thao tác hệ thống
// 9,PATCH /api/users/me/change-password,changeMyPassword(payload),Thay đổi mật khẩu bảo mật tài khoản
// 10,GET /api/users/me/ai-usage,getMyAIUsage(),Lấy thống kê số lượt và hạn ngạch hỏi Trợ lý AI
// 11,GET /api/users/me/badges,getMyBadges(),Lấy bộ sưu tập các huy hiệu cá nhân đã đạt được
// 12,GET /api/users/me/tests,getMyTestHistory(),Lấy lịch sử điểm số các bài kiểm tra trắc nghiệm / Quiz
