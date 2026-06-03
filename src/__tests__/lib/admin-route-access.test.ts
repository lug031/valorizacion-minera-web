import {
  canAccessAdminPath,
  isSupervisorAllowedAdminPath,
} from "@/lib/auth/admin-route-access";

describe("admin-route-access", () => {
  it("supervisor solo maquila, configuracion y materiales", () => {
    expect(isSupervisorAllowedAdminPath("/admin/maquila")).toBe(true);
    expect(isSupervisorAllowedAdminPath("/admin/configuracion")).toBe(true);
    expect(isSupervisorAllowedAdminPath("/admin/materiales")).toBe(true);
    expect(isSupervisorAllowedAdminPath("/admin/dispositivos")).toBe(false);
    expect(isSupervisorAllowedAdminPath("/admin/auditoria")).toBe(false);
  });

  it("admin accede a dispositivos", () => {
    expect(canAccessAdminPath("/admin/dispositivos", ["admin"])).toBe(true);
  });

  it("supervisor no accede a dispositivos por URL", () => {
    expect(canAccessAdminPath("/admin/dispositivos", ["supervisor"])).toBe(false);
  });
});
