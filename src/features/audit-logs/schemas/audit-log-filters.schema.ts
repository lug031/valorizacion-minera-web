export type AuditLogFilters = {
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
};

export const emptyAuditLogFilters: AuditLogFilters = {
  entityType: "",
  entityId: "",
  action: "",
  userId: "",
  from: "",
  to: "",
};

export function hasActiveAuditLogFilters(filters: AuditLogFilters): boolean {
  return Boolean(
    filters.entityType?.trim() ||
      filters.entityId?.trim() ||
      filters.action?.trim() ||
      filters.userId?.trim() ||
      filters.from?.trim() ||
      filters.to?.trim()
  );
}
