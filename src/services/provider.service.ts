import { adminDataClient } from "@/lib/amplify/data-client";
import {
  formHasDefaults,
  normalizeProviderName,
  type ProviderDefaultsRecord,
  type ProviderFormValues,
  type ProviderRecord,
} from "@/features/providers/schemas/provider.schema";

function mapDefaultsRow(row: {
  id: string;
  providerId: string;
  recPercentGold?: string | null;
  recPercentSilver?: string | null;
  rcGold?: string | null;
  rcSilver?: string | null;
  consumos?: string | null;
  flete?: string | null;
  interGold?: string | null;
  interSilver?: string | null;
  factor?: string | null;
}): ProviderDefaultsRecord {
  return {
    id: row.id,
    providerId: row.providerId,
    recPercentGold: row.recPercentGold ?? null,
    recPercentSilver: row.recPercentSilver ?? null,
    rcGold: row.rcGold ?? null,
    rcSilver: row.rcSilver ?? null,
    consumos: row.consumos ?? null,
    flete: row.flete ?? null,
    interGold: row.interGold ?? null,
    interSilver: row.interSilver ?? null,
    factor: row.factor ?? null,
  };
}

function mapProviderRow(
  row: {
    id: string;
    name: string;
    sortOrder?: number | null;
    isActive?: boolean | null;
    notes?: string | null;
    metadataJson?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  },
  defaults: ProviderDefaultsRecord | null
): ProviderRecord {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder ?? null,
    isActive: row.isActive ?? true,
    notes: row.notes ?? null,
    metadataJson: row.metadataJson ?? null,
    defaults,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function trimOrNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function defaultsPayload(values: ProviderFormValues) {
  return {
    recPercentGold: trimOrNull(values.recPercentGold),
    recPercentSilver: trimOrNull(values.recPercentSilver),
    rcGold: trimOrNull(values.rcGold),
    rcSilver: trimOrNull(values.rcSilver),
    consumos: trimOrNull(values.consumos),
    flete: trimOrNull(values.flete),
    interGold: trimOrNull(values.interGold),
    interSilver: trimOrNull(values.interSilver),
    factor: trimOrNull(values.factor),
  };
}

async function findDefaultsByProviderId(providerId: string): Promise<ProviderDefaultsRecord | null> {
  const { data, errors } = await adminDataClient.models.ProviderDefaults.list({
    filter: { providerId: { eq: providerId } },
    limit: 1,
  });
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  const row = data?.[0];
  return row ? mapDefaultsRow(row) : null;
}

async function assertUniqueName(name: string, excludeId?: string): Promise<void> {
  const normalized = normalizeProviderName(name).toLowerCase();
  const { data, errors } = await adminDataClient.models.Provider.list({ limit: 200 });
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  const duplicate = (data ?? []).find(
    (row) => row.id !== excludeId && normalizeProviderName(row.name).toLowerCase() === normalized
  );
  if (duplicate) {
    throw new Error(`Ya existe un proveedor con el nombre "${duplicate.name}"`);
  }
}

async function syncProviderDefaults(providerId: string, values: ProviderFormValues): Promise<ProviderDefaultsRecord | null> {
  const existing = await findDefaultsByProviderId(providerId);
  const hasDefaults = formHasDefaults(values);

  if (!hasDefaults) {
    if (existing) {
      const { errors } = await adminDataClient.models.ProviderDefaults.delete({ id: existing.id });
      if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
    }
    return null;
  }

  const payload = defaultsPayload(values);

  if (existing) {
    const { data, errors } = await adminDataClient.models.ProviderDefaults.update({
      id: existing.id,
      ...payload,
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
    if (!data) throw new Error("No se pudieron guardar los defaults del proveedor");
    return mapDefaultsRow(data);
  }

  const { data, errors } = await adminDataClient.models.ProviderDefaults.create({
    providerId,
    ...payload,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudieron crear los defaults del proveedor");
  return mapDefaultsRow(data);
}

export async function listProviders(): Promise<ProviderRecord[]> {
  const [providersResult, defaultsResult] = await Promise.all([
    adminDataClient.models.Provider.list({ limit: 200 }),
    adminDataClient.models.ProviderDefaults.list({ limit: 500 }),
  ]);

  if (providersResult.errors?.length) {
    throw new Error(providersResult.errors.map((e) => e.message).join("; "));
  }
  if (defaultsResult.errors?.length) {
    throw new Error(defaultsResult.errors.map((e) => e.message).join("; "));
  }

  const defaultsByProvider = new Map<string, ProviderDefaultsRecord>();
  for (const row of defaultsResult.data ?? []) {
    defaultsByProvider.set(row.providerId, mapDefaultsRow(row));
  }

  const rows = (providersResult.data ?? []).map((row) =>
    mapProviderRow(row, defaultsByProvider.get(row.id) ?? null)
  );

  return rows.sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, "es")
  );
}

export async function createProvider(values: ProviderFormValues): Promise<ProviderRecord> {
  const name = normalizeProviderName(values.name);
  await assertUniqueName(name);

  const { data, errors } = await adminDataClient.models.Provider.create({
    name,
    sortOrder: values.sortOrder ?? 0,
    isActive: values.isActive,
    notes: values.notes?.trim() || undefined,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo crear el proveedor");

  const defaults = await syncProviderDefaults(data.id, values);
  return mapProviderRow(data, defaults);
}

export async function updateProvider(id: string, values: ProviderFormValues): Promise<ProviderRecord> {
  const name = normalizeProviderName(values.name);
  await assertUniqueName(name, id);

  const { data, errors } = await adminDataClient.models.Provider.update({
    id,
    name,
    sortOrder: values.sortOrder ?? 0,
    isActive: values.isActive,
    notes: values.notes?.trim() || null,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo actualizar el proveedor");

  const defaults = await syncProviderDefaults(id, values);
  return mapProviderRow(data, defaults);
}

export async function setProviderActive(id: string, isActive: boolean): Promise<ProviderRecord> {
  const { data, errors } = await adminDataClient.models.Provider.update({ id, isActive });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo cambiar el estado");

  const defaults = await findDefaultsByProviderId(id);
  return mapProviderRow(data, defaults);
}
