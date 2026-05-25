import { adminDataClient } from "@/lib/amplify/data-client";
import type {
  CreateStaffUserFormValues,
  StaffUserRecord,
  UpdateStaffUserFormValues,
} from "@/features/users/schemas/staff-user.schema";

function mapStaffUser(row: {
  id: string;
  cognitoSub: string;
  username: string;
  email?: string | null;
  displayName?: string | null;
  role?: "admin" | "supervisor" | null;
  isActive?: boolean | null;
  notes?: string | null;
  cognitoEnabled?: boolean | null;
  accessStatus?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  temporaryPassword?: string | null;
}): StaffUserRecord {
  return {
    id: row.id,
    cognitoSub: row.cognitoSub,
    username: row.username,
    email: row.email ?? null,
    displayName: row.displayName ?? null,
    role: row.role ?? null,
    isActive: row.isActive ?? true,
    notes: row.notes ?? null,
    cognitoEnabled: row.cognitoEnabled ?? null,
    accessStatus: row.accessStatus ?? null,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
    temporaryPassword: row.temporaryPassword ?? null,
  };
}

export async function listStaffUsers(): Promise<StaffUserRecord[]> {
  const { data, errors } = await adminDataClient.queries.listStaffUsers();
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  return (data ?? []).filter((row): row is NonNullable<typeof row> => row != null).map(mapStaffUser);
}

export async function createStaffUser(values: CreateStaffUserFormValues): Promise<StaffUserRecord> {
  const { data, errors } = await adminDataClient.mutations.createStaffUser({
    email: values.email.trim().toLowerCase(),
    displayName: values.displayName.trim(),
    role: values.role,
    notes: values.notes?.trim() || undefined,
    temporaryPassword: values.temporaryPassword?.trim() || undefined,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo crear el usuario");
  return mapStaffUser(data);
}

export async function updateStaffUser(
  id: string,
  values: UpdateStaffUserFormValues
): Promise<StaffUserRecord> {
  const { data, errors } = await adminDataClient.mutations.updateStaffUser({
    id,
    displayName: values.displayName.trim(),
    role: values.role,
    notes: values.notes?.trim() || undefined,
    isActive: values.isActive,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo actualizar el usuario");
  return mapStaffUser(data);
}
