import type { ValuationSnapshot } from "@/lib/valuation/snapshot-types";
import {
  buildValuationPdfHtmlFromSnapshot,
  type ValuationPdfMeta,
} from "@/lib/pdf/builders/valuation-pdf-builder";

function sanitizeFileName(code: string): string {
  return code.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 64);
}

/**
 * Abre el diálogo de impresión del navegador (Guardar como PDF).
 * Mismo HTML que la preliquidación de la app móvil.
 */
export function printValuationPdfFromSnapshot(
  snapshot: ValuationSnapshot,
  meta: ValuationPdfMeta,
  scenarioIndex?: number
): void {
  const html = buildValuationPdfHtmlFromSnapshot(snapshot, meta, scenarioIndex);
  const title = `valorizacion-${sanitizeFileName(meta.code)}`;
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Permita ventanas emergentes para exportar el PDF.");
  }
  win.document.open();
  win.document.write(html);
  win.document.title = title;
  win.document.close();
  win.focus();
  const triggerPrint = () => {
    win.print();
  };
  if (win.document.readyState === "complete") {
    triggerPrint();
  } else {
    win.onload = triggerPrint;
  }
}
