import { adminDataClient } from "@/lib/amplify/data-client";
import {
  MASTER_APP_SETTINGS_KEY,
  REFERENCE_COMMERCIAL_DEFAULTS,
} from "@/config/commercial-defaults";
import type {
  AppSettingsFormValues,
  AppSettingsRecord,
} from "@/features/app-settings/schemas/app-settings.schema";

function mapRow(row: {
  id: string;
  settingsKey: string;
  factor: string;
  defaultConsumos?: string | null;
  defaultFlete?: string | null;
  defaultRcGold?: string | null;
  defaultRcSilver?: string | null;
  defaultRecPercentGold?: string | null;
  defaultRecPercentSilver?: string | null;
  defaultInterGold?: string | null;
  defaultInterSilver?: string | null;
  updatedAt?: string | null;
}): AppSettingsRecord {
  return {
    id: row.id,
    settingsKey: row.settingsKey,
    factor: row.factor,
    defaultConsumos: row.defaultConsumos ?? null,
    defaultFlete: row.defaultFlete ?? null,
    defaultRcGold: row.defaultRcGold ?? null,
    defaultRcSilver: row.defaultRcSilver ?? null,
    defaultRecPercentGold: row.defaultRecPercentGold ?? null,
    defaultRecPercentSilver: row.defaultRecPercentSilver ?? null,
    defaultInterGold: row.defaultInterGold ?? null,
    defaultInterSilver: row.defaultInterSilver ?? null,
    updatedAt: row.updatedAt,
  };
}

function formToPayload(values: AppSettingsFormValues) {
  return {
    factor: values.factor,
    defaultRecPercentGold: values.defaultRecPercentGold,
    defaultRecPercentSilver: values.defaultRecPercentSilver,
    defaultRcGold: values.defaultRcGold,
    defaultRcSilver: values.defaultRcSilver,
    defaultConsumos: values.defaultConsumos,
    defaultFlete: values.defaultFlete,
    defaultInterGold: values.defaultInterGold,
    defaultInterSilver: values.defaultInterSilver,
  };
}

async function findMasterRow(): Promise<AppSettingsRecord | null> {
  const { data, errors } = await adminDataClient.models.AppSettings.list({
    filter: { settingsKey: { eq: MASTER_APP_SETTINGS_KEY } },
    limit: 1,
  });
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  const row = data?.[0];
  return row ? mapRow(row) : null;
}

/** Obtiene la configuración maestra; la crea con defaults de referencia si no existe. */
export async function getMasterAppSettings(): Promise<AppSettingsRecord> {
  const existing = await findMasterRow();
  if (existing) return existing;

  const { data, errors } = await adminDataClient.models.AppSettings.create({
    settingsKey: MASTER_APP_SETTINGS_KEY,
    ...REFERENCE_COMMERCIAL_DEFAULTS,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo inicializar la configuración maestra");
  return mapRow(data);
}

export async function updateMasterAppSettings(values: AppSettingsFormValues): Promise<AppSettingsRecord> {
  const current = await getMasterAppSettings();
  const { data, errors } = await adminDataClient.models.AppSettings.update({
    id: current.id,
    ...formToPayload(values),
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo guardar la configuración");
  return mapRow(data);
}

export async function restoreReferenceAppSettings(): Promise<AppSettingsRecord> {
  const current = await getMasterAppSettings();
  const { data, errors } = await adminDataClient.models.AppSettings.update({
    id: current.id,
    ...REFERENCE_COMMERCIAL_DEFAULTS,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo restaurar la configuración");
  return mapRow(data);
}
