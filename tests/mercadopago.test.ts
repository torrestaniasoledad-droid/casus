import { describe, it, expect, afterEach } from "vitest";
import { assertMercadoPagoEnv } from "@/lib/mercadopago";

describe("assertMercadoPagoEnv", () => {
  const original = process.env.MERCADOPAGO_ACCESS_TOKEN;

  afterEach(() => {
    if (original === undefined) delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    else process.env.MERCADOPAGO_ACCESS_TOKEN = original;
  });

  it("tira si falta la variable de entorno", () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    expect(() => assertMercadoPagoEnv()).toThrow();
  });

  it("no tira si la variable está presente", () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-test";
    expect(() => assertMercadoPagoEnv()).not.toThrow();
  });
});
