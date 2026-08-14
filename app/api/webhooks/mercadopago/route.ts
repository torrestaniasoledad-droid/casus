import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { mpFetch, assertMercadoPagoEnv } from "@/lib/mercadopago";
import type { Plan } from "@prisma/client";

/**
 * Mercado Pago llama a esta URL cada vez que cambia el estado de una
 * suscripción (autorizada, pausada, cancelada). Importante por seguridad:
 * NUNCA confiamos en los datos que vienen en el body de la notificación —
 * cualquiera podría mandarle un POST falso a esta URL. Lo único que
 * hacemos con la notificación es tomar el ID y volver a pedirle el estado
 * real a Mercado Pago, autenticados con nuestro propio Access Token. Recién
 * ese segundo dato (el que responde Mercado Pago, no el que llegó acá) es
 * el que se usa para decidir algo.
 */
export async function POST(req: Request) {
  try {
    assertMercadoPagoEnv();
  } catch {
    // No hay nada configurado del lado de Mercado Pago: no hay nada que
    // procesar, pero respondemos 200 para que MP no reintente sin sentido.
    return NextResponse.json({ ok: true });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const url = new URL(req.url);
  const preapprovalId =
    body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const topic = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");

  // Solo nos interesan las notificaciones de suscripciones (preapproval).
  // Otros tipos (pagos individuales, etc.) se ignoran por ahora.
  if (!preapprovalId || (topic !== "preapproval" && topic !== "subscription_preapproval")) {
    return NextResponse.json({ ok: true });
  }

  try {
    const mpRes = await mpFetch(`/preapproval/${preapprovalId}`);
    if (!mpRes.ok) {
      // eslint-disable-next-line no-console
      console.error("Mercado Pago webhook: no se pudo consultar preapproval", preapprovalId);
      return NextResponse.json({ ok: true });
    }

    const preapproval = await mpRes.json();
    const externalReference: string | undefined = preapproval.external_reference;
    if (!externalReference || !externalReference.includes(":")) {
      return NextResponse.json({ ok: true });
    }

    const [userId, planFromReference] = externalReference.split(":");
    const plan = planFromReference as Plan;
    if (plan !== "PRO" && plan !== "PREMIUM") {
      return NextResponse.json({ ok: true });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // "authorized" es el único estado en el que el usuario efectivamente
    // autorizó el cobro recurrente. "cancelled" y "paused" hacen que vuelva
    // a Free — no queremos que alguien se quede en un plan pago sin que
    // Mercado Pago esté cobrando de verdad.
    const newPlan: Plan = preapproval.status === "authorized" ? plan : "FREE";

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: newPlan,
        provider: "mercadopago",
        externalId: preapprovalId,
        status: preapproval.status,
      },
      update: {
        plan: newPlan,
        provider: "mercadopago",
        externalId: preapprovalId,
        status: preapproval.status,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error procesando webhook de Mercado Pago:", err);
    // Igual respondemos 200: si devolvemos error, Mercado Pago reintenta
    // muchas veces, y el problema (si es de nuestro código) no se arregla
    // solo reintentando.
    return NextResponse.json({ ok: true });
  }
}
