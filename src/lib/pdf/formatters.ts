const LOCALE = "es-PE";

export function formatPdfMoney(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPdfDecimal(
  value: string | number | null | undefined,
  decimals = 3
): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatPdfPercent(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return `${value}%`;
}

export function formatPdfDate(isoOrDate: string): string {
  try {
    const d = new Date(isoOrDate.includes("T") ? isoOrDate : `${isoOrDate}T12:00:00`);
    return d.toLocaleDateString(LOCALE, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return isoOrDate;
  }
}

export function formatPdfDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(LOCALE, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
