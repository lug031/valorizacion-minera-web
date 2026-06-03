"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { AuditLogsPageContent } from "@/features/audit-logs/components/audit-logs-page-content";

export default function AuditoriaPage() {
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
