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
import { MaquilaRangeFormDialog } from "@/features/maquila/components/maquila-range-form-dialog";
import { useMaquilaRangeMutations, useMaquilaRanges } from "@/features/maquila/hooks/use-maquila-ranges";
import type { MaquilaRangeFormValues, MaquilaRangeRecord } from "@/features/maquila/schemas/maquila-range.schema";
import { formatApiError } from "@/lib/errors/format-api-error";

export function MaquilaRangesPageContent() {
  const canWrite = useCanWriteAdmin();
  const { data, isLoading, error } = useMaquilaRanges();
  const { create, update, toggleActive } = useMaquilaRangeMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaquilaRangeRecord | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setReadOnly(false);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: MaquilaRangeRecord) => {
    setEditing(row);
    setReadOnly(!canWrite);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: MaquilaRangeFormValues) => {
    setFormError(null);
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, values });
      } else {
        await create.mutateAsync(values);
      }
      setDialogOpen(false);
    } catch (e) {
      setFormError(formatApiError(e, "No se pudo guardar el rango de maquila."));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Tabla maestra para sugerencias de maquila según ley oro (oz/tc).
          </p>
        </div>
        {canWrite ? (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo rango
          </Button>
        ) : null}
      </div>

      {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando rangos…</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {formatApiError(error, "No se pudo cargar los rangos de maquila.")}
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Ley mín</TableHead>
                <TableHead>Ley máx</TableHead>
                <TableHead>Maquila</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Observaciones</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No hay rangos registrados. {canWrite ? "Cree el primero." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                (data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.sortOrder ?? 0}</TableCell>
                    <TableCell>{row.minLeyOzTc}</TableCell>
                    <TableCell>{row.maxLeyOzTc}</TableCell>
                    <TableCell className="font-medium">{row.maquila}</TableCell>
                    <TableCell>
                      {row.isActive ? (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Activo</Badge>
                      ) : (
                        <Badge className="border-slate-200 bg-slate-50 text-slate-600">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
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

      <MaquilaRangeFormDialog
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
