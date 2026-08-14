import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { mpFetch, assertMercadoPagoEnv } from "@/lib/mercadopago";
import { PLAN_PRICING } from "@/lib/planPricing";
import { checkRateLimit } from "@/lib/rateLimit";

const checkoutSchema = z.object({
  plan: z.enum(["PRO", "PREMIUM"]),
});

/**
 * Crea una "preapproval" (suscripción recurrente) en Mercado Pago y devuelve
 * la URL a la que hay que mandar al usuario para que autorice el cobro
 * mensual. El plan del usuario NO se actualiza acá — eso lo hace el webhook
 * (`/api/webhooks/mercadopago`) recién cuando Mercado Pago confirma que la
 * suscripción quedó autorizada. Si actualizáramos el plan en este endpoint,
 * alguien podría llamarlo sin llegar a pagar y quedarse con el plan gratis.
 */
export async function POST(req: Request) {
  try {
    assertMercadoPagoEnv();
  } catch {
    return NextResponse.json(
      { error: "Los pagos todavía no están configurados. Avisá al equipo." },
      { status: 500 }
    );
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;
  if (!userId || !userEmail) {
    return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  }

  const rl = checkRateLimit(`checkout:${userId}`, 5, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Esperá un momento antes de volver a intentar." },
      { status: 429 }
    );
  }

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  }
  const { plan } = parsed.data;
  const pricing = PLAN_PRICING[plan];

  const appUrl = process.env.NEXTAUTH_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "Falta configurar la URL de la aplicación. Avisá al equipo." },
      { status: 500 }
    );
  }

  try {
    const mpRes = await mpFetch("/preapproval", {
      method: "POST",
      body: JSON.stringify({
        reason: `CASUS — Plan ${pricing.name}`,
        // Codificamos userId y plan acá porque es el único campo libre que
        // Mercado Pago nos devuelve intacto en el webhook — así sabemos, sin
        // ambigüedad, a quién y a qué plan corresponde cada notificación.
        external_reference: `${userId}:${plan}`,
        payer_email: userEmail,
        back_url: `${appUrl}/dashboard/plans?checkout=success`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: pricing.priceArs,
          currency_id: "ARS",
        },
        status: "pending",
      }),
    });

    if (!mpRes.ok) {
      const errBody = await mpRes.text();
      // eslint-disable-next-line no-console
      console.error("Mercado Pago preapproval error:", mpRes.status, errBody);
      return NextResponse.json(
        { error: "No pudimos iniciar el pago con Mercado Pago. Probá de nuevo." },
        { status: 502 }
      );
    }

    const data = await mpRes.json();

    return NextResponse.json({ checkoutUrl: data.init_point });
  } catch {
    return NextResponse.json(
      { error: "No pudimos conectar con Mercado Pago. Probá de nuevo en unos minutos." },
      { status: 500 }
    );
  }
}
