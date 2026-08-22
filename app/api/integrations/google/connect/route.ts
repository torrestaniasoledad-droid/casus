import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canUseGoogleIntegration } from "@/lib/plans";
import { assertGoogleEnv, buildAuthUrl, createState } from "@/lib/google/oauth";
import { toUserFacingError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Arranca el flujo de conexión con Google: devuelve la URL de autorización
 * a la que el frontend redirige al navegador (mismo patrón que
 * /api/checkout/create con Mercado Pago: JSON con la URL, no un redirect
 * directo, para poder mostrar errores inline antes de salir de CASUS).
 */
export async function POST() {
  try {
    assertGoogleEnv();
  } catch (err) {
    const { message, status } = toUserFacingError(err);
    return NextResponse.json({ error: message }, { status });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  }

  const rl = checkRateLimit(`google-connect:${userId}`, 5, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Esperá un momento antes de volver a intentar." },
      { status: 429 }
    );
  }

  const [subscription, user] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);
  const plan = subscription?.plan ?? "FREE";
  if (!canUseGoogleIntegration(plan, user?.email)) {
    return NextResponse.json(
      { error: "Conectar Google Drive está disponible en los planes Pro y Premium." },
      { status: 403 }
    );
  }

  const state = createState(userId);
  const authUrl = buildAuthUrl(state);
  return NextResponse.json({ authUrl });
}
