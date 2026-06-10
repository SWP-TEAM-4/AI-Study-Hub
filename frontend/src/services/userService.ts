// ─────────────────────────────────────────────────────────────────────────────
// userService.ts  –  Kết nối với Backend User Profile API
// Base URL: http://localhost:8080/api/users
// Owner: BE1 – Controller: UserController.java
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:8080/api/users";

// ─── TypeScript Interfaces (mirror backend DTOs) ──────────────────────────

import type { UserRole } from "./authService";
import type { ApiResponse } from "./authService";

/**
 * Phản ánh UserProfileResponse.java của backend
 * Bao gồm đầy đủ academic info (semester, combo)
 */
export interface UserProfileResponse {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  reputationPoints: number;
  isActive: boolean;

  // Academic info
  currentSemesterId: number | null;
  currentSemesterCode: string | null;
  currentSemesterName: string | null;

  comboId: number | null;
  comboCode: string | null;
  comboName: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * Phản ánh UpdateProfileRequest.java của backend
 * fullName: 2–255 ký tự
 * avatarUrl: tối đa 500 ký tự
 */
export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string | null;
  currentSemesterId?: number | null;
  comboId?: number | null;
}

/**
 * Phản ánh ChangePasswordRequest.java của backend
 * currentPassword: required, not blank
 * newPassword: required, 6–100 ký tự
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─── Error Code → Thông báo tiếng Việt (User Profile) ────────────────────

const USER_ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: "Không tìm thấy tài khoản. Vui lòng đăng nhập lại.",
  WRONG_PASSWORD: "Mật khẩu hiện tại không chính xác!",
  SAME_PASSWORD: "Mật khẩu mới không được trùng với mật khẩu hiện tại!",
  SEMESTER_NOT_FOUND: "Học kỳ được chọn không tồn tại. Vui lòng chọn lại.",
  COMBO_NOT_FOUND: "Combo học phần không tồn tại. Vui lòng chọn lại.",
  VALIDATION_ERROR: "Dữ liệu nhập vào không hợp lệ!",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  ACCESS_DENIED: "Bạn không có quyền thực hiện thao tác này.",
};

/**
 * Helper: parse lỗi từ response backend và throw Error với message tiếng Việt.
 */
async function handleApiError(
  response: Response,
  fallback: string
): Promise<never> {
  let body: ApiResponse<unknown> | null = null;
  try {
    body = await response.json();
  } catch {
    // body không phải JSON
  }

  const errorCode = body?.errorCode;
  const serverMessage = body?.message;

  if (errorCode && USER_ERROR_MESSAGES[errorCode]) {
    throw new Error(USER_ERROR_MESSAGES[errorCode]);
  }
  if (errorCode === "VALIDATION_ERROR" && serverMessage) {
    throw new Error(`Dữ liệu không hợp lệ: ${serverMessage}`);
  }
  if (serverMessage) {
    throw new Error(serverMessage);
  }
  throw new Error(fallback);
}

/**
 * Helper: lấy Bearer token từ localStorage
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── API Functions ────────────────────────────────────────────────────────

/**
 * GET /api/users/me
 * Lấy thông tin profile của user đang đăng nhập.
 * Yêu cầu: Bearer Token trong header.
 */
export async function getMyProfile(): Promise<UserProfileResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error(
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!"
    );
  }

  if (!response.ok) {
    await handleApiError(
      response,
      "Không thể tải thông tin cá nhân. Vui lòng thử lại."
    );
  }

  const body: ApiResponse<UserProfileResponse> = await response.json();
  return body.data!;
}

/**
 * PUT /api/users/me
 * Cập nhật thông tin profile (fullName, avatarUrl, currentSemesterId, comboId).
 * Backend chỉ cập nhật field nào được gửi (null/undefined = bỏ qua).
 * Yêu cầu: Bearer Token trong header.
 */
export async function updateMyProfile(
  request: UpdateProfileRequest
): Promise<UserProfileResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/me`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!"
    );
  }

  if (!response.ok) {
    await handleApiError(
      response,
      "Cập nhật thông tin thất bại. Vui lòng thử lại."
    );
  }

  const body: ApiResponse<UserProfileResponse> = await response.json();
  return body.data!;
}

/**
 * PATCH /api/users/me/change-password
 * Đổi mật khẩu. Backend kiểm tra:
 *   1. currentPassword phải đúng
 *   2. newPassword phải khác currentPassword
 *   3. newPassword phải đủ 6–100 ký tự
 * Yêu cầu: Bearer Token trong header.
 * Trả về: void (ApiResponse<Void>)
 */
export async function changePassword(
  request: ChangePasswordRequest
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/me/change-password`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!"
    );
  }

  if (!response.ok) {
    await handleApiError(
      response,
      "Đổi mật khẩu thất bại. Vui lòng thử lại."
    );
  }
  // Không parse body – backend trả ApiResponse<Void>
}
