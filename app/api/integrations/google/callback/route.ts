import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { encrypt } from "@/lib/google/crypto";
import { assertGoogleEnv, exchangeCodeForTokens, getGoogleUserInfo, verifyState } from "@/lib/google/oauth";
import { fullResync } from "@/lib/google/sync";

/**
 * Callback al que redirige Google después de la pantalla de consentimiento.
 * Esta ruta la navega el navegador directamente (no un fetch desde el
 * frontend), así que siempre responde con un redirect — nunca JSON — hacia
 * /dashboard/integrations, con un query param de resultado que esa pantalla
 * usa para mostrar un mensaje.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirectTo = (result: "connected" | "error", reason?: string) => {
    const target = new URL("/dashboard/integrations", url);
    target.searchParams.set(result === "connected" ? "connected" : "error", reason ?? result);
    return NextResponse.redirect(target);
  };

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    // Sesión vencida durante el ir-y-volver a Google: no hay a quién atarle
    // la conexión. Al login, no perdemos nada — el usuario puede reconectar.
    return NextResponse.redirect(new URL("/login", url));
  }

  // El usuario canceló el consent screen, o Google rechazó la request.
  const errorParam = url.searchParams.get("error");
  if (errorParam) {
    return redirectTo("error", "denied");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return redirectTo("error", "invalid_state");
  }

  try {
    assertGoogleEnv();
  } catch {
    return redirectTo("error", "not_configured");
  }

  if (!verifyState(state, userId)) {
    return redirectTo("error", "invalid_state");
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch {
    return redirectTo("error", "token_exchange_failed");
  }

  if (!tokens.refreshToken) {
    // No debería pasar con access_type=offline&prompt=consent, pero si
    // pasa no tiene sentido guardar una conexión que no vamos a poder
    // refrescar más adelante — mejor pedir que reconecte.
    return redirectTo("error", "token_exchange_failed");
  }

  let identity;
  try {
    identity = await getGoogleUserInfo(tokens.accessToken);
  } catch {
    return redirectTo("error", "userinfo_failed");
  }

  await prisma.googleAccount.upsert({
    where: { userId },
    create: {
      userId,
      googleUserId: identity.sub,
      googleEmail: identity.email,
      accessTokenEnc: encrypt(tokens.accessToken),
      refreshTokenEnc: encrypt(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      scopes: tokens.scope,
      status: "CONNECTED",
      connectedAt: new Date(),
      revokedAt: null,
    },
    update: {
      googleUserId: identity.sub,
      googleEmail: identity.email,
      accessTokenEnc: encrypt(tokens.accessToken),
      refreshTokenEnc: encrypt(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      scopes: tokens.scope,
      status: "CONNECTED",
      connectedAt: new Date(),
      revokedAt: null,
      // driveFolderId/sheetId/sheetUrl NO se tocan: si reconecta, se
      // reutiliza la carpeta/planilla existente en vez de crear otra.
    },
  });

  // Aprovisiona carpeta+planilla y hace el volcado inicial. Best-effort a
  // propósito: si falla acá (Drive/Sheets caídos, cuota, lo que sea), la
  // conexión OAuth en sí ya quedó guardada y CONNECTED — la profesional
  // puede reintentar con "Sincronizar ahora" sin tener que reconectar.
  try {
    await fullResync(userId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Google: no se pudo aprovisionar Drive/Sheets al conectar.", err);
  }

  return redirectTo("connected");
}
