import { describe, it, expect } from "vitest";
import { ensureHashtagSymbols } from "@/lib/hashtags";

describe("ensureHashtagSymbols", () => {
  it("agrega # a los hashtags que no lo tienen", () => {
    expect(ensureHashtagSymbols(["fonoaudiologia", "salud"])).toEqual([
      "#fonoaudiologia",
      "#salud",
    ]);
  });

  it("no duplica el # si ya está presente", () => {
    expect(ensureHashtagSymbols(["#fonoaudiologia", "salud"])).toEqual([
      "#fonoaudiologia",
      "#salud",
    ]);
  });

  it("descarta strings vacíos", () => {
    expect(ensureHashtagSymbols(["#salud", "", "  "])).toEqual(["#salud"]);
  });
});
