import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeLocalStorage } from "../utils/safeStorage";

/**
 * Thông tin user được lưu trong store.
 * Map theo cấu trúc PHẲNG của backend (AuthResponse.java).
 */
export interface StoredUser {
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

interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  user: StoredUser | null;

  // Actions
  login: (token: string, user: StoredUser) => void;
  logout: () => void;

  // Getters (tính toán từ state)
  getUserRole: () => "STUDENT" | "REVIEWER" | "ADMIN" | null;
  getUserEmail: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    
    (set, get) => ({
      isLoggedIn: false,
      token: null,
      user: null,

      login: (token: string, user: StoredUser) =>
        set({ isLoggedIn: true, token, user }),

      logout: () => {
        // Xóa cả localStorage thủ công để đồng bộ (an toàn với Private Mode / quota đầy)
        safeLocalStorage.removeItem("auth_token");
        safeLocalStorage.removeItem("auth_user");
        safeLocalStorage.removeItem("loginPanelMode");
        set({ isLoggedIn: false, token: null, user: null });
      },

      getUserRole: () => get().user?.role ?? null,
      getUserEmail: () => get().user?.email ?? null,
    }),
    {
      name: "auth-storage", // key trong localStorage
      // zustand's createJSONStorage cần raw storage; wrap với safeLocalStorage để bắt SecurityError
      storage: createJSONStorage(() => ({
        getItem: (key) => safeLocalStorage.getItem(key),
        setItem: (key, value) => safeLocalStorage.setItem(key, value),
        removeItem: (key) => safeLocalStorage.removeItem(key),
      })),
    }
  )
);
