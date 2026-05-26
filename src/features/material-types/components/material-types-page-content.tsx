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
import { MaterialTypeFormDialog } from "@/features/material-types/components/material-type-form-dialog";
import { useMaterialTypeMutations, useMaterialTypes } from "@/features/material-types/hooks/use-material-types";
import type { MaterialTypeFormValues, MaterialTypeRecord } from "@/features/material-types/schemas/material-type.schema";

export function MaterialTypesPageContent() {
  const canWrite = useCanWriteAdmin();
  const { data, isLoading, error } = useMaterialTypes();
  const { create, update, toggleActive } = useMaterialTypeMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialTypeRecord | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setReadOnly(false);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: MaterialTypeRecord) => {
    setEditing(row);
    setReadOnly(!canWrite);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: MaterialTypeFormValues) => {
    setFormError(null);
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, values });
      } else {
        await create.mutateAsync(values);
      }
      setDialogOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Catálogo maestro de tipos de material (MSC, MOC, MSLL, etc.) usado en cotizaciones.
          </p>
        </div>
        {canWrite ? (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo tipo
          </Button>
        ) : null}
      </div>

      {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando tipos MAT…</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Error al cargar tipos MAT"}
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Etiqueta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Observaciones</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No hay tipos MAT registrados. {canWrite ? "Cree el primero (ej. MSC, MOC)." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                (data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.sortOrder ?? 0}</TableCell>
                    <TableCell className="font-mono font-medium">{row.code}</TableCell>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>
                      {row.isActive ? (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Activo</Badge>
                      ) : (
                        <Badge className="border-slate-200 bg-slate-50 text-slate-600">Inactivo</Badge>
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
                            onCheckedChange={(v) =>
                              void toggleActive.mutateAsync({ id: row.id, isActive: v })
                            }
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

      <MaterialTypeFormDialog
        open={dialogOpen}
        initial={editing}
        readOnly={readOnly}
        saving={create.isPending || update.isPending}
        onClose={() => setDialogOpen(false)}
        onSubmit={(values) => void handleSubmit(values)}
      />
    </div>
  );
}
