/** Perú (America/Lima) no usa horario de verano desde 1994: UTC−5 fijo. */
const LIMA_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_HM_RE = /^(\d{1,2}):(\d{2})$/;

/**
 * Convierte fecha (y hora opcional) en horario Perú a ISO UTC para almacenar en DynamoDB.
 * Sin hora → fin de ese día calendario en Lima (23:59:59.999).
 */
export function peruLocalDateTimeToIso(
  dateOnly: string | undefined,
  timeHm?: string | undefined
): string | undefined {
  const date = dateOnly?.trim();
  if (!date) return undefined;

  const match = DATE_ONLY_RE.exec(date);
  if (!match) {
    throw new Error("Fecha de validez inválida");
  }

  let hours = 23;
  let minutes = 59;
  let seconds = 59;
  let ms = 999;

  const time = timeHm?.trim();
  if (time) {
    const t = TIME_HM_RE.exec(time);
    if (!t) {
      throw new Error("Hora de validez inválida (use HH:MM)");
    }
    hours = Number(t[1]);
    minutes = Number(t[2]);
    seconds = 0;
    ms = 0;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error("Hora de validez inválida");
    }
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const utcMs = Date.UTC(year, month, day, hours, minutes, seconds, ms) + LIMA_UTC_OFFSET_MS;
  const parsed = new Date(utcMs);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Fecha de validez inválida");
  }
  return parsed.toISOString();
}

/** Partes para inputs type=date y type=time en formularios admin. */
export function isoToPeruDateAndTime(iso: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!iso?.trim()) {
    return { date: "", time: "" };
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "", time: "" };
  }

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);

  return { date, time: time.slice(0, 5) };
}

/** Texto legible en panel (horario Perú). */
export function formatDateTimePet(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}
