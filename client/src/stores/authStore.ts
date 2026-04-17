import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthUser = Record<string, unknown> | null;

type AuthState = {
  token: string;
  user: AuthUser;
  setToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
};

const getLegacyAuthState = () => {
  if (typeof window === "undefined") {
    return { token: "", user: null as AuthUser };
  }

  const legacyToken = localStorage.getItem("wah_token") || "";
  let legacyUser: AuthUser = null;

  try {
    legacyUser = JSON.parse(localStorage.getItem("wah_user") || "null");
  } catch {
    legacyUser = null;
  }

  return { token: legacyToken, user: legacyUser };
};

const legacy = getLegacyAuthState();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: legacy.token,
      user: legacy.user,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: "", user: null }),
    }),
    {
      name: "wah-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      version: 1,
    },
  ),
);
