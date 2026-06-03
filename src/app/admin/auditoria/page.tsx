import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { AuditLogsPageContent } from "@/features/audit-logs/components/audit-logs-page-content";
import { isAuditLogsEnabledForV1 } from "@/config/v1-features";
import { notFound } from "next/navigation";

export default function AuditoriaPage() {
  if (!isAuditLogsEnabledForV1()) {
    notFound();
  }

  return (
    <AdminShell>
      <AdminHeader
        title="Auditoría"
        description="Historial de activaciones, dispositivos y sincronización de cotizaciones desde la app móvil."
      />
      <AuditLogsPageContent />
    </AdminShell>
  );
}
