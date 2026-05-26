"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCanWriteAdmin } from "@/providers/auth-provider";
import {
  appSettingsFormSchema,
  recordToFormValues,
  type AppSettingsFormValues,
  type AppSettingsRecord,
} from "@/features/app-settings/schemas/app-settings.schema";
import { useAppSettingsMutations } from "@/features/app-settings/hooks/use-app-settings";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatApiError } from "@/lib/errors/format-api-error";

interface Props {
  settings: AppSettingsRecord;
}

function Field({
  id,
  label,
  hint,
  error,
  disabled,
  ...inputProps
}: React.ComponentProps<"input"> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <Input id={id} disabled={disabled} {...inputProps} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function AppSettingsForm({ settings }: Props) {
  const canWrite = useCanWriteAdmin();
  const { update, restoreReference } = useAppSettingsMutations();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AppSettingsFormValues>({
    resolver: zodResolver(appSettingsFormSchema),
    defaultValues: recordToFormValues(settings),
  });

  useEffect(() => {
    reset(recordToFormValues(settings));
  }, [settings, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await update.mutateAsync(values);
      setSuccessMessage("Configuración guardada correctamente.");
    } catch (e) {
      setErrorMessage(formatApiError(e, "No se pudo guardar la configuración."));
    }
  });

  const onRestore = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await restoreReference.mutateAsync();
      setRestoreOpen(false);
      setSuccessMessage("Valores de referencia restaurados.");
    } catch (e) {
      setErrorMessage(formatApiError(e, "No se pudo restaurar la configuración."));
    }
  };

  const onCancel = () => {
    reset(recordToFormValues(settings));
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const readOnly = !canWrite;
  const saving = update.isPending || restoreReference.isPending;

  const updatedLabel = settings.updatedAt
    ? new Date(settings.updatedAt).toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuración global</CardTitle>
          <CardDescription>
            Valores iniciales que se aplicarán al crear nuevas cotizaciones.{" "}
            {updatedLabel ? `Última actualización: ${updatedLabel}.` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field
            id="factor"
            label="Factor comercial"
            disabled={readOnly || saving}
            error={errors.factor?.message}
            {...register("factor")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recuperación (REC)</CardTitle>
          <CardDescription>Porcentajes de recuperación metalúrgica por defecto.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field
            id="defaultRecPercentGold"
            label="REC oro (%)"
            disabled={readOnly || saving}
            error={errors.defaultRecPercentGold?.message}
            {...register("defaultRecPercentGold")}
          />
          <Field
            id="defaultRecPercentSilver"
            label="REC plata (%)"
            disabled={readOnly || saving}
            error={errors.defaultRecPercentSilver?.message}
            {...register("defaultRecPercentSilver")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Protección (RC)</CardTitle>
          <CardDescription>Valores RC por defecto en US$/oz.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field
            id="defaultRcGold"
            label="RC oro (US$/oz)"
            disabled={readOnly || saving}
            error={errors.defaultRcGold?.message}
            {...register("defaultRcGold")}
          />
          <Field
            id="defaultRcSilver"
            label="RC plata (US$/oz)"
            disabled={readOnly || saving}
            error={errors.defaultRcSilver?.message}
            {...register("defaultRcSilver")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Costos por TMS</CardTitle>
          <CardDescription>Consumos y flete expresados en US$/TMS.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field
            id="defaultConsumos"
            label="Consumos (US$/TMS)"
            disabled={readOnly || saving}
            error={errors.defaultConsumos?.message}
            {...register("defaultConsumos")}
          />
          <Field
            id="defaultFlete"
            label="Flete (US$/TMS)"
            disabled={readOnly || saving}
            error={errors.defaultFlete?.message}
            {...register("defaultFlete")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Intermediación (INTER)</CardTitle>
          <CardDescription>Precios de referencia INTER por metal.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field
            id="defaultInterGold"
            label="INTER oro (US$)"
            disabled={readOnly || saving}
            error={errors.defaultInterGold?.message}
            {...register("defaultInterGold")}
          />
          <Field
            id="defaultInterSilver"
            label="INTER plata (US$)"
            disabled={readOnly || saving}
            error={errors.defaultInterSilver?.message}
            {...register("defaultInterSilver")}
          />
        </CardContent>
      </Card>

      {readOnly ? (
        <p className="text-sm text-muted-foreground">
          Modo solo lectura — perfil supervisor. Contacte a un administrador para modificar estos valores.
        </p>
      ) : null}

      {successMessage ? <p className="text-sm font-medium text-emerald-700">{successMessage}</p> : null}
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      {!readOnly ? (
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || !isDirty}>
            {update.isPending ? "Guardando…" : "Guardar configuración"}
          </Button>
          <Button type="button" variant="outline" disabled={saving || !isDirty} onClick={onCancel}>
            Cancelar cambios
          </Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={() => setRestoreOpen(true)}>
            Restaurar valores de referencia
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={restoreOpen}
        title="Restaurar valores de referencia"
        description="Se reemplazarán los parámetros comerciales actuales por los valores de referencia del sistema. Esta acción no se puede deshacer desde esta pantalla."
        confirmLabel="Restaurar"
        destructive
        loading={restoreReference.isPending}
        onCancel={() => setRestoreOpen(false)}
        onConfirm={() => void onRestore()}
      />
    </form>
  );
}
