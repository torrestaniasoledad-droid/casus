import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/google/crypto";
import { revokeToken } from "@/lib/google/oauth";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Desconecta Google: revoca el token contra Google (no alcanza con
 * borrarlo de nuestra base — si no lo revocamos, el token sigue siendo
 * válido del lado de Google) y vacía las credenciales guardadas.
 *
 * driveFolderId/sheetId/sheetUrl/googleEmail se CONSERVAN a propósito: si
 * la profesional reconecta más adelante, CASUS reutiliza la misma
 * carpeta/planilla en vez de crear una "CASUS (2)" duplicada.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  }

  const rl = checkRateLimit(`google-disconnect:${userId}`, 5, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Esperá un momento antes de volver a intentar." },
      { status: 429 }
    );
  }

  const account = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!account || account.status === "DISCONNECTED") {
    // Ya está desconectado (o nunca se conectó) — no es un error, es un no-op.
    return NextResponse.json({ ok: true });
  }

  // Revocar el refresh token alcanza para invalidar también el access
  // token asociado; es best-effort porque si Google no responde igual
  // queremos que la profesional pueda desconectar del lado de CASUS.
  const tokenToRevoke = account.refreshTokenEnc ?? account.accessTokenEnc;
  if (tokenToRevoke) {
    await revokeToken(decrypt(tokenToRevoke));
  }

  await prisma.googleAccount.update({
    where: { userId },
    data: {
      accessTokenEnc: null,
      refreshTokenEnc: null,
      expiresAt: null,
      scopes: null,
      status: "DISCONNECTED",
      revokedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
