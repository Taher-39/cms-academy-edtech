import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------- Types ----------
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin" | "superAdmin";
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  enrolledCourses?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

// ---------- Auth Store ----------
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "cms-auth" }
  )
);

// ---------- Theme Store ----------
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    { name: "cms-theme" }
  )
);
