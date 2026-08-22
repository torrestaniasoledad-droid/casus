import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canUseGoogleIntegration } from "@/lib/plans";
import { fullResync } from "@/lib/google/sync";
import { toUserFacingError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";

/** Botón "Sincronizar ahora": reescribe toda la planilla desde CASUS (fuente de verdad). */
export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  }

  const rl = checkRateLimit(`google-sync:${userId}`, 5, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Esperá un momento antes de volver a sincronizar." },
      { status: 429 }
    );
  }

  const [subscription, user] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);
  if (!canUseGoogleIntegration(subscription?.plan ?? "FREE", user?.email)) {
    return NextResponse.json(
      { error: "Sincronizar con Google Sheets está disponible en los planes Pro y Premium." },
      { status: 403 }
    );
  }

  try {
    const { count } = await fullResync(userId);
    return NextResponse.json({ ok: true, count });
  } catch (err) {
    const { message, status } = toUserFacingError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
