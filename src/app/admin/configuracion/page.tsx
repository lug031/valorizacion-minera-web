"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { AppSettingsPageContent } from "@/features/app-settings/components/app-settings-page-content";

export default function ConfiguracionPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Defaults comerciales"
        description="Configure los valores base del cotizador: factor, recuperación, RC, costos e INTER internacional."
      />
      <AppSettingsPageContent />
    </AdminShell>
  );
}
