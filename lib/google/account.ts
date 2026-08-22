import { prisma } from "@/lib/db/prisma";
import { decrypt, encrypt } from "./crypto";
import { GoogleOAuthError, refreshAccessToken } from "./oauth";

// Refrescar si el token vence en menos de este margen, para no arrancar una
// llamada a Drive/Sheets con un token que expira a mitad de camino.
const REFRESH_MARGIN_MS = 2 * 60 * 1000;

/**
 * Devuelve un access token vigente para el GoogleAccount conectado del
 * usuario, refrescándolo primero si está por vencer. Si el refresh falla
 * (típicamente porque el refresh token fue revocado del lado de Google),
 * marca la cuenta como NEEDS_REAUTH antes de propagar el error — así la UI
 * puede pedir reconectar en vez de reintentar en loop contra un token que
 * ya no sirve.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const account = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!account || account.status !== "CONNECTED" || !account.accessTokenEnc || !account.refreshTokenEnc) {
    throw new GoogleOAuthError("No tenés Google Drive conectado.", "not_connected");
  }

  const expiresAt = account.expiresAt?.getTime() ?? 0;
  if (expiresAt - Date.now() > REFRESH_MARGIN_MS) {
    return decrypt(account.accessTokenEnc);
  }

  try {
    const refreshed = await refreshAccessToken(decrypt(account.refreshTokenEnc));
    await prisma.googleAccount.update({
      where: { userId },
      data: {
        accessTokenEnc: encrypt(refreshed.accessToken),
        expiresAt: refreshed.expiresAt,
        scopes: refreshed.scope,
      },
    });
    return refreshed.accessToken;
  } catch (err) {
    await prisma.googleAccount
      .update({ where: { userId }, data: { status: "NEEDS_REAUTH" } })
      .catch(() => {});
    throw err;
  }
}
