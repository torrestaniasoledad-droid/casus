import { describe, it, expect } from "vitest";
import { FORMAT_SCHEMAS } from "@/lib/contentGeneration";

describe("FORMAT_SCHEMAS.CARRUSEL", () => {
  const base = { caption: "cap", hashtags: ["#a"], cta: "cta", visual_suggestion: ["vs1", "vs2"] };

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

  it("rechaza si falta visual_suggestion", () => {
    const result = FORMAT_SCHEMAS.CARRUSEL.safeParse({
      caption: "cap",
      hashtags: ["#a"],
      cta: "cta",
      slides: Array.from({ length: 7 }, (_, i) => `slide ${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("rechaza visual_suggestion con un solo punto (mínimo 2)", () => {
    const result = FORMAT_SCHEMAS.CARRUSEL.safeParse({
      caption: "cap",
      hashtags: ["#a"],
      cta: "cta",
      slides: Array.from({ length: 7 }, (_, i) => `slide ${i}`),
      visual_suggestion: ["un solo punto"],
    });
    expect(result.success).toBe(false);
  });
});

describe("FORMAT_SCHEMAS.STORIES", () => {
  it("acepta exactamente 4 historias", () => {
    const result = FORMAT_SCHEMAS.STORIES.safeParse({
      stories: ["a", "b", "c", "d"],
      cta: "cta",
      visual_suggestion: ["vs1", "vs2"],
    });
    expect(result.success).toBe(true);
  });

  it("rechaza 3 historias", () => {
    const result = FORMAT_SCHEMAS.STORIES.safeParse({
      stories: ["a", "b", "c"],
      cta: "cta",
      visual_suggestion: ["vs1", "vs2"],
    });
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
      visual_suggestion: ["vs1", "vs2"],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza si falta visual_suggestion", () => {
    const result = FORMAT_SCHEMAS.REEL.safeParse({
      hook: "h",
      script: "s",
      spoken_text: "st",
      cta: "c",
      caption: "cap",
      hashtags: ["#a"],
    });
    expect(result.success).toBe(false);
  });
});
