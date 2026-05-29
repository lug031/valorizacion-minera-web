import { z } from "zod";
import { requiredNonNegativeNumeric, requiredPercentNumeric } from "@/lib/validators/numeric";

export const appSettingsFormSchema = z.object({
  factor: requiredNonNegativeNumeric,
  defaultRecPercentGold: requiredPercentNumeric,
  defaultRecPercentSilver: requiredPercentNumeric,
  defaultRcGold: requiredNonNegativeNumeric,
  defaultRcSilver: requiredNonNegativeNumeric,
  defaultConsumos: requiredNonNegativeNumeric,
  defaultFlete: requiredNonNegativeNumeric,
  defaultInterGold: requiredNonNegativeNumeric,
  defaultInterSilver: requiredNonNegativeNumeric,
});

export type AppSettingsFormValues = z.infer<typeof appSettingsFormSchema>;

export type InterFetchStatus = "ok" | "failed" | "partial";

export interface AppSettingsRecord {
  id: string;
  settingsKey: string;
  factor: string;
  defaultRecPercentGold: string | null;
  defaultRecPercentSilver: string | null;
  defaultRcGold: string | null;
  defaultRcSilver: string | null;
  defaultConsumos: string | null;
  defaultFlete: string | null;
  defaultInterGold: string | null;
  defaultInterSilver: string | null;
  interGoldSource: string | null;
  interSilverSource: string | null;
  interGoldFetchedAt: string | null;
  interSilverFetchedAt: string | null;
  interFetchStatus: InterFetchStatus | string | null;
  interFetchError: string | null;
  updatedAt?: string | null;
}

export function recordToFormValues(record: AppSettingsRecord): AppSettingsFormValues {
  return {
    factor: record.factor,
    defaultRecPercentGold: record.defaultRecPercentGold ?? "0",
    defaultRecPercentSilver: record.defaultRecPercentSilver ?? "0",
    defaultRcGold: record.defaultRcGold ?? "0",
    defaultRcSilver: record.defaultRcSilver ?? "0",
    defaultConsumos: record.defaultConsumos ?? "0",
    defaultFlete: record.defaultFlete ?? "0",
    defaultInterGold: record.defaultInterGold ?? "0",
    defaultInterSilver: record.defaultInterSilver ?? "0",
  };
}
