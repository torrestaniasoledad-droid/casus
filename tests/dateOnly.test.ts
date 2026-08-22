import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  calendarDateStringToDate,
  dateColumnToCalendarDateString,
  formatCalendarDateString,
  isValidCalendarDateString,
  toCalendarDateString,
} from "@/lib/dateOnly";

describe("toCalendarDateString", () => {
  it("arma YYYY-MM-DD con ceros a la izquierda", () => {
    expect(toCalendarDateString(2026, 0, 5)).toBe("2026-01-05"); // mes 0-indexado
    expect(toCalendarDateString(2026, 11, 24)).toBe("2026-12-24");
  });
});

describe("isValidCalendarDateString", () => {
  it("acepta fechas válidas", () => {
    expect(isValidCalendarDateString("2026-08-24")).toBe(true);
  });

  it("rechaza formato incorrecto o fechas inexistentes", () => {
    expect(isValidCalendarDateString("2026-8-24")).toBe(false);
    expect(isValidCalendarDateString("24-08-2026")).toBe(false);
    expect(isValidCalendarDateString("2026-13-01")).toBe(false); // mes 13 no existe
    expect(isValidCalendarDateString("2026-02-30")).toBe(false); // 30 de febrero no existe
    expect(isValidCalendarDateString("no-es-una-fecha")).toBe(false);
  });
});

describe("calendarDateStringToDate / dateColumnToCalendarDateString", () => {
  it("el round-trip conserva exactamente el mismo día", () => {
    const date = calendarDateStringToDate("2026-08-24");
    expect(dateColumnToCalendarDateString(date)).toBe("2026-08-24");
  });

  it("calendarDateStringToDate tira si el formato es inválido", () => {
    expect(() => calendarDateStringToDate("24/08/2026")).toThrow(/inválida/);
  });
});

/**
 * Este es el escenario exacto del bug reportado: programar el 24/08/2026
 * aparecía como 23/08/2026 en la vista de calendario, porque el valor se
 * guardaba en UTC pero se leía con getters de huso horario local. Estos
 * tests fuerzan process.env.TZ a un huso con offset negativo (como
 * Argentina, UTC-3) para reproducir esa condición — si alguien reintroduce
 * un `.getDate()`/`.toLocaleDateString()` sin `timeZone: "UTC"` en el
 * camino de estas funciones, este test lo va a detectar.
 */
describe("scheduledFor no se corre de día en husos horarios negativos", () => {
  const originalTZ = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = "America/Argentina/Buenos_Aires"; // UTC-3
  });

  afterAll(() => {
    process.env.TZ = originalTZ;
  });

  it("el round-trip completo conserva el 24/08, no cae al 23/08", () => {
    const stored = calendarDateStringToDate("2026-08-24"); // lo que se guardaría en la DB
    expect(dateColumnToCalendarDateString(stored)).toBe("2026-08-24");
  });

  it("formatCalendarDateString muestra el día correcto, no el anterior", () => {
    const formatted = formatCalendarDateString("2026-08-24", { day: "2-digit", month: "2-digit" });
    expect(formatted).toContain("24");
    expect(formatted).not.toContain("23");
  });
});
