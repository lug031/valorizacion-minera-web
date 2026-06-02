import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { ProvidersPageContent } from "@/features/providers/components/providers-page-content";
import { isProvidersEnabledForV1 } from "@/config/v1-features";
import { notFound } from "next/navigation";

export default function ProveedoresPage() {
  if (!isProvidersEnabledForV1()) {
    notFound();
  }

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
