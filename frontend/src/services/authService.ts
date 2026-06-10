// ─────────────────────────────────────────────────────────────────────────────
// authService.ts  –  Kết nối trực tiếp với Backend Spring Boot
// Base URL: http://localhost:8080/api/auth
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:8080/api/auth";

// ─── TypeScript Interfaces (mirror backend DTOs) ──────────────────────────

/** Role enum – phản ánh đúng enum Role.java của backend */
export type UserRole = "STUDENT" | "REVIEWER" | "ADMIN";

/**
 * Thông tin user trả về sau khi login/register thành công.
 * Phản ánh đúng AuthResponse.java của backend.
 */
export interface AuthUser {
  userId: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  reputationPoints: number;
  createdAt: string;
}

/**
 * Shape của trường `data` trong AuthResponse từ backend (login & register).
 */
export interface AuthResponseData extends AuthUser {
  accessToken: string;
  tokenType: string;
}

/**
 * Wrapper chung cho mọi response từ backend.
 * Success:  { success: true,  message: "...", data: T }
 * Error:    { success: false, message: "...", errorCode: "..." }
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

// ─── Error Code → Thông báo tiếng Việt ───────────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng! Vui lòng dùng email khác.",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không chính xác!",
  USER_INACTIVE:
    "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.",
  INVALID_RESET_TOKEN:
    "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ!",
  ACCESS_DENIED: "Bạn không có quyền thực hiện thao tác này.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
};

/**
 * Helper: parse lỗi từ response backend và throw Error với message tiếng Việt.
 * Ưu tiên thứ tự: errorCode → message từ server → fallback message.
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

  // 1. Ưu tiên message từ errorCode đã map
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    throw new Error(ERROR_MESSAGES[errorCode]);
  }
  // 2. Nếu là VALIDATION_ERROR, đính kèm chi tiết từ server
  if (errorCode === "VALIDATION_ERROR" && serverMessage) {
    throw new Error(`Dữ liệu không hợp lệ: ${serverMessage}`);
  }
  // 3. Dùng message từ server nếu có
  if (serverMessage) {
    throw new Error(serverMessage);
  }
  // 4. Fallback message
  throw new Error(fallback);
}

// ─── API Functions ────────────────────────────────────────────────────────

/**
 * Đăng nhập – POST /api/auth/login
 * @returns AuthResponseData chứa accessToken và thông tin user
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResponseData> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!"
    );
  }

  if (!response.ok) {
    await handleApiError(response, "Đăng nhập thất bại. Vui lòng thử lại.");
  }

  const body: ApiResponse<AuthResponseData> = await response.json();
  return body.data!;
}

/**
 * Đăng ký tài khoản mới – POST /api/auth/register
 * @returns AuthResponseData chứa accessToken và thông tin user vừa tạo
 */
export async function register(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResponseData> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName }),
    });
  } catch {
    throw new Error(
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!"
    );
  }

  if (!response.ok) {
    await handleApiError(
      response,
      "Đăng ký thất bại. Vui lòng thử lại sau."
    );
  }

  const body: ApiResponse<AuthResponseData> = await response.json();
  return body.data!;
}

/**
 * Yêu cầu reset mật khẩu – POST /api/auth/forgot-password
 * Backend luôn trả 200 (không tiết lộ email có tồn tại hay không).
 */
export async function forgotPassword(email: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new Error(
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!"
    );
  }

  if (!response.ok) {
    await handleApiError(
      response,
      "Gửi yêu cầu thất bại. Vui lòng thử lại sau."
    );
  }
  // Không cần parse body – backend trả ApiResponse<Void>
}

/**
 * Đặt lại mật khẩu bằng token từ email – POST /api/auth/reset-password
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
  } catch {
    throw new Error(
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!"
    );
  }

  if (!response.ok) {
    await handleApiError(
      response,
      "Đặt lại mật khẩu thất bại. Vui lòng thử lại."
    );
  }
}