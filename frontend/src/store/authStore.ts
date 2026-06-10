import { create } from "zustand";
import type { AuthUser, AuthResponseData } from "../services/authService";

// ─── Constants ────────────────────────────────────────────────────────────
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// ─── Types ────────────────────────────────────────────────────────────────
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoggedIn: boolean;

  /** Gọi sau khi login/register thành công – lưu token + user vào store & localStorage */
  setAuth: (data: AuthResponseData) => void;

  /** Cập nhật thông tin user trong store & localStorage (sau khi PUT /api/users/me thành công) */
  updateUser: (partial: Partial<AuthUser>) => void;

  /** Đăng xuất – xóa toàn bộ auth state */
  logout: () => void;
}

// ─── Helper: Load persisted state từ localStorage ────────────────────────
function loadPersistedAuth(): { user: AuthUser | null; accessToken: string | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (token && userRaw) {
      const user = JSON.parse(userRaw) as AuthUser;
      return { user, accessToken: token };
    }
  } catch {
    // localStorage bị corrupt → clear
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  return { user: null, accessToken: null };
}

// ─── Store ────────────────────────────────────────────────────────────────
const persisted = loadPersistedAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  // Khởi tạo từ localStorage (persist qua F5)
  user: persisted.user,
  accessToken: persisted.accessToken,
  isLoggedIn: !!(persisted.user && persisted.accessToken),

  setAuth: (data: AuthResponseData) => {
    const user: AuthUser = {
      userId: data.userId,
      email: data.email,
      fullName: data.fullName,
      avatarUrl: data.avatarUrl,
      role: data.role,
      reputationPoints: data.reputationPoints,
      createdAt: data.createdAt,
    };

    // Persist vào localStorage
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    set({
      user,
      accessToken: data.accessToken,
      isLoggedIn: true,
    });
  },

  updateUser: (partial: Partial<AuthUser>) => {
    const current = get().user;
    if (!current) return;

    const updated: AuthUser = { ...current, ...partial };

    // Đồng bộ lên localStorage để persist qua F5
    localStorage.setItem(USER_KEY, JSON.stringify(updated));

    set({ user: updated });
  },

  logout: () => {
    // Xóa khỏi localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    set({
      user: null,
      accessToken: null,
      isLoggedIn: false,
    });
  },
}));
