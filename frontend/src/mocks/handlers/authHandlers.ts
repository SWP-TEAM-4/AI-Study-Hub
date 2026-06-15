// ─────────────────────────────────────────────────────────────────────────────
// authHandlers.ts – Mock handlers cho Auth API
// Endpoints: POST /api/auth/login, register, forgot-password, reset-password
// ─────────────────────────────────────────────────────────────────────────────

import { http, HttpResponse, delay } from "msw";
import {
  mockUsers,
  findUserByEmail,
  generateMockToken,
} from "../data/mockUsers";
import type { MockUser } from "../data/mockUsers";

// ─── Helper: Build AuthResponseData shape ─────────────────────────────────────

function buildAuthResponse(user: MockUser) {
  return {
    success: true,
    message: "Thành công",
    data: {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      reputationPoints: user.reputationPoints,
      createdAt: user.createdAt,
      accessToken: generateMockToken(user.userId),
      tokenType: "Bearer",
    },
  };
}

// ─── Auth Handlers ────────────────────────────────────────────────────────────

export const authHandlers = [
  // ── POST /api/auth/login ────────────────────────────────────────────────────
  http.post("http://localhost:8080/api/auth/login", async ({ request }) => {
    await delay(400); // Simulate network latency

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return HttpResponse.json(
        {
          success: false,
          message: "Email và mật khẩu là bắt buộc",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Find user
    const user = findUserByEmail(email);

    if (!user || user.password !== password) {
      return HttpResponse.json(
        {
          success: false,
          message: "Email hoặc mật khẩu không chính xác!",
          errorCode: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    // Check active
    if (!user.isActive) {
      return HttpResponse.json(
        {
          success: false,
          message: "Tài khoản đã bị khóa",
          errorCode: "USER_INACTIVE",
        },
        { status: 403 }
      );
    }

    return HttpResponse.json(buildAuthResponse(user), { status: 200 });
  }),

  // ── POST /api/auth/register ─────────────────────────────────────────────────
  http.post("http://localhost:8080/api/auth/register", async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as {
      email?: string;
      password?: string;
      fullName?: string;
    };

    const { email, password, fullName } = body;

    // Validation
    if (!email || !password || !fullName) {
      return HttpResponse.json(
        {
          success: false,
          message: "Tất cả các trường đều bắt buộc",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return HttpResponse.json(
        {
          success: false,
          message: "Mật khẩu phải từ 6 ký tự trở lên",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Check duplicate email
    if (findUserByEmail(email)) {
      return HttpResponse.json(
        {
          success: false,
          message: "Email này đã được sử dụng!",
          errorCode: "EMAIL_ALREADY_EXISTS",
        },
        { status: 409 }
      );
    }

    // Create new user
    const newUser: MockUser = {
      userId: mockUsers.length + 10, // offset to avoid conflicts
      email: email.toLowerCase(),
      password,
      fullName,
      avatarUrl: null,
      role: "STUDENT",
      reputationPoints: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentSemesterId: null,
      currentSemesterCode: null,
      currentSemesterName: null,
      comboId: null,
      comboCode: null,
      comboName: null,
    };

    mockUsers.push(newUser);

    return HttpResponse.json(buildAuthResponse(newUser), { status: 201 });
  }),

  // ── POST /api/auth/forgot-password ──────────────────────────────────────────
  http.post(
    "http://localhost:8080/api/auth/forgot-password",
    async () => {
      await delay(600);

      // Backend luôn trả 200 – không tiết lộ email có tồn tại không
      return HttpResponse.json(
        {
          success: true,
          message:
            "Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu đã được gửi.",
        },
        { status: 200 }
      );
    }
  ),

  // ── POST /api/auth/reset-password ───────────────────────────────────────────
  http.post(
    "http://localhost:8080/api/auth/reset-password",
    async ({ request }) => {
      await delay(500);

      const body = (await request.json()) as {
        token?: string;
        newPassword?: string;
      };

      if (!body.token || !body.newPassword) {
        return HttpResponse.json(
          {
            success: false,
            message: "Token và mật khẩu mới là bắt buộc",
            errorCode: "VALIDATION_ERROR",
          },
          { status: 400 }
        );
      }

      // Mock: accept any token that starts with "valid"
      if (body.token.startsWith("invalid")) {
        return HttpResponse.json(
          {
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
            errorCode: "INVALID_RESET_TOKEN",
          },
          { status: 400 }
        );
      }

      return HttpResponse.json(
        {
          success: true,
          message: "Đặt lại mật khẩu thành công!",
        },
        { status: 200 }
      );
    }
  ),
];
