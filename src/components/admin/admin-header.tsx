"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function AdminHeader({ title, description }: { title: string; description?: string }) {
  const router = useRouter();
  const { user, role, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-8">
      <div>
        <h1 className="text-sm font-bold text-[#001c23]">{title}</h1>
        {description ? <p className="text-xs text-[#64748b]">{description}</p> : null}
      </div>
      <div className="flex items-center gap-4 text-right text-xs">
        <div className="hidden sm:block">
          <p className="font-bold text-[#001c23]">{user?.signInDetails?.loginId ?? "Usuario"}</p>
          <p className="text-[#64748b]">
            {role === "admin" ? "Administrador" : role === "supervisor" ? "Supervisor" : "Usuario"}
          </p>
        </div>
        <Button variant="link" size="sm" className="px-0 text-[#008ba3]" onClick={() => void handleLogout()}>
          Salir
        </Button>
      </div>
    </header>
  );
}
