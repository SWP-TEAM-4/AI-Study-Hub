import axios from "axios";

// ─── Axios Instance ────────────────────────────────────────────────────────
// baseURL rỗng → dùng Vite proxy (vite.config.ts) để forward /api → localhost:8080
const api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Attach JWT token vào mọi request nếu đã đăng nhập
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Types ────────────────────────────────────────────────────────────────

export interface AuthUser {
  userId: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  reputationPoints: number;
  createdAt: string;
}

export interface AuthResponseData {
  accessToken: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  reputationPoints: number;
  createdAt: string;
}

/** Chuẩn response wrapper từ backend: { success, message, data?, errorCode? } */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

// ─── Error Mapping (errorCode → thông báo tiếng Việt) ─────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng. Vui lòng dùng email khác.",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng. Vui lòng thử lại.",
  USER_INACTIVE: "Tài khoản của bạn đã bị vô hiệu hóa. Liên hệ hỗ trợ.",
  INVALID_RESET_TOKEN: "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
  SEMESTER_NOT_FOUND: "Học kỳ không tồn tại.",
  COMBO_NOT_FOUND: "Gói combo không tồn tại.",
  VALIDATION_ERROR: "Thông tin không hợp lệ. Vui lòng kiểm tra lại.",
  UNAUTHORIZED: "Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.",
  ACCESS_DENIED: "Bạn không có quyền thực hiện thao tác này.",
  INTERNAL_ERROR: "Lỗi hệ thống. Vui lòng thử lại sau.",
};

/**
 * Trích xuất message lỗi thân thiện từ axios error.
 * Ưu tiên: errorCode mapping → message từ server → fallback
 */
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    if (data) {
      // Map errorCode sang tiếng Việt
      if (data.errorCode && ERROR_MESSAGES[data.errorCode]) {
        return ERROR_MESSAGES[data.errorCode];
      }
      // Dùng message server trả về nếu có
      if (data.message) return data.message;
    }
    // Network error
    if (!error.response) {
      return "Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.";
    }
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại!";
}

// ─── Auth API Methods ─────────────────────────────────────────────────────

/**
 * Đăng nhập – trả về AuthResponseData (chứa accessToken và thông tin user)
 */
export async function login(email: string, password: string): Promise<AuthResponseData> {
  try {
    const res = await api.post<ApiResponse<AuthResponseData>>("/api/auth/login", {
      email,
      password,
    });
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Đăng nhập thất bại.");
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Đăng ký tài khoản mới
 */
export async function register(
  email: string,
  password: string,
  fullName: string,
  currentSemesterId?: number,
  comboId?: number
): Promise<AuthResponseData> {
  try {
    const res = await api.post<ApiResponse<AuthResponseData>>("/api/auth/register", {
      email,
      password,
      fullName,
      ...(currentSemesterId && { currentSemesterId }),
      ...(comboId && { comboId }),
    });
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Đăng ký thất bại.");
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Quên mật khẩu – server sẽ gửi email (mock trong dev: log ra console backend)
 */
export async function forgotPassword(email: string): Promise<void> {
  try {
    const res = await api.post<ApiResponse<void>>("/api/auth/forgot-password", { email });
    if (!res.data.success) {
      throw new Error(res.data.message || "Gửi yêu cầu thất bại.");
    }
    // success: server luôn trả 200 dù email có tồn tại hay không (security best practice)
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Đặt lại mật khẩu bằng token nhận từ email
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  try {
    const res = await api.post<ApiResponse<void>>("/api/auth/reset-password", {
      token,
      newPassword,
    });
    if (!res.data.success) {
      throw new Error(res.data.message || "Đặt lại mật khẩu thất bại.");
    }
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export default api;
