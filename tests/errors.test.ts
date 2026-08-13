import { describe, it, expect } from "vitest";
import { toUserFacingError } from "@/lib/errors";
import { AIProviderError } from "@/lib/ai/provider";

describe("toUserFacingError", () => {
  it("mapea timeout a 504 con mensaje en español", () => {
    const { message, status } = toUserFacingError(new AIProviderError("x", "timeout"));
    expect(status).toBe(504);
    expect(message).toMatch(/tardó/);
  });

  it("mapea rate_limited a 429", () => {
    const { status } = toUserFacingError(new AIProviderError("x", "rate_limited"));
    expect(status).toBe(429);
  });

  it("nunca expone el mensaje interno crudo del error", () => {
    const internal = "TypeError: Cannot read property 'x' of undefined at /app/foo.ts:42";
    const { message } = toUserFacingError(new Error(internal));
    expect(message).not.toContain("TypeError");
    expect(message).not.toContain("foo.ts");
  });
});
