import type { ValuationSnapshot } from "@/lib/valuation/snapshot-types";
import { formatMoney } from "@/lib/valuation/format";

export interface ExportScenarioOption {
  scenarioIndex: number;
  label: string;
  name: string;
  total: string;
}

export function buildExportScenarioOptionsFromSnapshot(
  snapshot: ValuationSnapshot
): ExportScenarioOption[] {
  return snapshot.scenarios.map((sc, index) => {
    const row =
      snapshot.results.scenarios.find((r) => r.label === sc.label) ??
      snapshot.results.scenarios[index];
    return {
      scenarioIndex: index,
      label: sc.label,
      name: sc.name,
      total: formatMoney(row?.valorCompraTotal ?? null),
    };
  });
}
