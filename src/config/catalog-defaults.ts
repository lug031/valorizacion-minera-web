/**
 * Catálogos maestros iniciales (alineados al móvil y a la tabla de referencia de sync).
 * Usar al cargar datos en entornos vacíos o como documentación de valores de piloto.
 */

export const DEFAULT_MATERIAL_TYPES = [
  { code: "MOC", label: "Mineral Oxido Crudo", sortOrder: 1 },
  { code: "MSC", label: "Mineral Sulfuro Crudo", sortOrder: 2 },
  { code: "MOLL", label: "Mineral Oxido Llampo", sortOrder: 3 },
  { code: "MSLL", label: "Mineral Sulfuro LLampo", sortOrder: 4 },
] as const;

export const DEFAULT_MAQUILA_RANGES = [
  { minLeyOzTc: "0.200", maxLeyOzTc: "0.300", maquila: "90", sortOrder: 1 },
  { minLeyOzTc: "0.301", maxLeyOzTc: "0.400", maquila: "95", sortOrder: 2 },
  { minLeyOzTc: "0.401", maxLeyOzTc: "0.500", maquila: "110", sortOrder: 3 },
  { minLeyOzTc: "0.501", maxLeyOzTc: "0.600", maquila: "115", sortOrder: 4 },
  { minLeyOzTc: "0.601", maxLeyOzTc: "0.700", maquila: "120", sortOrder: 5 },
  { minLeyOzTc: "0.701", maxLeyOzTc: "0.800", maquila: "125", sortOrder: 6 },
  { minLeyOzTc: "0.801", maxLeyOzTc: "0.900", maquila: "130", sortOrder: 7 },
  { minLeyOzTc: "0.901", maxLeyOzTc: "1.000", maquila: "135", sortOrder: 8 },
  { minLeyOzTc: "1.001", maxLeyOzTc: "1.100", maquila: "140", sortOrder: 9 },
  { minLeyOzTc: "1.101", maxLeyOzTc: "1.200", maquila: "145", sortOrder: 10 },
  { minLeyOzTc: "1.201", maxLeyOzTc: "1.300", maquila: "150", sortOrder: 11 },
  { minLeyOzTc: "1.301", maxLeyOzTc: "1.400", maquila: "155", sortOrder: 12 },
  { minLeyOzTc: "1.401", maxLeyOzTc: "1.500", maquila: "160", sortOrder: 13 },
  { minLeyOzTc: "1.501", maxLeyOzTc: "1.600", maquila: "165", sortOrder: 14 },
  { minLeyOzTc: "1.601", maxLeyOzTc: "1.700", maquila: "170", sortOrder: 15 },
  { minLeyOzTc: "1.701", maxLeyOzTc: "1.800", maquila: "175", sortOrder: 16 },
  { minLeyOzTc: "1.801", maxLeyOzTc: "1.900", maquila: "180", sortOrder: 17 },
  { minLeyOzTc: "1.901", maxLeyOzTc: "2.000", maquila: "190", sortOrder: 18 },
] as const;
