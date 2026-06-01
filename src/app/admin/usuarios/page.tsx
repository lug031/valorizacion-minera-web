"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { StaffUsersPageContent } from "@/features/users/components/staff-users-page-content";

export default function UsuariosPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Usuarios del panel"
        description="Personas con acceso al panel web. Para la app móvil, use Usuarios de campo."
      />
      <StaffUsersPageContent />
    </AdminShell>
  );
}
