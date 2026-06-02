import type { LucideIcon } from "lucide-react";
import { ClipboardList, Factory, HardHat, Package, Settings, Smartphone, Truck, Users } from "lucide-react";
import { isProvidersEnabledForV1 } from "@/config/v1-features";

export type NavItemStatus = "active" | "coming_soon";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  status: NavItemStatus;
  adminOnly?: boolean;
}

/** Ruta inicial del panel (dashboard oculto por ahora). */
export const defaultAdminRoute = "/admin/maquila";

export const adminNavigation: AdminNavItem[] = [
  { href: "/admin/maquila", label: "Rangos maquila", icon: Factory, status: "active" },
  { href: "/admin/configuracion", label: "Defaults comerciales", icon: Settings, status: "active" },
  { href: "/admin/materiales", label: "Tipos MAT", icon: Package, status: "active" },
  ...(isProvidersEnabledForV1()
    ? [{ href: "/admin/proveedores", label: "Proveedores", icon: Truck, status: "active" as const }]
    : []),
  { href: "/admin/valorizaciones", label: "Valorizaciones", icon: ClipboardList, status: "active" },
  { href: "/admin/usuarios", label: "Usuarios panel", icon: Users, status: "active" },
  { href: "/admin/usuarios-campo", label: "Usuarios de campo", icon: HardHat, status: "active" },
  { href: "/admin/dispositivos", label: "Dispositivos móviles", icon: Smartphone, status: "active" },
];

export const adminSubtitle = "Panel de administración";
