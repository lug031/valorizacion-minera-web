import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { ValuationsPageContent } from "@/features/valuations/components/valuations-page-content";
import { isValuationsEnabledForV1 } from "@/config/v1-features";
import { notFound } from "next/navigation";

export default function ValorizacionesPage() {
  if (!isValuationsEnabledForV1()) {
    notFound();
  }

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
