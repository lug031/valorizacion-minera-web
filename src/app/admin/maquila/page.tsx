"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { MaquilaRangesPageContent } from "@/features/maquila/components/maquila-ranges-page-content";

export default function MaquilaPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Rangos de maquila"
        description="Configure la tabla de sugerencia por ley oro (oz/tc)."
      />
      <MaquilaRangesPageContent />
    </AdminShell>
  );
}
