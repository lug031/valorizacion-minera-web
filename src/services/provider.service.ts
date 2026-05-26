import { adminDataClient } from "@/lib/amplify/data-client";
import { LIST_PAGE_SIZE } from "@/lib/pagination/constants";
import {
  formHasDefaults,
  normalizeProviderName,
  type ProviderDefaultsRecord,
  type ProviderFormValues,
  type ProviderRecord,
} from "@/features/providers/schemas/provider.schema";

export interface ProviderListPage {
  items: ProviderRecord[];
  nextToken: string | null;
}

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

async function loadDefaultsMap(): Promise<Map<string, ProviderDefaultsRecord>> {
  const { data, errors } = await adminDataClient.models.ProviderDefaults.list({ limit: 500 });
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  const map = new Map<string, ProviderDefaultsRecord>();
  for (const row of data ?? []) {
    map.set(row.providerId, mapDefaultsRow(row));
  }
  return map;
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
  let nextToken: string | undefined;
  do {
    const { data, errors, nextToken: token } = await adminDataClient.models.Provider.list({
      limit: LIST_PAGE_SIZE,
      nextToken,
    });
    if (errors?.length) {
      throw new Error(errors.map((e) => e.message).join("; "));
    }
    const duplicate = (data ?? []).find(
      (row) => row.id !== excludeId && normalizeProviderName(row.name).toLowerCase() === normalized
    );
    if (duplicate) {
      throw new Error(`Ya existe un proveedor con el nombre "${duplicate.name}"`);
    }
    nextToken = token ?? undefined;
  } while (nextToken);
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

export async function listProvidersPage(nextToken?: string | null): Promise<ProviderListPage> {
  const [providersResult, defaultsByProvider] = await Promise.all([
    adminDataClient.models.Provider.list({
      limit: LIST_PAGE_SIZE,
      nextToken: nextToken ?? undefined,
    }),
    loadDefaultsMap(),
  ]);

  if (providersResult.errors?.length) {
    throw new Error(providersResult.errors.map((e) => e.message).join("; "));
  }

  const items = (providersResult.data ?? [])
    .map((row) => mapProviderRow(row, defaultsByProvider.get(row.id) ?? null))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, "es"));

  return { items, nextToken: providersResult.nextToken ?? null };
}

export async function listProviders(): Promise<ProviderRecord[]> {
  const all: ProviderRecord[] = [];
  let token: string | null = null;
  do {
    const page = await listProvidersPage(token);
    all.push(...page.items);
    token = page.nextToken;
  } while (token);
  return all;
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
