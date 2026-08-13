import { describe, it, expect } from "vitest";
import { PLAN_LIMITS, currentPeriod } from "@/lib/plans";

describe("PLAN_LIMITS", () => {
  it("FREE es más restrictivo que PRO, y PRO más que PREMIUM", () => {
    expect(PLAN_LIMITS.FREE.analyses).toBeLessThan(PLAN_LIMITS.PRO.analyses);
    expect(PLAN_LIMITS.PRO.analyses).toBeLessThan(PLAN_LIMITS.PREMIUM.analyses);
  });
});

describe("currentPeriod", () => {
  it('formatea como "YYYY-MM"', () => {
    expect(currentPeriod(new Date("2026-08-12T10:00:00Z"))).toBe("2026-08");
  });

  it("agrega cero a la izquierda en meses de un dígito", () => {
    expect(currentPeriod(new Date("2026-01-05T10:00:00Z"))).toBe("2026-01");
  });
});
