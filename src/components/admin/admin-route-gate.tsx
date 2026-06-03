"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { canAccessAdminPath, resolveAdminRedirectForGroups } from "@/lib/auth/admin-route-access";

/**
 * Impide que supervisores abran rutas solo-admin por URL directa.
 */
export function AdminRouteGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { groups, staffAccess, loading } = useAuth();

  const allowed =
    !loading && staffAccess === "allowed" && canAccessAdminPath(pathname, groups);

  useEffect(() => {
    if (loading || staffAccess !== "allowed") return;
    if (!canAccessAdminPath(pathname, groups)) {
      router.replace(resolveAdminRedirectForGroups(groups));
    }
  }, [loading, staffAccess, pathname, groups, router]);

  if (loading || staffAccess === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verificando acceso…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Redirigiendo…
      </div>
    );
  }

  return <>{children}</>;
}
