/** Tipos alineados al snapshot de la app móvil (solo lectura en web). */

export type FormulaVersion = string;
export type GradeUnit = string;
export type ScenarioLabel = string;

export interface LotInput {
  tmh: string;
  h2oPercent: string;
  goldGrade: string;
  goldGradeUnit: GradeUnit;
  silverGrade: string;
  silverGradeUnit: GradeUnit;
  recPercentGold: string;
  recPercentSilver: string;
}

export interface ScenarioCommercialParams {
  label: ScenarioLabel;
  name: string;
  maquila: string;
  rcGold: string;
  rcSilver: string;
  consumos: string;
  flete: string;
  interGold: string;
  interSilver: string;
  factor: string;
  otrosCostos?: string | null;
  recPercentGold?: string | null;
  recPercentSilver?: string | null;
}

export interface ScenarioCalculationResult {
  label: ScenarioLabel;
  name: string;
  valorAuPerTms: string;
  valorAgPerTms: string;
  valorFinalPerTms: string;
  valorCompraTotal: string;
  suggestedMaquila: string | null;
  maquilaUsed: string;
  recFactorGold: string;
  recFactorSilver: string;
}

export interface ValuationCalculationResult {
  formulaVersion: FormulaVersion;
  tms: string;
  leyGoldOzTc: string;
  leySilverOzTc: string;
  recPercentGold: string;
  recPercentSilver: string;
  recFactorGold: string;
  recFactorSilver: string;
  scenarios: ScenarioCalculationResult[];
}

export interface ValuationSnapshot {
  formulaVersion: FormulaVersion;
  lot: LotInput;
  scenarios: ScenarioCommercialParams[];
  maquilaRangesUsed: Array<{
    minLeyOzTc: string;
    maxLeyOzTc: string;
    maquila: string;
  }>;
  appSettingsUsed: {
    factor?: string | null;
  };
  results: ValuationCalculationResult;
  calculatedAt: string;
  activeScenarioIndex?: number;
}
