"use client";

import { use } from "react";
import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { ValuationDetailContent } from "@/features/valuations/components/valuation-detail-content";

export default function ValorizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AdminShell>
      <AdminHeader
        title="Detalle de valorización"
        description="Vista de solo lectura reconstruida desde el snapshot guardado."
      />
      <ValuationDetailContent id={id} />
    </AdminShell>
  );
}
