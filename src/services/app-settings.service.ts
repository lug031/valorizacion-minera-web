import { adminDataClient } from "@/lib/amplify/data-client";
import {
  MASTER_APP_SETTINGS_KEY,
  REFERENCE_COMMERCIAL_DEFAULTS,
} from "@/config/commercial-defaults";
import type {
  AppSettingsFormValues,
  AppSettingsRecord,
} from "@/features/app-settings/schemas/app-settings.schema";
import type { InterSpotQuote } from "@/services/inter/inter-spot-types";

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
  interGoldSource?: string | null;
  interSilverSource?: string | null;
  interGoldFetchedAt?: string | null;
  interSilverFetchedAt?: string | null;
  interFetchStatus?: string | null;
  interFetchError?: string | null;
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
    interGoldSource: row.interGoldSource ?? null,
    interSilverSource: row.interSilverSource ?? null,
    interGoldFetchedAt: row.interGoldFetchedAt ?? null,
    interSilverFetchedAt: row.interSilverFetchedAt ?? null,
    interFetchStatus: row.interFetchStatus ?? null,
    interFetchError: row.interFetchError ?? null,
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

function truncateError(message: string, max = 500): string {
  return message.length > max ? `${message.slice(0, max - 1)}…` : message;
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

/** Registra fallo de obtención sin modificar los valores INTER vigentes. */
export async function recordInterFetchFailure(errorMessage: string): Promise<AppSettingsRecord> {
  const current = await getMasterAppSettings();
  const { data, errors } = await adminDataClient.models.AppSettings.update({
    id: current.id,
    interFetchStatus: "failed",
    interFetchError: truncateError(errorMessage),
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo registrar el error de actualización INTER");
  return mapRow(data);
}

/** Aplica cotización de mercado confirmada por el administrador. */
export async function applyInterSpotQuote(quote: InterSpotQuote): Promise<AppSettingsRecord> {
  const current = await getMasterAppSettings();
  const fetchedAt = quote.providerFetchedAt;

  const { data, errors } = await adminDataClient.models.AppSettings.update({
    id: current.id,
    defaultInterGold: quote.goldUsPerOz,
    defaultInterSilver: quote.silverUsPerOz,
    interGoldSource: quote.source,
    interSilverSource: quote.source,
    interGoldFetchedAt: fetchedAt,
    interSilverFetchedAt: fetchedAt,
    interFetchStatus: "ok",
    interFetchError: "",
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo guardar INTER desde la fuente externa");
  return mapRow(data);
}
