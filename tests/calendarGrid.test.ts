import { describe, it, expect } from "vitest";
import { getMonthGrid, isSameDay } from "@/lib/calendarGrid";

describe("getMonthGrid", () => {
  it("arma semanas completas de 7 días", () => {
    const weeks = getMonthGrid(2026, 7); // agosto 2026 (mes 0-indexado)
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it("agosto 2026 arranca en sábado: la primera semana trae 5 días de relleno de julio", () => {
    const weeks = getMonthGrid(2026, 7);
    const firstWeek = weeks[0];
    const fillerDays = firstWeek.filter((d) => !d.inMonth);
    expect(fillerDays).toHaveLength(5);
    expect(firstWeek[5].date.getDate()).toBe(1);
    expect(firstWeek[5].inMonth).toBe(true);
  });

  it("incluye todos los días del mes exactamente una vez", () => {
    const weeks = getMonthGrid(2026, 1); // febrero 2026 (no bisiesto), 28 días
    const inMonthDays = weeks.flat().filter((d) => d.inMonth);
    expect(inMonthDays).toHaveLength(28);
    expect(inMonthDays[0].date.getDate()).toBe(1);
    expect(inMonthDays[27].date.getDate()).toBe(28);
  });

  it("febrero bisiesto trae 29 días", () => {
    const weeks = getMonthGrid(2028, 1);
    const inMonthDays = weeks.flat().filter((d) => d.inMonth);
    expect(inMonthDays).toHaveLength(29);
  });
});

describe("isSameDay", () => {
  it("compara solo año/mes/día, ignora la hora", () => {
    expect(isSameDay(new Date(2026, 7, 21, 9, 0), new Date(2026, 7, 21, 23, 59))).toBe(true);
  });

  it("distingue días distintos", () => {
    expect(isSameDay(new Date(2026, 7, 21), new Date(2026, 7, 22))).toBe(false);
  });
});
