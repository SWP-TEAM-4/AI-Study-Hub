// ─────────────────────────────────────────────────────────────────────────────
// userHandlers.ts – Mock handlers cho User Profile API
// Endpoints: GET/PUT /api/users/me, PATCH /api/users/me/change-password
// ─────────────────────────────────────────────────────────────────────────────

import { http, HttpResponse, delay } from "msw";
import { mockUsers } from "../data/mockUsers";
import type { MockUser } from "../data/mockUsers";

// ─── Helper: Extract userId from mock JWT ─────────────────────────────────────

function extractUserId(request: Request): number | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  try {
    const token = auth.slice(7);
    const payloadPart = token.split(".")[1];
    const payload = JSON.parse(atob(payloadPart));
    return payload.sub ?? null;
  } catch {
    // Nếu token không phải mock format, trả về user 1 (student) mặc định
    // để vẫn hoạt động khi dùng token từ localStorage cũ
    return 1;
  }
}

function findCurrentUser(request: Request): MockUser | null {
  const userId = extractUserId(request);
  if (userId === null) return null;
  return mockUsers.find((u) => u.userId === userId) ?? null;
}

function unauthorizedResponse() {
  return HttpResponse.json(
    {
      success: false,
      message: "Phiên đăng nhập đã hết hạn",
      errorCode: "UNAUTHORIZED",
    },
    { status: 401 }
  );
}

// ─── Helper: Build UserProfileResponse shape ──────────────────────────────────

function buildProfileResponse(user: MockUser) {
  return {
    id: user.userId,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    reputationPoints: user.reputationPoints,
    isActive: user.isActive,
    currentSemesterId: user.currentSemesterId,
    currentSemesterCode: user.currentSemesterCode,
    currentSemesterName: user.currentSemesterName,
    comboId: user.comboId,
    comboCode: user.comboCode,
    comboName: user.comboName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ─── User Handlers ────────────────────────────────────────────────────────────

export const userHandlers = [
  // ── GET /api/users/me – Get current user profile ────────────────────────────
  http.get("http://localhost:8080/api/users/me", async ({ request }) => {
    await delay(300);

    const user = findCurrentUser(request);
    if (!user) return unauthorizedResponse();

    return HttpResponse.json(
      {
        success: true,
        message: "Thành công",
        data: buildProfileResponse(user),
      },
      { status: 200 }
    );
  }),

  // ── PUT /api/users/me – Update profile ──────────────────────────────────────
  http.put("http://localhost:8080/api/users/me", async ({ request }) => {
    await delay(400);

    const user = findCurrentUser(request);
    if (!user) return unauthorizedResponse();

    const body = (await request.json()) as {
      fullName?: string;
      avatarUrl?: string | null;
      currentSemesterId?: number | null;
      comboId?: number | null;
    };

    // Validate fullName
    if (body.fullName !== undefined) {
      const name = body.fullName.trim();
      if (name.length < 2 || name.length > 255) {
        return HttpResponse.json(
          {
            success: false,
            message: "Họ và tên phải từ 2 đến 255 ký tự",
            errorCode: "VALIDATION_ERROR",
          },
          { status: 400 }
        );
      }
      user.fullName = name;
    }

    // Update avatarUrl
    if (body.avatarUrl !== undefined) {
      user.avatarUrl = body.avatarUrl;
    }

    // Update academic info
    if (body.currentSemesterId !== undefined) {
      if (body.currentSemesterId === null) {
        user.currentSemesterId = null;
        user.currentSemesterCode = null;
        user.currentSemesterName = null;
      } else {
        // Mock: just set the ID, simulate lookup
        user.currentSemesterId = body.currentSemesterId;
        user.currentSemesterCode = "SU26";
        user.currentSemesterName = "Summer 2026";
      }
    }

    if (body.comboId !== undefined) {
      if (body.comboId === null) {
        user.comboId = null;
        user.comboCode = null;
        user.comboName = null;
      } else {
        user.comboId = body.comboId;
        user.comboCode = "SE_COMBO_1";
        user.comboName = "Software Engineering - Combo 1";
      }
    }

    user.updatedAt = new Date().toISOString();

    return HttpResponse.json(
      {
        success: true,
        message: "Cập nhật thông tin thành công",
        data: buildProfileResponse(user),
      },
      { status: 200 }
    );
  }),

  // ── PATCH /api/users/me/change-password – Change password ───────────────────
  http.patch(
    "http://localhost:8080/api/users/me/change-password",
    async ({ request }) => {
      await delay(500);

      const user = findCurrentUser(request);
      if (!user) return unauthorizedResponse();

      const body = (await request.json()) as {
        currentPassword?: string;
        newPassword?: string;
      };

      // Validate required fields
      if (!body.currentPassword || !body.newPassword) {
        return HttpResponse.json(
          {
            success: false,
            message: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc",
            errorCode: "VALIDATION_ERROR",
          },
          { status: 400 }
        );
      }

      // Validate new password length
      if (body.newPassword.length < 6 || body.newPassword.length > 100) {
        return HttpResponse.json(
          {
            success: false,
            message: "Mật khẩu mới phải từ 6 đến 100 ký tự",
            errorCode: "VALIDATION_ERROR",
          },
          { status: 400 }
        );
      }

      // Check current password
      if (body.currentPassword !== user.password) {
        return HttpResponse.json(
          {
            success: false,
            message: "Mật khẩu hiện tại không chính xác!",
            errorCode: "WRONG_PASSWORD",
          },
          { status: 400 }
        );
      }

      // Check same password
      if (body.currentPassword === body.newPassword) {
        return HttpResponse.json(
          {
            success: false,
            message: "Mật khẩu mới không được trùng với mật khẩu hiện tại!",
            errorCode: "SAME_PASSWORD",
          },
          { status: 400 }
        );
      }

      // Update password
      user.password = body.newPassword;
      user.updatedAt = new Date().toISOString();

      return HttpResponse.json(
        {
          success: true,
          message: "Đổi mật khẩu thành công!",
        },
        { status: 200 }
      );
    }
  ),
];
