import type { LucideIcon } from "lucide-react";
import { ClipboardList, Factory, LayoutDashboard, Package, Settings, Truck, Users } from "lucide-react";

export type NavItemStatus = "active" | "coming_soon";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  status: NavItemStatus;
  adminOnly?: boolean;
}

export const adminNavigation: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, status: "active" },
  { href: "/admin/maquila", label: "Rangos maquila", icon: Factory, status: "active" },
  { href: "/admin/configuracion", label: "Defaults comerciales", icon: Settings, status: "active" },
  { href: "/admin/materiales", label: "Tipos MAT", icon: Package, status: "active" },
  { href: "/admin/proveedores", label: "Proveedores", icon: Truck, status: "active" },
  { href: "/admin/valorizaciones", label: "Valorizaciones", icon: ClipboardList, status: "active" },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, status: "active" },
];

export const productName = "Valorización Minera";
export const adminSubtitle = "Panel de administración";
