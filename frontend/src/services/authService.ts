"use client";

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

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
export interface ForgotPasswordResponseData {
  resetTokenPreview?: string;
  expiredAt?: string;
}

export interface ResetPasswordResponseData {
  passwordChanged: boolean;
}
<<<<<<< HEAD
=======
=======
// Backend trả về ApiResponse<Void> — không có data field.
// Frontend chỉ cần biết thành công/thất bại qua `success`.
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929

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

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
    throw {
      status: 0,
      message: "Không kết nối được backend xác thực. Vui lòng kiểm tra server API.",
      errorCode: "NETWORK_ERROR",
    };
<<<<<<< HEAD
=======
=======
    // 🛡️ NẾU BACKEND CHƯA SẴN SÀNG (LỖI KẾT NỐI/NETWORK ERROR), TỰ ĐỘNG CUNG CẤP FALLBACK
    if (endpoint === "/auth/login") {
      const email = bodyPayload.email;
      // Mock data khớp cấu trúc PHẲNG của backend (AuthResponse.java)
      return {
        success: true,
        message: "Login successful",
        data: {
          accessToken: "eyJhbGciOiJIUzI1NiJ9.mock-token",
          tokenType: "Bearer",
          userId: 1,
          email: email,
          fullName: email.includes("khoa") ? "Lê Trần Anh Khoa" : "Nguyen Van A",
          avatarUrl: null,
          role: email.includes("admin") ? "ADMIN" : (email.includes("reviewer") ? "REVIEWER" : "STUDENT"),
          reputationPoints: 120,
          createdAt: "2026-06-12T21:30:00"
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
        message: "Reset token has been sent to your email. (Mock)"
      } as unknown as T;
    }

    if (endpoint === "/auth/reset-password") {
      return {
        success: true,
        message: "Password reset successfully"
      } as unknown as T;
    }

    throw error;
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
  }
}

function persistAuthSession(data: LoginResponseData) {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", data.accessToken);
  const { accessToken, tokenType, ...userInfo } = data;
  localStorage.setItem("auth_user", JSON.stringify(userInfo));
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
   * 2. POST /api/auth/register - Đăng ký tài khoản sinh viên FPT mới tích hợp song ngành
   */
  async register(registerData: {
    email: string;
    password: string;
    fullName: string;
<<<<<<< HEAD
    currentSemesterId?: number | null;
    comboId?: number | null;
=======
<<<<<<< HEAD
    currentSemesterId?: number | null;
    comboId?: number | null;
=======
    currentSemesterId?: number;
    comboId?: number;
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
  }) {
    const res = await authRequest<{ success: boolean; message: string; data: LoginResponseData }>(
      "/auth/register",
      registerData
    );

    if (res.success) {
      persistAuthSession(res.data);
    }

    return res;
  },

  /**
   * 3. POST /api/auth/forgot-password - Tạo token đặt lại mật khẩu khi sinh viên quên thông tin truy cập
   */
  async forgotPassword(email: string) {
<<<<<<< HEAD
    return authRequest<{ success: boolean; message: string; data?: ForgotPasswordResponseData | EmptyApiResponseData }>(
=======
<<<<<<< HEAD
    return authRequest<{ success: boolean; message: string; data?: ForgotPasswordResponseData | EmptyApiResponseData }>(
=======
    return authRequest<{ success: boolean; message: string; data?: undefined }>(
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
      "/auth/forgot-password",
      { email }
    );
  },

  /**
   * 4. POST /api/auth/reset-password - Đặt lại mật khẩu bảo mật mới bằng mã xác thực Reset Token
   * Backend gửi token qua email, client gửi lại { token, newPassword }
   */
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
  async resetPassword(resetToken: string, newPassword: string) {
    return authRequest<{ success: boolean; message: string; data?: ResetPasswordResponseData | EmptyApiResponseData }>(
      "/auth/reset-password",
      { token: resetToken, newPassword }
<<<<<<< HEAD
=======
=======
  async resetPassword(token: string, newPassword: string) {
    return authRequest<{ success: boolean; message: string; data?: undefined }>(
      "/auth/reset-password",
      { token, newPassword }
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
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
