const LAST_ACCESS_KEY = "vm_admin_last_access";

export function recordLastAccess(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_ACCESS_KEY, new Date().toISOString());
}

export function getLastAccessIso(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_ACCESS_KEY);
}

/** Formato tipo: 25/05/2026, 09:23 p. m. PET */
export function formatLastAccessPet(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
