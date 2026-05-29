import { INTER_SOURCE_LABELS } from "@/config/commercial-defaults";
import type { AppSettingsRecord } from "@/features/app-settings/schemas/app-settings.schema";

export function interSourceLabel(source: string | null | undefined): string {
  if (!source) return "Sin registrar";
  return INTER_SOURCE_LABELS[source] ?? source;
}

export function formatInterFetchedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

export function interFetchStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "ok":
      return "Actualización exitosa";
    case "partial":
      return "Actualización parcial";
    case "failed":
      return "Falló la última actualización automática";
    default:
      return "Sin actualización automática registrada";
  }
}

export function buildInterMetadataSummary(settings: AppSettingsRecord) {
  return {
    goldSource: interSourceLabel(settings.interGoldSource),
    silverSource: interSourceLabel(settings.interSilverSource),
    goldFetchedAt: formatInterFetchedAt(settings.interGoldFetchedAt),
    silverFetchedAt: formatInterFetchedAt(settings.interSilverFetchedAt),
    statusLabel: interFetchStatusLabel(settings.interFetchStatus),
    lastError: settings.interFetchError,
  };
}
