import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "crypto";
import { encrypt, decrypt } from "@/lib/google/crypto";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("encrypt/decrypt (tokens de Google)", () => {
  it("descifra exactamente lo que se cifró", () => {
    const plaintext = "un-refresh-token-de-ejemplo-1234567890";
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it("nunca guarda el texto plano dentro del payload cifrado", () => {
    const plaintext = "token-secreto-no-deberia-aparecer-tal-cual";
    expect(encrypt(plaintext)).not.toContain(plaintext);
  });

  it("dos cifrados del mismo texto dan resultados distintos (IV aleatorio)", () => {
    const plaintext = "mismo-texto";
    expect(encrypt(plaintext)).not.toBe(encrypt(plaintext));
  });

  it("rechaza un payload corrupto en vez de devolver basura en silencio", () => {
    const tampered = encrypt("texto-original").slice(0, -4) + "abcd";
    expect(() => decrypt(tampered)).toThrow();
  });

  it("tira un error explícito si falta ENCRYPTION_KEY", () => {
    const original = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("x")).toThrow(/ENCRYPTION_KEY/);
    process.env.ENCRYPTION_KEY = original;
  });
});
