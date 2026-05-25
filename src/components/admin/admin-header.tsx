"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function AdminHeader({ title, description }: { title: string; description?: string }) {
  const { user, role, logout } = useAuth();

  return (
    <header className="flex items-start justify-between border-b bg-background px-6 py-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex items-center gap-4 text-right text-sm">
        <div>
          <p className="font-medium">{user?.signInDetails?.loginId ?? "Usuario"}</p>
          <p className="text-muted-foreground capitalize">{role ?? "staff"}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void logout()}>
          Salir
        </Button>
      </div>
    </header>
  );
}
