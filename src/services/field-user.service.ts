import { adminDataClient } from "@/lib/amplify/data-client";
import type {
  CreateFieldUserFormValues,
  FieldUserRecord,
  UpdateFieldUserFormValues,
} from "@/features/field-users/schemas/field-user.schema";

function mapFieldUser(row: {
  id: string;
  username: string;
  displayName?: string | null;
  role?: "admin" | "operador" | null;
  isActive?: boolean | null;
  notes?: string | null;
  metadataJson?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  initialPassword?: string | null;
}): FieldUserRecord {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName ?? null,
    role: row.role ?? null,
    isActive: row.isActive ?? true,
    notes: row.notes ?? null,
    metadataJson: row.metadataJson ?? null,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
    initialPassword: row.initialPassword ?? null,
  };
}

export async function listFieldUsers(): Promise<FieldUserRecord[]> {
  const { data, errors } = await adminDataClient.queries.listManagedFieldUsers();
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  return (data ?? []).filter((row): row is NonNullable<typeof row> => row != null).map(mapFieldUser);
}

export async function createFieldUser(values: CreateFieldUserFormValues): Promise<FieldUserRecord> {
  const { data, errors } = await adminDataClient.mutations.createManagedFieldUser({
    username: values.username.trim().toLowerCase(),
    displayName: values.displayName.trim(),
    role: values.role,
    notes: values.notes?.trim() || undefined,
    initialPassword: values.initialPassword?.trim() || undefined,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo crear el usuario de campo");
  return mapFieldUser(data);
}

export async function updateFieldUser(
  id: string,
  values: UpdateFieldUserFormValues
): Promise<FieldUserRecord> {
  const { data, errors } = await adminDataClient.mutations.updateManagedFieldUser({
    id,
    displayName: values.displayName.trim(),
    role: values.role,
    notes: values.notes?.trim() || undefined,
    isActive: values.isActive,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo actualizar el usuario de campo");
  return mapFieldUser(data);
}

export async function resetFieldUserPassword(id: string): Promise<FieldUserRecord> {
  const { data, errors } = await adminDataClient.mutations.resetManagedFieldUserPassword({ id });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo restablecer la contraseña");
  return mapFieldUser(data);
}
