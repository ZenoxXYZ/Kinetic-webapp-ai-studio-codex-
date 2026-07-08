"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import { useAuth, type AuthUser } from "@/hooks/useAuth";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return context;
}

