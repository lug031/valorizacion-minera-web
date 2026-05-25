"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCanWriteAdmin } from "@/providers/auth-provider";
import { StaffUserFormDialog } from "@/features/users/components/staff-user-form-dialog";
import { useStaffUserMutations, useStaffUsers } from "@/features/users/hooks/use-staff-users";
import {
  accessStatusLabel,
  recordToUpdateFormValues,
  type CreateStaffUserFormValues,
  type StaffUserRecord,
  type UpdateStaffUserFormValues,
} from "@/features/users/schemas/staff-user.schema";

function roleBadge(role: StaffUserRecord["role"]) {
  if (role === "admin") {
    return <Badge className="border-violet-200 bg-violet-50 text-violet-800">Admin</Badge>;
  }
  if (role === "supervisor") {
    return <Badge className="border-sky-200 bg-sky-50 text-sky-800">Supervisor</Badge>;
  }
  return <span className="text-muted-foreground">—</span>;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return value;
  }
}

export function StaffUsersPageContent() {
  const canWrite = useCanWriteAdmin();
  const { data, isLoading, error } = useStaffUsers();
  const { create, update } = useStaffUserMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUserRecord | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setReadOnly(false);
    setFormError(null);
    setCreatedPassword(null);
    setDialogOpen(true);
  };

  const openEdit = (row: StaffUserRecord) => {
    setEditing(row);
    setReadOnly(!canWrite);
    setFormError(null);
    setCreatedPassword(null);
    setDialogOpen(true);
  };

  const handleCreate = async (values: CreateStaffUserFormValues) => {
    setFormError(null);
    try {
      const result = await create.mutateAsync(values);
      setDialogOpen(false);
      if (result.temporaryPassword) {
        setCreatedPassword(
          `Usuario creado. Contraseña temporal para ${result.email ?? result.username}: ${result.temporaryPassword}`
        );
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo crear el usuario");
    }
  };

  const handleUpdate = async (values: UpdateStaffUserFormValues) => {
    if (!editing) return;
    setFormError(null);
    try {
      await update.mutateAsync({ id: editing.id, values });
      setDialogOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo actualizar");
    }
  };

  const handleToggleActive = async (row: StaffUserRecord, isActive: boolean) => {
    setFormError(null);
    try {
      await update.mutateAsync({
        id: row.id,
        values: { ...recordToUpdateFormValues(row), isActive },
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo cambiar el estado");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Gobierno de acceso al panel web/admin. Los usuarios operadores de campo no se administran aquí.
          </p>
        </div>
        {canWrite ? (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        ) : null}
      </div>

      {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}
      {createdPassword ? (
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {createdPassword}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando usuarios…</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Error al cargar usuarios"}
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acceso</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No hay usuarios registrados. {canWrite ? "Cree el primero." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                (data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.displayName ?? "—"}</TableCell>
                    <TableCell>{row.email ?? row.username}</TableCell>
                    <TableCell>{roleBadge(row.role)}</TableCell>
                    <TableCell>
                      {row.isActive ? (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Activo</Badge>
                      ) : (
                        <Badge className="border-slate-200 bg-slate-50 text-slate-600">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {accessStatusLabel(row.accessStatus)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(row.updatedAt ?? row.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4" />
                          {canWrite ? "Editar" : "Ver"}
                        </Button>
                        {canWrite ? (
                          <Switch
                            checked={Boolean(row.isActive)}
                            onCheckedChange={(v) => void handleToggleActive(row, v)}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <StaffUserFormDialog
        open={dialogOpen}
        initial={editing}
        readOnly={readOnly}
        saving={create.isPending || update.isPending}
        onClose={() => setDialogOpen(false)}
        onSubmitCreate={(values) => void handleCreate(values)}
        onSubmitUpdate={(values) => void handleUpdate(values)}
      />
    </div>
  );
}
