import type { MaquilaRangeFormValues, MaquilaRangeRecord } from "@/features/maquila/schemas/maquila-range.schema";

function parseNum(value: string): number {
  return parseFloat(value.replace(",", "."));
}

function rangesOverlap(minA: number, maxA: number, minB: number, maxB: number): boolean {
  return minA <= maxB && minB <= maxA;
}

/**
 * Rangos activos no deben solaparse en ley oro (oz/tc).
 */
export function assertActiveMaquilaNoOverlap(
  values: MaquilaRangeFormValues,
  existing: MaquilaRangeRecord[],
  excludeId?: string
): void {
  if (!values.isActive) return;

  const min = parseNum(values.minLeyOzTc);
  const max = parseNum(values.maxLeyOzTc);

  for (const row of existing) {
    if (row.id === excludeId || row.isActive === false) continue;
    const rowMin = parseNum(row.minLeyOzTc);
    const rowMax = parseNum(row.maxLeyOzTc);
    if (rangesOverlap(min, max, rowMin, rowMax)) {
      throw new Error(
        `El rango se solapa con otro rango activo (${row.minLeyOzTc} – ${row.maxLeyOzTc} oz/tc). Ajuste los límites o desactive el rango existente.`
      );
    }
  }
}
