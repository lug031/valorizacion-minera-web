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
  createFieldUserSchema,
  FIELD_ROLE_OPTIONS,
  recordToUpdateFormValues,
  updateFieldUserSchema,
  type CreateFieldUserFormInput,
  type CreateFieldUserFormValues,
  type FieldUserRecord,
  type UpdateFieldUserFormInput,
  type UpdateFieldUserFormValues,
} from "@/features/field-users/schemas/field-user.schema";

interface Props {
  open: boolean;
  initial?: FieldUserRecord | null;
  defaultCreateRole?: "admin" | "operador";
  readOnly?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmitCreate: (values: CreateFieldUserFormValues) => void;
  onSubmitUpdate: (values: UpdateFieldUserFormValues) => void;
}

const emptyCreate = (role: "admin" | "operador"): CreateFieldUserFormInput => ({
  username: "",
  displayName: "",
  role,
  notes: "",
  initialPassword: "",
  isActive: true,
});

export function FieldUserFormDialog({
  open,
  initial,
  defaultCreateRole = "operador",
  readOnly = false,
  saving = false,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: Props) {
  const isEditing = Boolean(initial);

  const createForm = useForm<CreateFieldUserFormInput, unknown, CreateFieldUserFormValues>({
    resolver: zodResolver(createFieldUserSchema),
    defaultValues: emptyCreate(defaultCreateRole),
  });

  const createRole = createForm.watch("role");

  const updateForm = useForm<UpdateFieldUserFormInput, unknown, UpdateFieldUserFormValues>({
    resolver: zodResolver(updateFieldUserSchema),
    defaultValues: recordToUpdateFormValues(
      initial ?? {
        id: "",
        username: "",
        displayName: "",
        role: "operador",
        isActive: true,
        notes: null,
        metadataJson: null,
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
      createForm.reset(emptyCreate(defaultCreateRole));
    }
  }, [open, initial, defaultCreateRole, createForm, updateForm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">
          {isEditing
            ? readOnly
              ? "Ver usuario de campo"
              : "Editar usuario de campo"
            : "Nuevo usuario de campo"}
        </h2>
        {!isEditing ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {createRole === "admin"
              ? "Administrador móvil: puede actualizar usuarios y configuración en la app (hasta 2 teléfonos)."
              : "Operador de campo: ingresa en la app para trabajar en campo (1 teléfono)."}
          </p>
        ) : null}

        {isEditing ? (
          <form
            className="mt-4 space-y-4"
            onSubmit={updateForm.handleSubmit((values) => onSubmitUpdate(values))}
          >
            <div>
              <Label>Usuario de acceso</Label>
              <Input value={initial?.username ?? ""} disabled className="mt-1" />
            </div>
            <div>
              <Label htmlFor="field-displayName">Nombre visible</Label>
              <Input
                id="field-displayName"
                disabled={readOnly}
                className="mt-1"
                {...updateForm.register("displayName")}
              />
              {updateForm.formState.errors.displayName ? (
                <p className="mt-1 text-sm text-destructive">
                  {updateForm.formState.errors.displayName.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="field-role">Rol operativo</Label>
              <select
                id="field-role"
                disabled={readOnly}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...updateForm.register("role")}
              >
                {FIELD_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="field-notes">Observaciones</Label>
              <Textarea
                id="field-notes"
                disabled={readOnly}
                className="mt-1"
                rows={3}
                {...updateForm.register("notes")}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={updateForm.watch("isActive")}
                disabled={readOnly}
                onCheckedChange={(v) => updateForm.setValue("isActive", v)}
              />
              <Label>Usuario activo</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              {!readOnly ? (
                <Button type="submit" disabled={saving}>
                  Guardar
                </Button>
              ) : null}
            </div>
          </form>
        ) : (
          <form
            className="mt-4 space-y-4"
            onSubmit={createForm.handleSubmit((values) => onSubmitCreate(values))}
          >
            <div>
              <Label htmlFor="field-username">Usuario de acceso</Label>
              <Input
                id="field-username"
                className="mt-1"
                autoComplete="off"
                placeholder={createRole === "admin" ? "ej. admin.campo" : "ej. jperez"}
                {...createForm.register("username")}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                No use su correo de administración. Solo letras, números, punto, guion y guion bajo.
              </p>
              {createForm.formState.errors.username ? (
                <p className="mt-1 text-sm text-destructive">
                  {createForm.formState.errors.username.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="field-create-displayName">Nombre visible</Label>
              <Input id="field-create-displayName" className="mt-1" {...createForm.register("displayName")} />
              {createForm.formState.errors.displayName ? (
                <p className="mt-1 text-sm text-destructive">
                  {createForm.formState.errors.displayName.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="field-create-role">Rol operativo</Label>
              <select
                id="field-create-role"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...createForm.register("role")}
              >
                {FIELD_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                El administrador gestiona usuarios en la app; el operador solo cotiza en campo.
              </p>
            </div>
            <div>
              <Label htmlFor="field-create-notes">Observaciones</Label>
              <Textarea id="field-create-notes" className="mt-1" rows={3} {...createForm.register("notes")} />
            </div>
            <div>
              <Label htmlFor="field-initialPassword">Contraseña inicial (opcional)</Label>
              <Input
                id="field-initialPassword"
                type="text"
                className="mt-1"
                autoComplete="new-password"
                placeholder="Se genera automáticamente si se deja vacío"
                {...createForm.register("initialPassword")}
              />
              {createForm.formState.errors.initialPassword ? (
                <p className="mt-1 text-sm text-destructive">
                  {createForm.formState.errors.initialPassword.message}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                Crear usuario
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
