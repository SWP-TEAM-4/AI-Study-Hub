"use client";

import { safeLocalStorage } from "../utils/safeStorage";
import { safeParseJson } from "../utils/safeParseJson";

// ─── 1. SYSTEM INTERFACES & DTOS (MAPPED FROM ERD & CONTRACT) ─────────────────

/**
 * Thông tin user được trả về trực tiếp trong data (FLAT, không nested).
 * Map theo AuthResponse.java của backend.
 */
export interface AuthUser {
  userId: number;         // Backend: Long userId
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: "STUDENT" | "REVIEWER" | "ADMIN";
  reputationPoints: number;
  currentSemesterId?: number | null;
  currentSemesterCode?: string | null;
  currentSemesterName?: string | null;
  comboId?: number | null;
  comboCode?: string | null;
  comboName?: string | null;
  createdAt: string;
  // Các field legacy (fallback khi parse từ localStorage cũ)
  id?: number;
}

/**
 * Cấu trúc `data` bên trong ApiResponse khi login/register thành công.
 * Backend: AuthResponse.java – PHẲNG (không có nested "user" object).
 */
export interface LoginResponseData {
  accessToken: string;
  tokenType: string;      // Luôn là "Bearer"
  userId: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: "STUDENT" | "REVIEWER" | "ADMIN";
  reputationPoints: number;
  currentSemesterId?: number | null;
  currentSemesterCode?: string | null;
  currentSemesterName?: string | null;
  comboId?: number | null;
  comboCode?: string | null;
  comboName?: string | null;
  createdAt: string;
}

export interface RegistrationResponseData {
  email: string;
  verificationRequired: boolean;
  expireMinutes: number;
}

export interface ForgotPasswordResponseData {
  resetTokenPreview?: string;
  expiredAt?: string;
}

export interface ResetPasswordResponseData {
  passwordChanged: boolean;
}

export type OAuthProvider = "google" | "github";

export interface OAuthAuthorizeResponseData {
  authorizationUrl: string;
  state: string;
  provider: OAuthProvider;
  redirectUri: string;
}

export type EmptyApiResponseData = null | undefined;

// ─── 2. CORE BASE CONFIGURATION ────────────────────────────────────────────────

// Cấu hình cổng kết nối: Sử dụng relative path để chạy qua proxy/Vercel rewrite 
// Hoặc ông có thể đổi thành "http://localhost:8080/api" nếu muốn chỉ định đích danh cổng BE Local.
const BASE_URL = "/api";

export async function authRequest<T>(endpoint: string, bodyPayload: any): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    // 🚀 BIỆN PHÁP AN TOÀN: Đọc dưới dạng văn bản trước, dùng safeParseJson để tránh "Unexpected end of JSON" nếu phản hồi rỗng / proxy trả HTML khi server down
    const textData = await response.text();
    const result = safeParseJson<any>(textData, {});

    if (!response.ok) {
      throw {
        status: response.status,
        message: result.message || "Xác thực tài khoản thất bại",
        errorCode: result.errorCode || "AUTH_ERROR"
      };
    }

    return result;
  } catch (error: any) {
    // Nếu server có phản hồi lỗi (ví dụ: 400, 401, 403, 500) thì không chạy mock fallback, ném lỗi thật ra ngoài
    if (error && typeof error.status === "number") {
      throw error;
    }

    throw {
      status: 0,
      message: "Không kết nối được backend xác thực. Vui lòng kiểm tra server API.",
      errorCode: "NETWORK_ERROR",
    };
  }
}

async function authGet<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const textData = await response.text();
    const result = safeParseJson<any>(textData, {});

    if (!response.ok) {
      throw {
        status: response.status,
        message: result.message || "Không thể khởi tạo đăng nhập OAuth",
        errorCode: result.errorCode || "OAUTH_ERROR"
      };
    }

    return result;
  } catch (error: any) {
    if (error && typeof error.status === "number") {
      throw error;
    }

    throw {
      status: 0,
      message: "Không kết nối được backend xác thực. Vui lòng kiểm tra server API.",
      errorCode: "NETWORK_ERROR",
    };
  }
}

