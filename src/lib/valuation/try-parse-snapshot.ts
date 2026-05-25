import type { ValuationSnapshot } from "@/lib/valuation/snapshot-types";

/** Parseo seguro: null si el JSON está corrupto o incompleto. */
export function tryParseSnapshot(json: string): ValuationSnapshot | null {
  try {
    const parsed = JSON.parse(json) as ValuationSnapshot;
    if (!parsed?.results?.scenarios?.length) return null;
    if (!parsed.lot) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getActiveScenarioIndex(snapshot: ValuationSnapshot): number {
  const count = snapshot.scenarios.length;
  if (count <= 0) return 0;
  const idx = snapshot.activeScenarioIndex ?? 0;
  return Math.min(Math.max(0, idx), count - 1);
}

export function getActiveScenarioResult(snapshot: ValuationSnapshot) {
  const idx = getActiveScenarioIndex(snapshot);
  const label = snapshot.scenarios[idx]?.label;
  return (
    snapshot.results.scenarios.find((s) => s.label === label) ??
    snapshot.results.scenarios[0] ??
    null
  );
}

export function getPrimaryTotals(snapshot: ValuationSnapshot | null): {
  valorCompraTotal: string | null;
  tms: string | null;
} {
  if (!snapshot) return { valorCompraTotal: null, tms: null };
  const scenario = getActiveScenarioResult(snapshot);
  return {
    valorCompraTotal: scenario?.valorCompraTotal ?? null,
    tms: snapshot.results.tms ?? null,
  };
}
