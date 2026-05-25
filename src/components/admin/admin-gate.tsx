"use client";

import { useAuth } from "@/providers/auth-provider";
import { LoginForm } from "@/features/auth/components/login-form";
import { AccessDenied } from "@/features/auth/components/access-denied";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading, staffAccess } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verificando acceso…
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (staffAccess === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verificando permisos…
      </div>
    );
  }

  if (staffAccess === "denied") {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
