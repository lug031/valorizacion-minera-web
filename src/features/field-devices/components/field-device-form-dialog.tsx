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
  assignFieldDeviceSchema,
  recordToUpdateFormValues,
  updateFieldDeviceSchema,
  type AssignFieldDeviceFormInput,
  type AssignFieldDeviceFormValues,
  type FieldDeviceRecord,
  type UpdateFieldDeviceFormInput,
  type UpdateFieldDeviceFormValues,
} from "@/features/field-devices/schemas/field-device.schema";
import type { FieldUserRecord } from "@/features/field-users/schemas/field-user.schema";
import { fieldRoleLabel } from "@/features/field-users/schemas/field-user.schema";

interface Props {
  open: boolean;
  mode: "assign" | "edit";
  initial?: FieldDeviceRecord | null;
  fieldUsers: FieldUserRecord[];
  readOnly?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmitAssign: (values: AssignFieldDeviceFormValues) => void;
  onSubmitUpdate: (values: UpdateFieldDeviceFormValues) => void;
}

const emptyAssign: AssignFieldDeviceFormInput = {
  fieldUserId: "",
  deviceLabel: "",
  validUntil: "",
  validUntilTime: "",
  trialMode: false,
  notes: "",
};

export function FieldDeviceFormDialog({
  open,
  mode,
  initial,
  fieldUsers,
  readOnly = false,
  saving = false,
  onClose,
  onSubmitAssign,
  onSubmitUpdate,
}: Props) {
  const assignForm = useForm<AssignFieldDeviceFormInput, unknown, AssignFieldDeviceFormValues>({
    resolver: zodResolver(assignFieldDeviceSchema),
    defaultValues: emptyAssign,
  });

  const updateForm = useForm<UpdateFieldDeviceFormInput, unknown, UpdateFieldDeviceFormValues>({
    resolver: zodResolver(updateFieldDeviceSchema),
    defaultValues: {
      isBlocked: false,
      deviceLabel: "",
      validUntil: "",
      validUntilTime: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "assign") {
      assignForm.reset(emptyAssign);
    } else if (initial) {
      updateForm.reset(recordToUpdateFormValues(initial));
    }
  }, [open, mode, initial, assignForm, updateForm]);

  if (!open) return null;

  const activeUsers = fieldUsers.filter((u) => u.isActive !== false);
  const assignValidUntil = assignForm.watch("validUntil");
  const updateValidUntil = updateForm.watch("validUntil");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">
          {mode === "assign" ? "Asignar teléfono" : "Editar teléfono"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "assign"
            ? "Seleccione el operador y asigne su teléfono. Luego genere el código de activación."
            : "Puede suspender el teléfono o ajustar la fecha de validez."}
        </p>

        {mode === "assign" ? (
          <form
            className="mt-4 space-y-4"
            onSubmit={assignForm.handleSubmit(onSubmitAssign)}
          >
            <div className="space-y-2">
              <Label htmlFor="fieldUserId">Usuario de campo</Label>
              <select
                id="fieldUserId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={readOnly || saving}
                {...assignForm.register("fieldUserId")}
              >
                <option value="">Seleccione…</option>
                {activeUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.username}) — {fieldRoleLabel(user.role)}
                  </option>
                ))}
              </select>
              {assignForm.formState.errors.fieldUserId ? (
                <p className="text-sm text-destructive">
                  {assignForm.formState.errors.fieldUserId.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-deviceLabel">Nombre del teléfono (opcional)</Label>
              <Input
                id="assign-deviceLabel"
                placeholder="Ej. Samsung A54 — Juan"
                disabled={readOnly || saving}
                {...assignForm.register("deviceLabel")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-validUntil">Válido hasta (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Horario Perú (PET). Sin hora = hasta las 23:59 de ese día. La gracia offline del dispositivo es 1 día fijo.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  id="assign-validUntil"
                  type="date"
                  disabled={readOnly || saving}
                  {...assignForm.register("validUntil")}
                />
                <Input
                  id="assign-validUntilTime"
                  type="time"
                  placeholder="HH:MM"
                  disabled={readOnly || saving || !assignValidUntil?.trim()}
                  {...assignForm.register("validUntilTime")}
                />
              </div>
              {assignForm.formState.errors.validUntilTime ? (
                <p className="text-sm text-destructive">
                  {assignForm.formState.errors.validUntilTime.message}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="assign-trialMode">Modo prueba (límite 2 h de uso)</Label>
                <p className="text-xs text-muted-foreground">
                  Tras 2 h en primer plano se bloquea hasta un código de extensión generado por usted.
                </p>
              </div>
              <Switch
                id="assign-trialMode"
                checked={assignForm.watch("trialMode") === true}
                disabled={readOnly || saving}
                onCheckedChange={(v) => assignForm.setValue("trialMode", v)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-notes">Notas</Label>
              <Textarea
                id="assign-notes"
                rows={3}
                disabled={readOnly || saving}
                {...assignForm.register("notes")}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              {!readOnly ? (
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando…" : "Asignar"}
                </Button>
              ) : null}
            </div>
          </form>
        ) : (
          <form
            className="mt-4 space-y-4"
            onSubmit={updateForm.handleSubmit(onSubmitUpdate)}
          >
            {initial ? (
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Usuario:</span>{" "}
                  {initial.fieldUserDisplayName ?? initial.fieldUserUsername ?? "—"}
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">Estado:</span>{" "}
                  {initial.status === "pending"
                    ? "Pendiente de activación"
                    : initial.status === "enrolled"
                      ? "Activo"
                      : initial.status === "revoked"
                        ? "Retirado"
                        : (initial.status ?? "—")}
                </p>
                {initial.hasActiveActivationCode && initial.activationExpiresAt ? (
                  <p className="mt-1 text-amber-800">
                    Hay un código vigente hasta{" "}
                    {new Date(initial.activationExpiresAt).toLocaleString("es-PE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                    .
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="update-deviceLabel">Nombre del teléfono</Label>
              <Input
                id="update-deviceLabel"
                placeholder="Ej. Samsung A54 — Juan"
                disabled={readOnly || saving}
                {...updateForm.register("deviceLabel")}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="isBlocked">Suspendido</Label>
                <p className="text-xs text-muted-foreground">
                  El operador no podrá usar la app en este teléfono mientras esté suspendido.
                </p>
              </div>
              <Switch
                id="isBlocked"
                checked={updateForm.watch("isBlocked")}
                disabled={readOnly || saving}
                onCheckedChange={(v) => updateForm.setValue("isBlocked", v)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="update-validUntil">Válido hasta (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Horario Perú (PET). Sin hora = hasta las 23:59 de ese día.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  id="update-validUntil"
                  type="date"
                  disabled={readOnly || saving}
                  {...updateForm.register("validUntil")}
                />
                <Input
                  id="update-validUntilTime"
                  type="time"
                  placeholder="HH:MM"
                  disabled={readOnly || saving || !updateValidUntil?.trim()}
                  {...updateForm.register("validUntilTime")}
                />
              </div>
              {updateForm.formState.errors.validUntilTime ? (
                <p className="text-sm text-destructive">
                  {updateForm.formState.errors.validUntilTime.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="update-notes">Notas</Label>
              <Textarea
                id="update-notes"
                rows={3}
                disabled={readOnly || saving}
                {...updateForm.register("notes")}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              {!readOnly ? (
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
