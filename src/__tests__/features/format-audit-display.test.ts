import {
  auditActionLabel,
  auditEntityTypeLabel,
  formatAuditPayload,
} from "@/features/audit-logs/lib/format-audit-display";

describe("format-audit-display", () => {
  it("traduce entidades conocidas", () => {
    expect(auditEntityTypeLabel("field_device")).toBe("Dispositivo móvil");
    expect(auditEntityTypeLabel("valuation_sync")).toBe("Sincronización de cotización");
  });

  it("traduce acciones conocidas", () => {
    expect(auditActionLabel("enrollFieldDevice")).toBe("Activar dispositivo");
  });

  it("formatea payload JSON", () => {
    const text = formatAuditPayload('{"cloudDeviceId":"abc"}');
    expect(text).toContain('"cloudDeviceId"');
    expect(text).toContain("abc");
  });
});
