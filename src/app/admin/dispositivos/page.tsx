"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { FieldDevicesPageContent } from "@/features/field-devices/components/field-devices-page-content";

export default function DispositivosPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Dispositivos móviles"
        description="Asigne teléfonos, genere códigos de activación y controle el acceso a la app."
      />
      <FieldDevicesPageContent />
    </AdminShell>
  );
}
