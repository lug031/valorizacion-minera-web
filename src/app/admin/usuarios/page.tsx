"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { StaffUsersPageContent } from "@/features/users/components/staff-users-page-content";

export default function UsuariosPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Usuarios web"
        description="Personas con acceso al panel web. Para la app móvil, use Usuarios móvil."
      />
      <StaffUsersPageContent />
    </AdminShell>
  );
}
