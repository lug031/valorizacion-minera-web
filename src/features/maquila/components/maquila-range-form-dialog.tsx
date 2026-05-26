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
  maquilaRangeSchema,
  type MaquilaRangeFormInput,
  type MaquilaRangeFormValues,
  type MaquilaRangeRecord,
} from "@/features/maquila/schemas/maquila-range.schema";

interface Props {
  open: boolean;
  initial?: MaquilaRangeRecord | null;
  readOnly?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: MaquilaRangeFormValues) => void;
}

const emptyValues: MaquilaRangeFormInput = {
  minLeyOzTc: "",
  maxLeyOzTc: "",
  maquila: "",
  sortOrder: "0",
  isActive: true,
  notes: "",
};

export function MaquilaRangeFormDialog({
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
  } = useForm<MaquilaRangeFormInput, unknown, MaquilaRangeFormValues>({
    resolver: zodResolver(maquilaRangeSchema),
    defaultValues: emptyValues,
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        minLeyOzTc: initial.minLeyOzTc,
        maxLeyOzTc: initial.maxLeyOzTc,
        maquila: initial.maquila,
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
          {readOnly ? "Ver rango" : initial ? "Editar rango" : "Nuevo rango de maquila"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ley oro en oz/tc → maquila sugerida para cotización.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minLeyOzTc">Ley mín (oz/tc)</Label>
              <Input id="minLeyOzTc" disabled={readOnly} {...register("minLeyOzTc")} />
              {errors.minLeyOzTc ? (
                <p className="text-xs text-destructive">{errors.minLeyOzTc.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLeyOzTc">Ley máx (oz/tc)</Label>
              <Input id="maxLeyOzTc" disabled={readOnly} {...register("maxLeyOzTc")} />
              {errors.maxLeyOzTc ? (
                <p className="text-xs text-destructive">{errors.maxLeyOzTc.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maquila">Maquila (US$)</Label>
              <Input id="maquila" disabled={readOnly} {...register("maquila")} />
              {errors.maquila ? (
                <p className="text-xs text-destructive">{errors.maquila.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Orden</Label>
              <Input id="sortOrder" type="number" disabled={readOnly} {...register("sortOrder")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea id="notes" disabled={readOnly} rows={2} {...register("notes")} />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              disabled={readOnly}
              onCheckedChange={(v) => setValue("isActive", v)}
            />
            <Label>Rango activo</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly ? (
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : initial ? "Actualizar" : "Crear"}
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
