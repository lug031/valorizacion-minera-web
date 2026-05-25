"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { StaffUsersPageContent } from "@/features/users/components/staff-users-page-content";

export default function UsuariosPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Usuarios"
        description="Administre el acceso al panel web: roles, estado y perfiles de negocio vinculados a Cognito."
      />
      <StaffUsersPageContent />
    </AdminShell>
  );
}
