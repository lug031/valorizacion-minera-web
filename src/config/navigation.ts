import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Factory,
  HardHat,
  Package,
  ScrollText,
  Settings,
  Smartphone,
  Truck,
  Users,
} from "lucide-react";
import {
  isAuditLogsEnabledForV1,
  isProvidersEnabledForV1,
  isValuationsEnabledForV1,
} from "@/config/v1-features";

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
    ? [
        {
          href: "/admin/proveedores",
          label: "Proveedores",
          icon: Truck,
          status: "active" as const,
          adminOnly: true,
        },
      ]
    : []),
  ...(isValuationsEnabledForV1()
    ? [
        {
          href: "/admin/valorizaciones",
          label: "Valorizaciones",
          icon: ClipboardList,
          status: "active" as const,
          adminOnly: true,
        },
      ]
    : []),
  { href: "/admin/usuarios", label: "Usuarios web", icon: Users, status: "active", adminOnly: true },
  {
    href: "/admin/usuarios-campo",
    label: "Usuarios móvil",
    icon: HardHat,
    status: "active",
    adminOnly: true,
  },
  {
    href: "/admin/dispositivos",
    label: "Dispositivos móviles",
    icon: Smartphone,
    status: "active",
    adminOnly: true,
  },
  ...(isAuditLogsEnabledForV1()
    ? [
        {
          href: "/admin/auditoria",
          label: "Auditoría",
          icon: ScrollText,
          status: "active" as const,
          adminOnly: true,
        },
      ]
    : []),
];

export const adminSubtitle = "Panel de administración";
