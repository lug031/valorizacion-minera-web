import { adminDataClient } from "@/lib/amplify/data-client";
import { assertActiveMaquilaNoOverlap } from "@/lib/maquila/validate-overlap";
import type { MaquilaRangeRecord } from "@/features/maquila/schemas/maquila-range.schema";
import type { MaquilaRangeFormValues } from "@/features/maquila/schemas/maquila-range.schema";

function mapRow(row: {
  id: string;
  minLeyOzTc: string;
  maxLeyOzTc: string;
  maquila: string;
  sortOrder?: number | null;
  isActive?: boolean | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}): MaquilaRangeRecord {
  return {
    id: row.id,
    minLeyOzTc: row.minLeyOzTc,
    maxLeyOzTc: row.maxLeyOzTc,
    maquila: row.maquila,
    sortOrder: row.sortOrder ?? null,
    isActive: row.isActive ?? true,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listMaquilaRanges(): Promise<MaquilaRangeRecord[]> {
  const { data, errors } = await adminDataClient.models.MaquilaRange.list({
    limit: 200,
  });
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  const rows = (data ?? []).map(mapRow);
  return rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export async function createMaquilaRange(values: MaquilaRangeFormValues) {
  const existing = await listMaquilaRanges();
  assertActiveMaquilaNoOverlap(values, existing);
  const { data, errors } = await adminDataClient.models.MaquilaRange.create({
    minLeyOzTc: values.minLeyOzTc,
    maxLeyOzTc: values.maxLeyOzTc,
    maquila: values.maquila,
    sortOrder: values.sortOrder ?? 0,
    isActive: values.isActive,
    notes: values.notes?.trim() || undefined,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo crear el rango");
  return mapRow(data);
}

export async function updateMaquilaRange(id: string, values: MaquilaRangeFormValues) {
  const existing = await listMaquilaRanges();
  assertActiveMaquilaNoOverlap(values, existing, id);
  const { data, errors } = await adminDataClient.models.MaquilaRange.update({
    id,
    minLeyOzTc: values.minLeyOzTc,
    maxLeyOzTc: values.maxLeyOzTc,
    maquila: values.maquila,
    sortOrder: values.sortOrder ?? 0,
    isActive: values.isActive,
    notes: values.notes?.trim() || null,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo actualizar el rango");
  return mapRow(data);
}

export async function deleteMaquilaRange(id: string): Promise<void> {
  const { errors } = await adminDataClient.models.MaquilaRange.delete({ id });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
}

export async function setMaquilaRangeActive(id: string, isActive: boolean) {
  if (isActive) {
    const existing = await listMaquilaRanges();
    const row = existing.find((r) => r.id === id);
    if (row) {
      assertActiveMaquilaNoOverlap(
        {
          minLeyOzTc: row.minLeyOzTc,
          maxLeyOzTc: row.maxLeyOzTc,
          maquila: row.maquila,
          sortOrder: row.sortOrder ?? 0,
          isActive: true,
          notes: row.notes ?? undefined,
        },
        existing,
        id
      );
    }
  }
  const { data, errors } = await adminDataClient.models.MaquilaRange.update({ id, isActive });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo cambiar el estado");
  return mapRow(data);
}
