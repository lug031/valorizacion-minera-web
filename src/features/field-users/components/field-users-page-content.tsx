"use client";

import { useMemo, useState } from "react";
import { KeyRound, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadMoreFooter } from "@/components/ui/load-more-footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCanWriteAdmin } from "@/providers/auth-provider";
import { FieldUserFormDialog } from "@/features/field-users/components/field-user-form-dialog";
import { useFieldUserMutations, useFieldUsers } from "@/features/field-users/hooks/use-field-users";
import {
  fieldRoleLabel,
  recordToUpdateFormValues,
  type CreateFieldUserFormValues,
  type FieldUserRecord,
  type UpdateFieldUserFormValues,
} from "@/features/field-users/schemas/field-user.schema";
import { formatApiError } from "@/lib/errors/format-api-error";
import { LIST_PAGE_SIZE } from "@/lib/pagination/constants";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return value;
  }
}

export function FieldUsersPageContent() {
  const canWrite = useCanWriteAdmin();
  const { data, isLoading, error } = useFieldUsers();
  const { create, update, resetPassword } = useFieldUserMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FieldUserRecord | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(LIST_PAGE_SIZE);
  const [deactivateTarget, setDeactivateTarget] = useState<FieldUserRecord | null>(null);

  const rows = useMemo(() => (data ?? []).slice(0, visibleCount), [data, visibleCount]);
  const totalRows = data?.length ?? 0;
  const hasMore = visibleCount < totalRows;

  const openCreate = () => {
    setEditing(null);
    setReadOnly(false);
    setFormError(null);
    setPasswordNotice(null);
    setDialogOpen(true);
  };

  const openEdit = (row: FieldUserRecord) => {
    setEditing(row);
    setReadOnly(!canWrite);
    setFormError(null);
    setPasswordNotice(null);
    setDialogOpen(true);
  };

  const handleCreate = async (values: CreateFieldUserFormValues) => {
    setFormError(null);
    try {
      const result = await create.mutateAsync(values);
      setDialogOpen(false);
      setVisibleCount(LIST_PAGE_SIZE);
      if (result.initialPassword) {
        setPasswordNotice(
          `Usuario creado. Contraseña inicial para ${result.username}: ${result.initialPassword}. Sincronice en la app móvil (admin).`
        );
      }
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo crear el usuario de campo."));
    }
  };

  const handleUpdate = async (values: UpdateFieldUserFormValues) => {
    if (!editing) return;
    setFormError(null);
    try {
      await update.mutateAsync({ id: editing.id, values });
      setDialogOpen(false);
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo actualizar el usuario de campo."));
    }
  };

  const requestToggleActive = (row: FieldUserRecord, isActive: boolean) => {
    if (!isActive) {
      setDeactivateTarget(row);
      return;
    }
    void confirmToggle(row, true);
  };

  const confirmToggle = async (row: FieldUserRecord, isActive: boolean) => {
    setFormError(null);
    try {
      await update.mutateAsync({
        id: row.id,
        values: { ...recordToUpdateFormValues(row), isActive },
      });
      setDeactivateTarget(null);
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo cambiar el estado del usuario."));
    }
  };

  const handleResetPassword = async (row: FieldUserRecord) => {
    setFormError(null);
    try {
      const result = await resetPassword.mutateAsync(row.id);
      if (result.initialPassword) {
        setPasswordNotice(
          `Nueva contraseña para ${result.username}: ${result.initialPassword}. Sincronice en la app móvil (admin).`
        );
      }
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo restablecer la contraseña."));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Usuarios operativos de la app móvil (login offline). La web es la fuente maestra; el admin móvil sincroniza.
        </p>
        {canWrite ? (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo usuario de campo
          </Button>
        ) : null}
      </div>

      {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}
      {passwordNotice ? (
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {passwordNotice}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando usuarios de campo…</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {formatApiError(error, "No se pudo cargar el listado de usuarios de campo.")}
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No hay usuarios de campo. {canWrite ? "Cree el primero." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.displayName ?? "—"}</TableCell>
                    <TableCell>{row.username}</TableCell>
                    <TableCell>{fieldRoleLabel(row.role)}</TableCell>
                    <TableCell>
                      {row.isActive ? (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Activo</Badge>
                      ) : (
                        <Badge className="border-slate-200 bg-slate-50 text-slate-600">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(row.updatedAt ?? row.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4" />
                          {canWrite ? "Editar" : "Ver"}
                        </Button>
                        {canWrite ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => void handleResetPassword(row)}>
                              <KeyRound className="h-4 w-4" />
                              Restablecer clave
                            </Button>
                            <Switch
                              checked={Boolean(row.isActive)}
                              onCheckedChange={(v) => requestToggleActive(row, v)}
                            />
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <LoadMoreFooter
            hasMore={hasMore}
            onLoadMore={() => setVisibleCount((c) => c + LIST_PAGE_SIZE)}
            shown={rows.length}
            total={totalRows}
          />
        </div>
      )}

      <FieldUserFormDialog
        open={dialogOpen}
        initial={editing}
        readOnly={readOnly}
        saving={create.isPending || update.isPending}
        onClose={() => setDialogOpen(false)}
        onSubmitCreate={(values) => void handleCreate(values)}
        onSubmitUpdate={(values) => void handleUpdate(values)}
      />

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Desactivar usuario de campo"
        description={`¿Confirma desactivar a ${deactivateTarget?.displayName ?? deactivateTarget?.username ?? "este usuario"}? No podrá iniciar sesión en la app móvil tras sincronizar.`}
        confirmLabel="Desactivar"
        destructive
        loading={update.isPending}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) void confirmToggle(deactivateTarget, false);
        }}
      />
    </div>
  );
}
