"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
  type AuthUser,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import {
  isStaffMember,
  primaryStaffRole,
  sessionStaffGroups,
  type StaffGroup,
} from "@/lib/auth/cognito-groups";
import { recordLastAccess } from "@/lib/datetime/format-last-access";

interface AuthContextValue {
  user: AuthUser | null;
  groups: string[];
  role: StaffGroup | null;
  loading: boolean;
  staffAccess: "pending" | "allowed" | "denied";
  login: (email: string, password: string) => Promise<"signed-in" | "new-password-required">;
  completeNewPassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function resolveStaffAccess(): Promise<{
  user: AuthUser | null;
  groups: string[];
  staffAccess: "pending" | "allowed" | "denied";
}> {
  try {
    const user = await getCurrentUser();
    let session = await fetchAuthSession({ forceRefresh: false });
    let groups = sessionStaffGroups(session);
    if (groups.length === 0) {
      session = await fetchAuthSession({ forceRefresh: true });
      groups = sessionStaffGroups(session);
    }
    return {
      user,
      groups,
      staffAccess: isStaffMember(groups) ? "allowed" : "denied",
    };
  } catch {
    return { user: null, groups: [], staffAccess: "denied" };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [staffAccess, setStaffAccess] = useState<"pending" | "allowed" | "denied">("pending");
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    const result = await resolveStaffAccess();
    setUser(result.user);
    setGroups(result.groups);
    setStaffAccess(result.user ? result.staffAccess : "denied");
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshSession();
    const unsub = Hub.listen("auth", () => {
      void refreshSession();
    });
    return () => unsub();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await signIn({ username: email.trim(), password });
      if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        return "new-password-required" as const;
      }
      await refreshSession();
      recordLastAccess();
      return "signed-in" as const;
    },
    [refreshSession]
  );

  const completeNewPassword = useCallback(
    async (newPassword: string) => {
      await confirmSignIn({ challengeResponse: newPassword });
      await refreshSession();
      recordLastAccess();
    },
    [refreshSession]
  );

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    setGroups([]);
    setStaffAccess("denied");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      groups,
      role: primaryStaffRole(groups),
      loading,
      staffAccess: user ? staffAccess : "denied",
      login,
      completeNewPassword,
      logout,
      refreshSession,
    }),
    [user, groups, loading, staffAccess, login, completeNewPassword, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export function useCanWriteAdmin() {
  const { groups } = useAuth();
  return groups.includes("admin");
}
