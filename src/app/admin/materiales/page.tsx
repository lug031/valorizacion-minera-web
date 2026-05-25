"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { MaterialTypesPageContent } from "@/features/material-types/components/material-types-page-content";

export default function MaterialesPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Tipos MAT"
        description="Administre el catálogo maestro de clasificación de material para cotizaciones."
      />
      <MaterialTypesPageContent />
    </AdminShell>
  );
}
