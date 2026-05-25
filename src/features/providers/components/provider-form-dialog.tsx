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
  providerFormSchema,
  recordToFormValues,
  type ProviderFormInput,
  type ProviderFormValues,
  type ProviderRecord,
} from "@/features/providers/schemas/provider.schema";

interface Props {
  open: boolean;
  initial?: ProviderRecord | null;
  readOnly?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: ProviderFormValues) => void;
}

const emptyValues: ProviderFormInput = {
  name: "",
  sortOrder: "0",
  isActive: true,
  notes: "",
  recPercentGold: "",
  recPercentSilver: "",
  rcGold: "",
  rcSilver: "",
  consumos: "",
  flete: "",
  interGold: "",
  interSilver: "",
  factor: "",
};

export function ProviderFormDialog({
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
  } = useForm<ProviderFormInput, unknown, ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: emptyValues,
  });

  const isActive = watch("isActive");
  const isEditing = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      reset(recordToFormValues(initial));
    } else {
      reset(emptyValues);
    }
  }, [open, initial, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border bg-background shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-primary">
            {readOnly ? "Ver proveedor" : isEditing ? "Editar proveedor" : "Nuevo proveedor"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Empresa, minero, comunero o contraparte comercial del negocio.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  disabled={readOnly}
                  placeholder="Ej. Comunidad Minera San Juan"
                  {...register("name")}
                />
                {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Orden</Label>
                <Input id="sortOrder" type="number" disabled={readOnly} {...register("sortOrder")} />
              </div>
              <div className="flex items-center gap-3 self-end pb-1">
                <Switch
                  checked={isActive}
                  disabled={readOnly}
                  onCheckedChange={(v) => setValue("isActive", v)}
                />
                <Label>Proveedor activo</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea
                id="notes"
                disabled={readOnly}
                rows={2}
                placeholder="Notas internas sobre la contraparte (opcional)."
                {...register("notes")}
              />
              {errors.notes ? <p className="text-xs text-destructive">{errors.notes.message}</p> : null}
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <h3 className="text-sm font-semibold text-primary">Defaults comerciales (opcional)</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Valores que precargarán el formulario al seleccionar este proveedor. Si se dejan vacíos, se
                usarán los defaults globales.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="factor">Factor</Label>
                  <Input id="factor" disabled={readOnly} {...register("factor")} />
                  {errors.factor ? <p className="text-xs text-destructive">{errors.factor.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recPercentGold">REC oro (%)</Label>
                  <Input id="recPercentGold" disabled={readOnly} {...register("recPercentGold")} />
                  {errors.recPercentGold ? (
                    <p className="text-xs text-destructive">{errors.recPercentGold.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recPercentSilver">REC plata (%)</Label>
                  <Input id="recPercentSilver" disabled={readOnly} {...register("recPercentSilver")} />
                  {errors.recPercentSilver ? (
                    <p className="text-xs text-destructive">{errors.recPercentSilver.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rcGold">RC oro (US$/oz)</Label>
                  <Input id="rcGold" disabled={readOnly} {...register("rcGold")} />
                  {errors.rcGold ? <p className="text-xs text-destructive">{errors.rcGold.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rcSilver">RC plata (US$/oz)</Label>
                  <Input id="rcSilver" disabled={readOnly} {...register("rcSilver")} />
                  {errors.rcSilver ? <p className="text-xs text-destructive">{errors.rcSilver.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consumos">Consumos (US$/TMS)</Label>
                  <Input id="consumos" disabled={readOnly} {...register("consumos")} />
                  {errors.consumos ? <p className="text-xs text-destructive">{errors.consumos.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flete">Flete (US$/TMS)</Label>
                  <Input id="flete" disabled={readOnly} {...register("flete")} />
                  {errors.flete ? <p className="text-xs text-destructive">{errors.flete.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interGold">INTER oro (US$)</Label>
                  <Input id="interGold" disabled={readOnly} {...register("interGold")} />
                  {errors.interGold ? <p className="text-xs text-destructive">{errors.interGold.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interSilver">INTER plata (US$)</Label>
                  <Input id="interSilver" disabled={readOnly} {...register("interSilver")} />
                  {errors.interSilver ? (
                    <p className="text-xs text-destructive">{errors.interSilver.message}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t px-6 py-4">
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