function persistAuthSession(data: LoginResponseData) {
  if (typeof window === "undefined") return;
  // Guard: Private Mode / quota đầy có thể throw — không để crash login.
  const tokenOk = safeLocalStorage.setItem("auth_token", data.accessToken);
  const { accessToken, tokenType, ...userInfo } = data;
  const userOk = safeLocalStorage.setItem("auth_user", JSON.stringify(userInfo));
  if (!tokenOk || !userOk) {
    // Không throw — chỉ log. Backend request vẫn chạy được trong session hiện tại.
    console.warn("Không thể lưu auth_token/auth_user vào localStorage (Private Mode hoặc quota đầy).");
  }
}

// ─── 3. INTERACTION AUTHENTICATION METHODS ─────────────────────────────────────

export const authService = {

  /**
   * 1. POST /api/auth/login - Đăng nhập hệ thống và nhận Bearer JWT Token
   */
  async login(email: string, password: string) {
    const res = await authRequest<{ success: boolean; message: string; data: LoginResponseData }>(
      "/auth/login",
      { email, password }
    );

    // 🎯 TỰ ĐỘNG LƯU PHIÊN: Ghi nhận Token & Thông tin bảo mật vào Client Storage khi thành công.
    // Backend trả data PHẲNG (flat), không có nested user object.
    if (res.success) {
      persistAuthSession(res.data);
    }

    return res;
  },

  /**
   * 2. POST /api/auth/register - Đăng ký tài khoản và gửi mã xác thực email
   */
  async register(registerData: {
    email: string;
    password: string;
    fullName: string;
    currentSemesterId?: number | null;
    comboId?: number | null;
  }) {
    return authRequest<{ success: boolean; message: string; data: RegistrationResponseData }>(
      "/auth/register",
      registerData
    );
  },

  /**
   * 3. POST /api/auth/verify-registration - Kích hoạt tài khoản bằng mã email và nhận JWT
   */
  async verifyRegistration(email: string, code: string) {
    const res = await authRequest<{ success: boolean; message: string; data: LoginResponseData }>(
      "/auth/verify-registration",
      { email, code }
    );

    if (res.success) {
      persistAuthSession(res.data);
    }

    return res;
  },

  async resendRegistrationVerification(email: string) {
    return authRequest<{ success: boolean; message: string; data: RegistrationResponseData }>(
      "/auth/resend-verification-code",
      { email }
    );
  },

  /**
   * 4. POST /api/auth/forgot-password - Tạo token đặt lại mật khẩu khi sinh viên quên thông tin truy cập
   */
  async forgotPassword(email: string) {
    return authRequest<{ success: boolean; message: string; data?: ForgotPasswordResponseData | EmptyApiResponseData }>(
      "/auth/forgot-password",
      { email }
    );
  },

  /**
   * 5. POST /api/auth/reset-password - Đặt lại mật khẩu bảo mật mới bằng mã xác thực Reset Token
   * Backend gửi token qua email, client gửi lại { token, newPassword }
   */
  async resetPassword(resetToken: string, newPassword: string) {
    return authRequest<{ success: boolean; message: string; data?: ResetPasswordResponseData | EmptyApiResponseData }>(
      "/auth/reset-password",
      { token: resetToken, newPassword }
    );
  },

  async getOAuthAuthorizeUrl(provider: OAuthProvider, redirectUri: string) {
    const query = new URLSearchParams({ redirectUri }).toString();
    return authGet<{ success: boolean; message: string; data: OAuthAuthorizeResponseData }>(
      `/auth/oauth/${provider}/authorize-url?${query}`
    );
  },

  async loginWithOAuth(provider: OAuthProvider, code: string, redirectUri: string) {
    const res = await authRequest<{ success: boolean; message: string; data: LoginResponseData }>(
      `/auth/oauth/${provider}`,
      { code, redirectUri }
    );

    if (res.success) {
      persistAuthSession(res.data);
    }

    return res;
  },

  /**
   * 🚪 METHOD BỔ TRỢ: Đăng xuất và dọn sạch dấu vết bộ nhớ tạm
   */
  logout() {
    safeLocalStorage.removeItem("auth_token");
    safeLocalStorage.removeItem("auth_user");
    safeLocalStorage.removeItem("loginPanelMode");
  }
};
