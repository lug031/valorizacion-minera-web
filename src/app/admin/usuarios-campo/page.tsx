"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { FieldUsersPageContent } from "@/features/field-users/components/field-users-page-content";

export default function UsuariosCampoPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Usuarios móvil"
        description="Cuentas para ingresar en la app móvil. El operador usa un nombre de usuario corto (no el correo del panel web)."
      />
      <FieldUsersPageContent />
    </AdminShell>
  );
}
