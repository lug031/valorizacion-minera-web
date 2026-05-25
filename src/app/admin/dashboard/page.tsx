"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Dashboard"
        description="Resumen del panel de administración y configuración maestra."
      />
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rangos maquila</CardTitle>
            <CardDescription>Módulo activo — tabla maestra para sugerencias comerciales.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/maquila">
              <Button>Administrar rangos</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Defaults comerciales</CardTitle>
            <CardDescription>
              Módulo activo — factor, REC, RC, consumos, flete e intermediación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/configuracion">
              <Button>Administrar defaults</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos MAT</CardTitle>
            <CardDescription>
              Módulo activo — catálogo maestro de clasificación de material (MSC, MOC, etc.).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/materiales">
              <Button>Administrar tipos MAT</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proveedores</CardTitle>
            <CardDescription>
              Módulo activo — catálogo maestro de contrapartes comerciales y defaults por proveedor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/proveedores">
              <Button>Administrar proveedores</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usuarios</CardTitle>
            <CardDescription>
              Módulo activo — gobierno de acceso staff (admin / supervisor) vía Cognito.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/usuarios">
              <Button>Administrar usuarios</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valorizaciones</CardTitle>
            <CardDescription>
              Módulo activo — consulta de cotizaciones y detalle desde snapshot (solo lectura).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/valorizaciones">
              <Button>Consultar valorizaciones</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
