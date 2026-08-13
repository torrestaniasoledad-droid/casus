import { describe, it, expect } from "vitest";
import { FORMAT_SCHEMAS } from "@/lib/contentGeneration";

describe("FORMAT_SCHEMAS.CARRUSEL", () => {
  const base = { caption: "cap", hashtags: ["#a"], cta: "cta" };

  it("acepta exactamente 7 slides", () => {
    const result = FORMAT_SCHEMAS.CARRUSEL.safeParse({
      ...base,
      slides: Array.from({ length: 7 }, (_, i) => `slide ${i}`),
    });
    expect(result.success).toBe(true);
  });

  it("rechaza 6 slides", () => {
    const result = FORMAT_SCHEMAS.CARRUSEL.safeParse({
      ...base,
      slides: Array.from({ length: 6 }, (_, i) => `slide ${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("rechaza 8 slides", () => {
    const result = FORMAT_SCHEMAS.CARRUSEL.safeParse({
      ...base,
      slides: Array.from({ length: 8 }, (_, i) => `slide ${i}`),
    });
    expect(result.success).toBe(false);
  });
});

describe("FORMAT_SCHEMAS.STORIES", () => {
  it("acepta exactamente 4 historias", () => {
    const result = FORMAT_SCHEMAS.STORIES.safeParse({
      stories: ["a", "b", "c", "d"],
      cta: "cta",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza 3 historias", () => {
    const result = FORMAT_SCHEMAS.STORIES.safeParse({ stories: ["a", "b", "c"], cta: "cta" });
    expect(result.success).toBe(false);
  });
});

describe("FORMAT_SCHEMAS.REEL", () => {
  it("rechaza si falta spoken_text", () => {
    const result = FORMAT_SCHEMAS.REEL.safeParse({
      hook: "h",
      script: "s",
      cta: "c",
      caption: "cap",
      hashtags: ["#a"],
    });
    expect(result.success).toBe(false);
  });
});
