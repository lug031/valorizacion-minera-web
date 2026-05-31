"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { FieldDevicesPageContent } from "@/features/field-devices/components/field-devices-page-content";

export default function DispositivosPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Dispositivos móviles"
        description="Asigne cupos, genere códigos de activación y controle licencias por usuario de campo."
      />
      <FieldDevicesPageContent />
    </AdminShell>
  );
}
