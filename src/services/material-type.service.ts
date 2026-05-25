import { adminDataClient } from "@/lib/amplify/data-client";
import {
  normalizeMaterialTypeCode,
  type MaterialTypeFormValues,
  type MaterialTypeRecord,
} from "@/features/material-types/schemas/material-type.schema";

function mapRow(row: {
  id: string;
  code: string;
  label: string;
  sortOrder?: number | null;
  isActive?: boolean | null;
  notes?: string | null;
  metadataJson?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}): MaterialTypeRecord {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    sortOrder: row.sortOrder ?? null,
    isActive: row.isActive ?? true,
    notes: row.notes ?? null,
    metadataJson: row.metadataJson ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function assertUniqueCode(code: string, excludeId?: string): Promise<void> {
  const { data, errors } = await adminDataClient.models.MaterialType.list({
    filter: { code: { eq: code } },
    limit: 10,
  });
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  const duplicate = (data ?? []).find((row) => row.id !== excludeId);
  if (duplicate) {
    throw new Error(`Ya existe un tipo MAT con el código "${code}"`);
  }
}

export async function listMaterialTypes(): Promise<MaterialTypeRecord[]> {
  const { data, errors } = await adminDataClient.models.MaterialType.list({
    limit: 200,
  });
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  const rows = (data ?? []).map(mapRow);
  return rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.code.localeCompare(b.code));
}

export async function createMaterialType(values: MaterialTypeFormValues) {
  const code = normalizeMaterialTypeCode(values.code);
  await assertUniqueCode(code);

  const { data, errors } = await adminDataClient.models.MaterialType.create({
    code,
    label: values.label.trim(),
    sortOrder: values.sortOrder ?? 0,
    isActive: values.isActive,
    notes: values.notes?.trim() || undefined,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo crear el tipo MAT");
  return mapRow(data);
}

export async function updateMaterialType(id: string, values: MaterialTypeFormValues) {
  const code = normalizeMaterialTypeCode(values.code);
  await assertUniqueCode(code, id);

  const { data, errors } = await adminDataClient.models.MaterialType.update({
    id,
    code,
    label: values.label.trim(),
    sortOrder: values.sortOrder ?? 0,
    isActive: values.isActive,
    notes: values.notes?.trim() || null,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo actualizar el tipo MAT");
  return mapRow(data);
}

export async function setMaterialTypeActive(id: string, isActive: boolean) {
  const { data, errors } = await adminDataClient.models.MaterialType.update({ id, isActive });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo cambiar el estado");
  return mapRow(data);
}
