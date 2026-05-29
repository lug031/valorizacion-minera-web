/**
 * Valores de referencia alineados a COTIZADOR_DEFAULTS (app móvil).
 * Usados al crear la configuración maestra por primera vez o al restaurar.
 */
export const MASTER_APP_SETTINGS_KEY = "default";

export const REFERENCE_COMMERCIAL_DEFAULTS = {
  factor: "1.10231",
  defaultRecPercentGold: "84",
  defaultRecPercentSilver: "0",
  defaultRcGold: "80",
  defaultRcSilver: "0",
  defaultConsumos: "30.26",
  defaultFlete: "22",
  defaultInterGold: "3322.10",
  defaultInterSilver: "0",
  interGoldSource: "reference",
  interSilverSource: "reference",
  interGoldFetchedAt: null as string | null,
  interSilverFetchedAt: null as string | null,
  interFetchStatus: null as string | null,
  interFetchError: null as string | null,
} as const;

export const INTER_SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  reference: "Referencia del sistema",
  "minted-metal-lbma": "Minted Metal (LBMA spot)",
};
