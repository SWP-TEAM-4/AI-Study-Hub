import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  isLoggedIn: boolean;
  userEmail: string;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      userEmail: "",
      login: (email: string) => set({ isLoggedIn: true, userEmail: email }),
      logout: () => set({ isLoggedIn: false, userEmail: "" }),
    }),
    {
      name: "auth-storage", // Tên key trong localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
