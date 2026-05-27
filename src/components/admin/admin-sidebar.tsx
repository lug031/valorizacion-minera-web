"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { adminNavigation, adminSubtitle } from "@/config/navigation";
import { useAuth } from "@/providers/auth-provider";
import { isAdmin } from "@/lib/auth/cognito-groups";
import { formatLastAccessPet, getLastAccessIso } from "@/lib/datetime/format-last-access";

export function AdminSidebar() {
  const pathname = usePathname();
  const { groups, user } = useAuth();
  const admin = isAdmin(groups);
  const [lastAccessText, setLastAccessText] = useState("—");

  useEffect(() => {
    const update = () => setLastAccessText(formatLastAccessPet(getLastAccessIso()));
    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, [user]);

  return (
    <aside className="custom-scrollbar fixed z-20 flex h-full w-64 shrink-0 flex-col overflow-y-auto bg-[#001c23] text-white">
      <div className="px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">{adminSubtitle}</p>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {adminNavigation
          .filter((item) => !item.adminOnly || admin)
          .map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold opacity-95 transition-colors",
                  active ? "bg-white/10 text-white" : "text-white/90 hover:bg-white/5"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
      </nav>
      <div className="mt-auto border-t border-white/10 p-4">
        <div className="px-2 text-[10px] text-white/60">
          <p className="font-bold text-white/80">Último acceso</p>
          <p className="mt-1 leading-snug">
            {lastAccessText === "—" ? "—" : `${lastAccessText} PET`}
          </p>
          <p className="mt-0.5">GMT-5</p>
        </div>
      </div>
    </aside>
  );
}
