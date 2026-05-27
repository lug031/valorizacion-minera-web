"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { AccessDenied } from "@/features/auth/components/access-denied";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading, staffAccess } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verificando acceso…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Redirigiendo al inicio de sesión…
      </div>
    );
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
