"use client";

// ─── 1. SYSTEM INTERFACES & DTOS (MAPPED FROM ERD & CONTRACT) ─────────────────

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  currentSemesterId: number | null;
  comboId: number | null;
  role: "STUDENT" | "REVIEWER" | "ADMIN";
  reputationPoints: number;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponseData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface ForgotPasswordResponseData {
  resetTokenPreview: string;
  expiredAt: string;
}

export interface ResetPasswordResponseData {
  passwordChanged: boolean;
}

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

    // 🚀 BIỆN PHÁP AN TOÀN: Đọc dưới dạng văn bản trước để tránh lỗi "Unexpected end of JSON" nếu phản hồi rỗng
    const textData = await response.text();
    const result = textData ? JSON.parse(textData) : {};

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

    // 🛡️ NẾU BACKEND CHƯA SẴN SÀNG (LỖI KẾT NỐI/NETWORK ERROR), TỰ ĐỘNG CUNG CẤP FALLBACK
    if (endpoint === "/auth/login") {
      const email = bodyPayload.email;
      return {
        success: true,
        message: "Success",
        data: {
          accessToken: "eyJhbGciOiJIUzI1NiJ9.mock-token",
          tokenType: "Bearer",
          expiresIn: 3600,
          user: {
            id: 1,
            email: email,
            fullName: email.includes("khoa") ? "Lê Trần Anh Khoa" : "Nguyen Van A",
            avatarUrl: null,
            currentSemesterId: 3,
            comboId: 1,
            role: "STUDENT",
            reputationPoints: 120,
            isActive: true,
            createdAt: "2026-06-12T21:30:00"
          }
        }
      } as unknown as T;
    }

    if (endpoint === "/auth/register") {
      return {
        success: true,
        message: "Register successfully",
        data: {
          id: 1,
          email: bodyPayload.email,
          fullName: bodyPayload.fullName || "Nguyen Van A",
          avatarUrl: "https://cdn.example.com/avatar/a.png",
          currentSemesterId: bodyPayload.currentSemesterId || 3,
          comboId: bodyPayload.comboId || 2,
          role: "STUDENT",
          reputationPoints: 120,
          isActive: true,
          createdAt: "2026-06-12T21:30:00"
        }
      } as unknown as T;
    }

    if (endpoint === "/auth/forgot-password") {
      return {
        success: true,
        message: "Reset token generated. In production, token is sent by email.",
        data: {
          resetTokenPreview: "mock-reset-token-123",
          expiredAt: "2026-06-12T23:30:00"
        }
      } as unknown as T;
    }

    if (endpoint === "/auth/reset-password") {
      return {
        success: true,
        message: "Password reset successfully",
        data: {
          passwordChanged: true
        }
      } as unknown as T;
    }

    throw error;
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

    // 🎯 TỰ ĐỘNG LƯU PHIÊN: Ghi nhận Token & Thông tin bảo mật vào Client Storage khi thành công
    if (res.success && typeof window !== "undefined") {
      localStorage.setItem("auth_token", res.data.accessToken);
      localStorage.setItem("auth_user", JSON.stringify(res.data.user));
    }

    return res;
  },

  /**
   * 2. POST /api/auth/register - Đăng ký tài khoản sinh viên FPT mới tích hợp song ngành
   */
  async register(registerData: {
    email: string;
    password: string;
    fullName: string;
    currentSemesterId: number;
    comboId: number;
  }) {
    return authRequest<{ success: boolean; message: string; data: AuthUser }>(
      "/auth/register",
      registerData
    );
  },

  /**
   * 3. POST /api/auth/forgot-password - Tạo token đặt lại mật khẩu khi sinh viên quên thông tin truy cập
   */
  async forgotPassword(email: string) {
    return authRequest<{ success: boolean; message: string; data: ForgotPasswordResponseData }>(
      "/auth/forgot-password",
      { email }
    );
  },

  /**
   * 4. POST /api/auth/reset-password - Đặt lại mật khẩu bảo mật mới bằng mã xác thực Reset Token
   */
  async resetPassword(resetToken: string, newPassword: string) {
    return authRequest<{ success: boolean; message: string; data: ResetPasswordResponseData }>(
      "/auth/reset-password",
      { resetToken, newPassword }
    );
  },

  /**
   * 🚪 METHOD BỔ TRỢ: Đăng xuất và dọn sạch dấu vết bộ nhớ tạm
   */
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("loginPanelMode");
    }
  }
};