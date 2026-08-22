import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import { createState, verifyState } from "@/lib/google/oauth";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-para-firmar-el-state";
});

describe("createState/verifyState (protección CSRF del flujo OAuth)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("un state válido, para el mismo userId, verifica ok", () => {
    const state = createState("user-1");
    expect(verifyState(state, "user-1")).toBe(true);
  });

  it("rechaza el state si el userId no coincide (el ataque que previene)", () => {
    // Si un atacante genera su propio state (con su userId) y logra que la
    // víctima complete ese callback estando logueada con OTRA cuenta, el
    // userId embebido no coincide con la sesión de la víctima.
    const attackerState = createState("attacker-id");
    expect(verifyState(attackerState, "victim-id")).toBe(false);
  });

  it("rechaza un state con la firma alterada", () => {
    const state = createState("user-1");
    const [payload] = state.split(".");
    const tampered = `${payload}.firma-invalida`;
    expect(verifyState(tampered, "user-1")).toBe(false);
  });

  it("rechaza un state mal formado", () => {
    expect(verifyState("no-tiene-punto", "user-1")).toBe(false);
    expect(verifyState("", "user-1")).toBe(false);
  });

  it("rechaza un state vencido (más de 10 minutos)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const state = createState("user-1");

    vi.setSystemTime(new Date("2026-01-01T00:11:00Z"));
    expect(verifyState(state, "user-1")).toBe(false);
  });

  it("acepta un state dentro de la ventana de 10 minutos", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const state = createState("user-1");

    vi.setSystemTime(new Date("2026-01-01T00:09:00Z"));
    expect(verifyState(state, "user-1")).toBe(true);
  });
});
