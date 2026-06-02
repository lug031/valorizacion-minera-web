/** Mismo factor que la app móvil (gramos → oz/tc). */
const GRAMS_TO_OZ_FACTOR = 31.1034768;

export function normalizeGradeToOzTc(value: string | number, unit: string): number {
  const n = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;
  if (Number.isNaN(n)) return 0;
  return unit === "oz_tc" ? n : n / GRAMS_TO_OZ_FACTOR;
}
