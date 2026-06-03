import { use } from "react";
import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { ValuationDetailContent } from "@/features/valuations/components/valuation-detail-content";
import { isValuationsEnabledForV1 } from "@/config/v1-features";
import { notFound } from "next/navigation";

export default function ValorizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isValuationsEnabledForV1()) {
    notFound();
  }

  const { id } = use(params);

  return (
    <AdminShell>
      <AdminHeader
        title="Detalle de valorización"
        description="Vista de solo lectura con el detalle completo de la cotización."
      />
      <ValuationDetailContent id={id} />
    </AdminShell>
  );
}
