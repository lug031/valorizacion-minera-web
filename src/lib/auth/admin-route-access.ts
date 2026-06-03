import { defaultAdminRoute } from "@/config/navigation";
import { isAdmin, isStaffMember, isSupervisorOnly } from "@/lib/auth/cognito-groups";

/** Rutas del panel visibles para perfil supervisor (solo lectura en UI). */
export const SUPERVISOR_ALLOWED_ADMIN_PATHS = [
  "/admin/maquila",
  "/admin/configuracion",
  "/admin/materiales",
] as const;

function matchesAdminPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Supervisor puede entrar solo a maquila, defaults y tipos MAT. */
export function isSupervisorAllowedAdminPath(pathname: string): boolean {
  return SUPERVISOR_ALLOWED_ADMIN_PATHS.some((href) => matchesAdminPath(pathname, href));
}

/**
 * Acceso a rutas bajo /admin según grupos Cognito.
 * Admin: todas las rutas del menú (y subrutas no listadas si existen).
 * Supervisor: solo SUPERVISOR_ALLOWED_ADMIN_PATHS.
 */
export function canAccessAdminPath(pathname: string, groups: string[]): boolean {
  if (!pathname.startsWith("/admin")) return true;
  if (!isStaffMember(groups)) return false;
  if (isAdmin(groups)) return true;
  if (isSupervisorOnly(groups)) return isSupervisorAllowedAdminPath(pathname);
  return false;
}

export function resolveAdminRedirectForGroups(groups: string[]): string {
  if (isAdmin(groups) || isSupervisorOnly(groups)) return defaultAdminRoute;
  return "/login";
}
