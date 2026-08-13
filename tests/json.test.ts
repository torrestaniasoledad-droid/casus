import { describe, it, expect } from "vitest";
import { extractJson } from "@/lib/json";

describe("extractJson", () => {
  it("parsea JSON plano", () => {
    expect(extractJson('{"a": 1}')).toEqual({ a: 1 });
  });

  it("quita fences ```json ... ```", () => {
    const text = '```json\n{"a": 1}\n```';
    expect(extractJson(text)).toEqual({ a: 1 });
  });

  it("quita fences ``` sin el lenguaje", () => {
    const text = '```\n{"a": 1}\n```';
    expect(extractJson(text)).toEqual({ a: 1 });
  });

  it("tira si el texto no es JSON válido", () => {
    expect(() => extractJson("esto no es json")).toThrow();
  });
});
