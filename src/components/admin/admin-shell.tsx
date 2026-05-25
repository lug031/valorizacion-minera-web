"use client";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminGate } from "@/components/admin/admin-gate";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <div className="flex min-h-screen bg-muted/30">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    </AdminGate>
  );
}

export { AdminHeader };
