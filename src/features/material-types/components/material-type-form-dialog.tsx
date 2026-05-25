"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  materialTypeSchema,
  type MaterialTypeFormInput,
  type MaterialTypeFormValues,
  type MaterialTypeRecord,
} from "@/features/material-types/schemas/material-type.schema";

interface Props {
  open: boolean;
  initial?: MaterialTypeRecord | null;
  readOnly?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: MaterialTypeFormValues) => void;
}

const emptyValues: MaterialTypeFormInput = {
  code: "",
  label: "",
  sortOrder: "0",
  isActive: true,
  notes: "",
};

export function MaterialTypeFormDialog({
  open,
  initial,
  readOnly = false,
  saving = false,
  onClose,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaterialTypeFormInput, unknown, MaterialTypeFormValues>({
    resolver: zodResolver(materialTypeSchema),
    defaultValues: emptyValues,
  });

  const isActive = watch("isActive");
  const isEditing = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        code: initial.code,
        label: initial.label,
        sortOrder: String(initial.sortOrder ?? 0),
        isActive: initial.isActive ?? true,
        notes: initial.notes ?? "",
      });
    } else {
      reset(emptyValues);
    }
  }, [open, initial, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-primary">
          {readOnly ? "Ver tipo MAT" : isEditing ? "Editar tipo MAT" : "Nuevo tipo MAT"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Catálogo maestro de clasificación de material para cotizaciones en campo.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                disabled={readOnly || isEditing}
                placeholder="MSC"
                {...register("code")}
              />
              {errors.code ? <p className="text-xs text-destructive">{errors.code.message}</p> : null}
              {isEditing && !readOnly ? (
                <p className="text-xs text-muted-foreground">El código no se puede modificar al editar.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Orden</Label>
              <Input id="sortOrder" type="number" disabled={readOnly} {...register("sortOrder")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Nombre / etiqueta</Label>
            <Input id="label" disabled={readOnly} placeholder="Mineral sulfuro de cobre" {...register("label")} />
            {errors.label ? <p className="text-xs text-destructive">{errors.label.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Descripción / observaciones</Label>
            <Textarea
              id="notes"
              disabled={readOnly}
              rows={3}
              placeholder="Notas internas sobre el tipo de material (opcional)."
              {...register("notes")}
            />
            {errors.notes ? <p className="text-xs text-destructive">{errors.notes.message}</p> : null}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              disabled={readOnly}
              onCheckedChange={(v) => setValue("isActive", v)}
            />
            <Label>Tipo activo</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly ? (
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : isEditing ? "Actualizar" : "Crear"}
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
