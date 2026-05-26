const GENERIC =
  "No se pudo completar la operación. Verifique su conexión e intente nuevamente.";

/**
 * Evita mostrar errores crudos de GraphQL/Amplify al usuario final.
 */
export function formatApiError(error: unknown, fallback = GENERIC): string {
  if (!(error instanceof Error)) return fallback;
  const msg = error.message.trim();
  if (!msg) return fallback;

  const lower = msg.toLowerCase();
  if (
    lower.includes("graphql") ||
    lower.includes("appsync") ||
    lower.includes("network error") ||
    lower.includes("failed to fetch") ||
    lower.includes("unexpected error")
  ) {
    return fallback;
  }
  if (lower.includes("unauthorized") || lower.includes("not authorized")) {
    return "No tiene permisos para realizar esta acción.";
  }
  if (lower.includes("timeout")) {
    return "La operación tardó demasiado. Intente nuevamente.";
  }
  if (msg.length > 180) return fallback;
  return msg;
}
