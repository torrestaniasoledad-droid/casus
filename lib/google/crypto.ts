import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Cifrado simétrico (AES-256-GCM) para los tokens de Google que se guardan
 * en `GoogleAccount` (accessTokenEnc/refreshTokenEnc). Nunca se persiste un
 * token de Google en texto plano — son credenciales de acceso a Drive/Sheets
 * de la profesional, de valor equivalente a una contraseña.
 *
 * La clave (ENCRYPTION_KEY) es independiente de NEXTAUTH_SECRET a propósito:
 * son dos superficies de riesgo distintas (sesión de la app vs. acceso a
 * Drive de terceros) y conviene poder rotar una sin afectar la otra.
 */

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("Falta configurar ENCRYPTION_KEY.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY debe ser una clave de 32 bytes en base64 (generála con: openssl rand -base64 32)."
    );
  }
  return key;
}

const IV_LENGTH = 12; // estándar para GCM
const AUTH_TAG_LENGTH = 16;

/** Devuelve un único string base64 (iv + authTag + ciphertext) listo para guardar en una columna de texto. */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decrypt(payload: string): string {
  const key = getKey();
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
