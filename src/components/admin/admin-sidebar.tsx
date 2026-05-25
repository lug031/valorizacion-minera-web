"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { adminNavigation, adminSubtitle, productName } from "@/config/navigation";
import { useAuth } from "@/providers/auth-provider";
import { isAdmin } from "@/lib/auth/cognito-groups";

export function AdminSidebar() {
  const pathname = usePathname();
  const { groups } = useAuth();
  const admin = isAdmin(groups);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="border-b px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-muted">{productName}</p>
        <p className="mt-1 text-sm text-sidebar-muted">{adminSubtitle}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {adminNavigation
          .filter((item) => !item.adminOnly || admin)
          .map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const disabled = item.status === "coming_soon";

            if (disabled) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-muted opacity-60"
                  title="Próximamente"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[10px] uppercase">Pronto</span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/70"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
