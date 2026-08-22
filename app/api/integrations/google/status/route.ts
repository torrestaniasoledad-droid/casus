import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canUseGoogleIntegration } from "@/lib/plans";

/**
 * Estado de la conexión con Google para la pantalla de integraciones (fase
 * de UI, pendiente). Nunca devuelve tokens ni nada cifrado — solo lo que la
 * UI necesita para decidir qué mostrar (upsell, botón conectar, estado
 * conectado, aviso de reconexión).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  }

  const [subscription, user, account] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    prisma.googleAccount.findUnique({ where: { userId } }),
  ]);

  const plan = subscription?.plan ?? "FREE";

  return NextResponse.json({
    allowed: canUseGoogleIntegration(plan, user?.email),
    connected: account?.status === "CONNECTED",
    status: account?.status ?? "DISCONNECTED",
    googleEmail: account?.status === "CONNECTED" ? account.googleEmail : null,
    sheetUrl: account?.sheetUrl ?? null,
    lastSyncAt: account?.lastSyncAt ?? null,
    lastSyncError: account?.lastSyncError ?? null,
  });
}
