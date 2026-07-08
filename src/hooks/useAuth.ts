"use client";

import type { UserRole } from "@prisma/client";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { create } from "zustand";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

export type AuthUser = {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  role: UserRole;
  avatarUrl: string | null;
  createdAt?: string;
  studentProfile: {
    examTarget: string | null;
    targetExamDate: string | null;
    prepLevel: string | null;
    topicEnergy?: number;
    dailyQuestionLimit?: number;
  } | null;
  xp: {
    total: number;
    thisWeek: number;
    level: number;
  };
  onboardingRequired: boolean;
  onboardingComplete: boolean;
};

type AuthApiUser = Omit<AuthUser, "onboardingComplete">;

type AuthStore = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  hasCheckedSession: boolean;
  setUser: (user: AuthUser | null) => void;
  markChecked: () => void;
  reset: () => void;
};

type UseAuthResult = {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
};

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoggedIn: false,
  hasCheckedSession: false,
  setUser: (user) =>
    set({
      user,
      isLoggedIn: Boolean(user),
      hasCheckedSession: true,
    }),
  markChecked: () => set({ hasCheckedSession: true }),
  reset: () =>
    set({
      user: null,
      isLoggedIn: false,
      hasCheckedSession: true,
    }),
}));

function normalizeUser(user: AuthApiUser): AuthUser {
  return {
    ...user,
    onboardingComplete: !user.onboardingRequired,
  };
}

export function useAuth(): UseAuthResult {
  const router = useRouter();
  const { user, isLoggedIn, hasCheckedSession, setUser, markChecked, reset } =
    useAuthStore();
  const [isLoading, setIsLoading] = useState(!hasCheckedSession && !user);

  useEffect(() => {
    let isActive = true;

    async function loadUser() {
      if (user) {
        setIsLoading(false);
        return;
      }

      if (hasCheckedSession) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (response.status === 401) {
          reset();
          return;
        }

        const payload = (await response.json()) as ApiResponse<{
          user: AuthApiUser;
        }>;

        if (!payload.success) {
          reset();
          return;
        }

        setUser(normalizeUser(payload.data.user));
      } catch {
        reset();
      } finally {
        if (isActive) {
          markChecked();
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      isActive = false;
    };
  }, [hasCheckedSession, markChecked, reset, setUser, user]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      reset();
      router.replace("/login" as Route);
    }
  }, [reset, router]);

  return {
    user,
    isLoading,
    isLoggedIn,
    logout,
  };
}

