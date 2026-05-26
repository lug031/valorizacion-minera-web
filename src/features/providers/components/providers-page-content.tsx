"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
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
import { ProviderFormDialog } from "@/features/providers/components/provider-form-dialog";
import { useProviderMutations, useProviders } from "@/features/providers/hooks/use-providers";
import {
  hasProviderDefaults,
  type ProviderFormValues,
  type ProviderRecord,
} from "@/features/providers/schemas/provider.schema";
import { formatApiError } from "@/lib/errors/format-api-error";

export function ProvidersPageContent() {
  const canWrite = useCanWriteAdmin();
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useProviders();
  const { create, update, toggleActive } = useProviderMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderRecord | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ProviderRecord | null>(null);

  const rows = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const openCreate = () => {
    setEditing(null);
    setReadOnly(false);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: ProviderRecord) => {
    setEditing(row);
    setReadOnly(!canWrite);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: ProviderFormValues) => {
    setFormError(null);
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, values });
      } else {
        await create.mutateAsync(values);
      }
      setDialogOpen(false);
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo guardar el proveedor."));
    }
  };

  const requestToggleActive = (row: ProviderRecord, isActive: boolean) => {
    if (!isActive) {
      setDeactivateTarget(row);
      return;
    }
    void confirmToggle(row, true);
  };

  const confirmToggle = async (row: ProviderRecord, isActive: boolean) => {
    setFormError(null);
    try {
      await toggleActive.mutateAsync({ id: row.id, isActive });
      setDeactivateTarget(null);
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo cambiar el estado del proveedor."));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Catálogo maestro de proveedores, mineros y comuneros para cotizaciones y reportes.
          </p>
        </div>
        {canWrite ? (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Button>
        ) : null}
      </div>

      {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando proveedores…</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {formatApiError(error, "No se pudo cargar el listado de proveedores.")}
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Defaults</TableHead>
                <TableHead>Observaciones</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No hay proveedores registrados. {canWrite ? "Cree el primero." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.sortOrder ?? 0}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      {row.isActive ? (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Activo</Badge>
                      ) : (
                        <Badge className="border-slate-200 bg-slate-50 text-slate-600">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {hasProviderDefaults(row.defaults) ? (
                        <Badge className="border-sky-200 bg-sky-50 text-sky-800">Configurados</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">
                      {row.notes ?? "—"}
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
                            onCheckedChange={(v) => requestToggleActive(row, v)}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <LoadMoreFooter
            hasMore={Boolean(hasNextPage)}
            loading={isFetchingNextPage}
            onLoadMore={() => void fetchNextPage()}
            shown={rows.length}
          />
        </div>
      )}

      <ProviderFormDialog
        open={dialogOpen}
        initial={editing}
        readOnly={readOnly}
        saving={create.isPending || update.isPending}
        onClose={() => setDialogOpen(false)}
        onSubmit={(values) => void handleSubmit(values)}
      />

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Desactivar proveedor"
        description={`¿Confirma desactivar a "${deactivateTarget?.name}"? No aparecerá en nuevas cotizaciones hasta reactivarlo.`}
        confirmLabel="Desactivar"
        destructive
        loading={toggleActive.isPending}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) void confirmToggle(deactivateTarget, false);
        }}
      />
    </div>
  );
}
