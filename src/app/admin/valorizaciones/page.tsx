"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { ValuationsPageContent } from "@/features/valuations/components/valuations-page-content";

export default function ValorizacionesPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Valorizaciones"
        description="Consulte cotizaciones registradas: listado, filtros y detalle de cada operación."
      />
      <ValuationsPageContent />
    </AdminShell>
  );
}
