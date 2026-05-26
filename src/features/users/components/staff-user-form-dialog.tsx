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
  createStaffUserSchema,
  recordToUpdateFormValues,
  STAFF_ROLE_OPTIONS,
  updateStaffUserSchema,
  type CreateStaffUserFormInput,
  type CreateStaffUserFormValues,
  type StaffUserRecord,
  type UpdateStaffUserFormInput,
  type UpdateStaffUserFormValues,
} from "@/features/users/schemas/staff-user.schema";

interface Props {
  open: boolean;
  initial?: StaffUserRecord | null;
  readOnly?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmitCreate: (values: CreateStaffUserFormValues) => void;
  onSubmitUpdate: (values: UpdateStaffUserFormValues) => void;
}

const emptyCreate: CreateStaffUserFormInput = {
  email: "",
  displayName: "",
  role: "supervisor",
  notes: "",
  temporaryPassword: "",
  isActive: true,
};

export function StaffUserFormDialog({
  open,
  initial,
  readOnly = false,
  saving = false,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: Props) {
  const isEditing = Boolean(initial);

  const createForm = useForm<CreateStaffUserFormInput, unknown, CreateStaffUserFormValues>({
    resolver: zodResolver(createStaffUserSchema),
    defaultValues: emptyCreate,
  });

  const updateForm = useForm<UpdateStaffUserFormInput, unknown, UpdateStaffUserFormValues>({
    resolver: zodResolver(updateStaffUserSchema),
    defaultValues: recordToUpdateFormValues(
      initial ?? {
        id: "",
        cognitoSub: "",
        username: "",
        email: null,
        displayName: "",
        role: "supervisor",
        isActive: true,
        notes: null,
        cognitoEnabled: null,
        accessStatus: null,
        createdAt: null,
        updatedAt: null,
      }
    ),
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      updateForm.reset(recordToUpdateFormValues(initial));
    } else {
      createForm.reset(emptyCreate);
    }
  }, [open, initial, createForm, updateForm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border bg-background shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-primary">
            {readOnly ? "Ver usuario" : isEditing ? "Editar usuario" : "Nuevo usuario"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Usuarios con acceso al panel administrativo. La contraseña temporal solo se muestra al crear.
          </p>
        </div>

        {isEditing ? (
          <form
            onSubmit={updateForm.handleSubmit(onSubmitUpdate)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="space-y-4 overflow-y-auto px-6 py-5">
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input value={initial?.email ?? initial?.username ?? ""} disabled />
                <p className="text-xs text-muted-foreground">El correo no se puede modificar después de crear el usuario.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre visible</Label>
                <Input id="displayName" disabled={readOnly} {...updateForm.register("displayName")} />
                {updateForm.formState.errors.displayName ? (
                  <p className="text-xs text-destructive">
                    {updateForm.formState.errors.displayName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  disabled={readOnly}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...updateForm.register("role")}
                >
                  {STAFF_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea id="notes" disabled={readOnly} rows={2} {...updateForm.register("notes")} />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={updateForm.watch("isActive")}
                  disabled={readOnly}
                  onCheckedChange={(v) => updateForm.setValue("isActive", v)}
                />
                <Label>Usuario activo</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {readOnly ? "Cerrar" : "Cancelar"}
              </Button>
              {!readOnly ? (
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando…" : "Actualizar"}
                </Button>
              ) : null}
            </div>
          </form>
        ) : (
          <form
            onSubmit={createForm.handleSubmit(onSubmitCreate)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="space-y-4 overflow-y-auto px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  disabled={readOnly}
                  placeholder="usuario@empresa.com"
                  {...createForm.register("email")}
                />
                {createForm.formState.errors.email ? (
                  <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre visible</Label>
                <Input id="displayName" disabled={readOnly} {...createForm.register("displayName")} />
                {createForm.formState.errors.displayName ? (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.displayName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  disabled={readOnly}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...createForm.register("role")}
                >
                  {STAFF_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="temporaryPassword">Contraseña temporal (opcional)</Label>
                <Input
                  id="temporaryPassword"
                  type="password"
                  disabled={readOnly}
                  placeholder="Se genera automáticamente si se deja vacío"
                  {...createForm.register("temporaryPassword")}
                />
                {createForm.formState.errors.temporaryPassword ? (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.temporaryPassword.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea id="notes" disabled={readOnly} rows={2} {...createForm.register("notes")} />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={createForm.watch("isActive")}
                  disabled={readOnly}
                  onCheckedChange={(v) => createForm.setValue("isActive", v)}
                />
                <Label>Usuario activo</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              {!readOnly ? (
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando…" : "Crear usuario"}
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
