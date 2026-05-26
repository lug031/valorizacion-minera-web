"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";

export function AccessDenied() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef2f4] p-6">
      <Card className="max-w-md border-[#e2e8f0] shadow-md">
        <CardHeader>
          <CardTitle>Acceso no autorizado</CardTitle>
          <CardDescription>
            Su cuenta no tiene permisos para ingresar al panel administrativo. Solicite acceso a un
            administrador del sistema.
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
