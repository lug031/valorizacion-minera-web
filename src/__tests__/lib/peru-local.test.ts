import {
  formatDateTimePet,
  isoToPeruDateAndTime,
  peruLocalDateTimeToIso,
} from "@/lib/datetime/peru-local";

describe("peru-local", () => {
  it("fecha sin hora = fin de día en Lima (UTC+5h)", () => {
    const iso = peruLocalDateTimeToIso("2026-06-15");
    expect(iso).toBe("2026-06-16T04:59:59.999Z");
  });

  it("fecha con hora en Lima", () => {
    const iso = peruLocalDateTimeToIso("2026-06-15", "14:30");
    expect(iso).toBe("2026-06-15T19:30:00.000Z");
  });

  it("roundtrip para formulario", () => {
    const iso = peruLocalDateTimeToIso("2026-06-15", "09:00");
    expect(isoToPeruDateAndTime(iso)).toEqual({ date: "2026-06-15", time: "09:00" });
  });

  it("formatDateTimePet usa zona Lima", () => {
    const text = formatDateTimePet("2026-06-15T19:30:00.000Z");
    expect(text).toContain("15");
    expect(text).toContain("14:30");
  });
});
