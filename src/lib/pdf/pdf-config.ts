export const PDF_TEMPLATE_VERSION = "preliquidacion-lote-v2";

export interface PdfBrandingConfig {
  companyName: string;
  disclaimer: string;
}

export const DEFAULT_PDF_BRANDING: PdfBrandingConfig = {
  companyName: "Valorización Minera",
  disclaimer:
    "La presente preliquidación contiene datos referenciales (Leyes, Recuperación y Reactivos), la preliquidación es con el mineral puesto en planta. Una vez ingresado a Planta se liquidará con datos de Planta. Se hará la liquidación final con aprobación de ambas partes.",
};
