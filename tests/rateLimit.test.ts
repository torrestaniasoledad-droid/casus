import { describe, it, expect, vi, afterEach } from "vitest";
import { checkRateLimit } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite requests dentro del límite", () => {
    const key = `test-${Math.random()}`;
    const r1 = checkRateLimit(key, 3, 1000);
    const r2 = checkRateLimit(key, 3, 1000);
    const r3 = checkRateLimit(key, 3, 1000);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
  });

  it("bloquea al superar el límite dentro de la ventana", () => {
    const key = `test-${Math.random()}`;
    checkRateLimit(key, 2, 1000);
    checkRateLimit(key, 2, 1000);
    const r3 = checkRateLimit(key, 2, 1000);
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("resetea el contador pasada la ventana", () => {
    vi.useFakeTimers();
    const key = `test-${Math.random()}`;
    checkRateLimit(key, 1, 1000);
    const blocked = checkRateLimit(key, 1, 1000);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(1001);
    const afterWindow = checkRateLimit(key, 1, 1000);
    expect(afterWindow.allowed).toBe(true);
  });
});
