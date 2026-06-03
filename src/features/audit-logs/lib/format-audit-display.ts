const ENTITY_LABELS: Record<string, string> = {
  field_device: "Dispositivo móvil",
  field_device_session: "Sesión de dispositivo",
  valuation_sync: "Sincronización de cotización",
};

const ACTION_LABELS: Record<string, string> = {
  assignManagedFieldDevice: "Asignar dispositivo",
  generateManagedFieldDeviceEnrollmentCode: "Generar código de activación",
  enrollFieldDevice: "Activar dispositivo",
  revokeManagedFieldDevice: "Revocar dispositivo",
  updateManagedFieldDevice: "Actualizar dispositivo",
  syncFieldDeviceStatus: "Sincronizar estado de dispositivo",
  syncFieldDeviceStatus_revoked: "Dispositivo revocado (sync)",
  issueDeviceSessionToken: "Emitir token de sesión",
  refreshDeviceSessionToken: "Renovar token de sesión",
  pushMobileValuation_synced: "Cotización sincronizada",
  pushMobileValuation_idempotent: "Cotización ya registrada (idempotente)",
  generateManagedUsageExtensionCode: "Generar código extensión de uso",
  resetManagedDeviceUsageQuota: "Reiniciar cupo de uso (prueba)",
  redeemUsageExtensionCode: "Canjear código extensión de uso",
};

export function auditEntityTypeLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

export function auditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

export function formatAuditPayload(payloadJson: string | null | undefined): string {
  if (!payloadJson?.trim()) return "—";
  try {
    return JSON.stringify(JSON.parse(payloadJson), null, 2);
  } catch {
    return payloadJson;
  }
}
