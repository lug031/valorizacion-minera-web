"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";

export function AccessDenied() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Acceso no autorizado</CardTitle>
          <CardDescription>
            Su cuenta no pertenece a un grupo con acceso al panel (admin o supervisor).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void logout()}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
