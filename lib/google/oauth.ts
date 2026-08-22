import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * Flujo OAuth propio con Google — deliberadamente separado de NextAuth.
 *
 * Esto NO es "iniciar sesión con Google": la profesional ya está logueada
 * en CASUS (NextAuth, CredentialsProvider) y desde adentro *conecta* su
 * Drive, como conectaría Slack o Notion a otra app. Mezclar esto con
 * NextAuth abriría la puerta a "account linking" (¿qué pasa si alguien
 * conecta un Google con el mismo email que otra cuenta de CASUS?), que es
 * una fuente clásica de vulnerabilidades. Acá no existe ese problema: la
 * cuenta de Google conectada es siempre un dato adicional del `userId` ya
 * autenticado, nunca un método de login.
 *
 * Se usa `fetch` directo contra las URLs REST de Google en vez del SDK
 * `googleapis` (mismo criterio que ya usa `lib/mercadopago.ts`: para
 * llamadas HTTP simples, una dependencia menos).
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

// drive.file: CASUS solo ve/edita los archivos que ella misma crea, nunca
// el resto del Drive de la profesional. spreadsheets: leer/escribir las
// planillas que gestiona. openid+email: para saber a qué cuenta de Google
// se conectó y mostrarlo en la UI ("Conectado como...").
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
].join(" ");

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutos: tiempo de sobra para completar el consent screen

export class GoogleOAuthError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "not_configured"
      | "invalid_state"
      | "denied"
      | "token_exchange_failed"
      | "refresh_failed"
      | "userinfo_failed"
      | "not_connected"
  ) {
    super(message);
    this.name = "GoogleOAuthError";
  }
}

export function assertGoogleEnv() {
  const missing: string[] = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!process.env.ENCRYPTION_KEY) missing.push("ENCRYPTION_KEY");
  if (!process.env.NEXTAUTH_URL) missing.push("NEXTAUTH_URL");
  if (missing.length > 0) {
    throw new GoogleOAuthError(`Falta configurar: ${missing.join(", ")}.`, "not_configured");
  }
}

function getRedirectUri(): string {
  return `${process.env.NEXTAUTH_URL}/api/integrations/google/callback`;
}

/**
 * Firma el `state` con NEXTAUTH_SECRET (reutilizado, no hace falta un
 * secreto nuevo) atándolo al userId de la sesión que inició el flujo. Esto
 * es lo que evita el CSRF clásico de OAuth: si un atacante arma su propio
 * `code`/`state` e intenta que la víctima complete SU callback, el userId
 * embebido en el `state` no va a coincidir con la sesión de la víctima y el
 * callback lo rechaza — sin necesidad de guardar el state en la base.
 */
function getStateSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new GoogleOAuthError("Falta configurar NEXTAUTH_SECRET.", "not_configured");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getStateSecret()).update(payload).digest("base64url");
}

export function createState(userId: string): string {
  const payload = JSON.stringify({ userId, nonce: randomBytes(16).toString("hex"), iat: Date.now() });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyState(state: string, expectedUserId: string): boolean {
  const [payloadB64, sig] = state.split(".");
  if (!payloadB64 || !sig) return false;

  const expectedSig = sign(payloadB64);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  let payload: { userId: string; iat: number };
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return false;
  }

  if (payload.userId !== expectedUserId) return false;
  if (Date.now() - payload.iat > STATE_TTL_MS) return false;
  return true;
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    // offline + consent: sin esto, Google no reenvía el refresh_token si la
    // profesional ya había conectado antes (solo lo manda la primera vez).
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error("Google OAuth: token exchange falló", res.status, await res.text().catch(() => ""));
    throw new GoogleOAuthError("No pudimos completar la conexión con Google.", "token_exchange_failed");
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scope: data.scope,
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date; scope: string }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    // Típicamente 400 invalid_grant: el refresh token fue revocado del lado
    // de Google (manualmente, o por 6 meses sin uso). El caller debe marcar
    // GoogleAccount.status = NEEDS_REAUTH, no reintentar.
    throw new GoogleOAuthError("El acceso a Google expiró o fue revocado.", "refresh_failed");
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scope: data.scope,
  };
}

/** Best-effort: revoca el token contra Google. Si falla, igual desconectamos del lado de CASUS. */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST" });
  } catch {
    // eslint-disable-next-line no-console
    console.error("Google OAuth: no se pudo revocar el token (se desconecta igual del lado de CASUS).");
  }
}

export async function getGoogleUserInfo(accessToken: string): Promise<{ sub: string; email: string }> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new GoogleOAuthError("No pudimos identificar la cuenta de Google conectada.", "userinfo_failed");
  }
  const data = await res.json();
  return { sub: data.sub, email: data.email };
}
