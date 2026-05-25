export function formatMoney(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") return "—";
  const n = parseFloat(value.replace(",", "."));
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-PE", { dateStyle: "medium" });
}

export function formatDisplayDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

export function syncStatusLabel(status: string | null | undefined): string {
  if (!status) return "Sin estado";
  switch (status.toLowerCase()) {
    case "local":
      return "Solo móvil";
    case "synced":
      return "Sincronizado";
    case "pending":
      return "Pendiente sync";
    case "error":
      return "Error sync";
    default:
      return status;
  }
}
