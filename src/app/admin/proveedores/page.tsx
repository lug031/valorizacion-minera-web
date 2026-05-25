"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { ProvidersPageContent } from "@/features/providers/components/providers-page-content";

export default function ProveedoresPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Proveedores"
        description="Administre el catálogo maestro de contrapartes comerciales: empresas, mineros y comuneros."
      />
      <ProvidersPageContent />
    </AdminShell>
  );
}
