"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { FieldUsersPageContent } from "@/features/field-users/components/field-users-page-content";

export default function UsuariosCampoPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Usuarios de campo"
        description="Operadores y administradores que ingresan en la app móvil."
      />
      <FieldUsersPageContent />
    </AdminShell>
  );
}
