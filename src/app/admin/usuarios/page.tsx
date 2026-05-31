"use client";

import { AdminHeader, AdminShell } from "@/components/admin/admin-shell";
import { StaffUsersPageContent } from "@/features/users/components/staff-users-page-content";

export default function UsuariosPage() {
  return (
    <AdminShell>
      <AdminHeader
        title="Usuarios del panel"
        description="Staff con acceso web (Cognito): roles admin/supervisor y perfiles de negocio."
      />
      <StaffUsersPageContent />
    </AdminShell>
  );
}
