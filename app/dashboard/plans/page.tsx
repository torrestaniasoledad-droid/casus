import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PLAN_PRICING } from "@/lib/planPricing";
import { UpgradeButton } from "@/components/plans/UpgradeButton";
import { Check } from "lucide-react";
import clsx from "clsx";

const ORDER: Array<keyof typeof PLAN_PRICING> = ["FREE", "PRO", "PREMIUM"];

export default async function PlansPage({
  searchParams,
}: {
  searchParams: { checkout?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  const currentPlan = subscription?.plan ?? "FREE";

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl text-ink mb-1">Planes</h1>
      <p className="text-ink-muted text-sm mb-6">
        Elegí el plan que mejor se adapte a cuánto contenido creás por mes.
      </p>

      {searchParams.checkout === "success" && (
        <Card className="mb-5 bg-primary-soft border-primary/15">
          <p className="text-sm text-primary">
            Estamos confirmando tu suscripción con Mercado Pago — puede tardar unos minutos
            en reflejarse acá. Si tocaste "Autorizar" en Mercado Pago, ya está en camino.
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {ORDER.map((planKey) => {
          const plan = PLAN_PRICING[planKey];
          const isCurrent = planKey === currentPlan;

          return (
            <Card
              key={planKey}
              className={clsx(
                "flex flex-col",
                isCurrent && "border-primary ring-1 ring-primary"
              )}
            >
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-lg text-ink">{plan.name}</h2>
                  {isCurrent && (
                    <span className="text-xs font-medium text-primary bg-primary-soft rounded-full px-2 py-0.5">
                      Tu plan
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted">{plan.tagline}</p>
              </div>

              <div className="mb-4">
                <span className="font-display text-3xl text-ink">
                  {plan.priceUsd === 0 ? "Gratis" : `$${plan.priceArs.toLocaleString("es-AR")}`}
                </span>
                {plan.priceUsd > 0 && <span className="text-sm text-ink-muted"> ARS/mes</span>}
                {plan.priceUsd > 0 && (
                  <div className="text-xs text-ink-muted">(≈ USD {plan.priceUsd}/mes)</div>
                )}
              </div>

              <ul className="flex flex-col gap-2 mb-5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-ink">
                    <Check size={16} className="text-ok shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="secondary" disabled className="w-full">
                  Plan actual
                </Button>
              ) : planKey === "FREE" ? (
                <Button variant="secondary" disabled className="w-full">
                  Plan gratuito
                </Button>
              ) : (
                <UpgradeButton plan={planKey as "PRO" | "PREMIUM"} />
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-ink-muted mt-6">
        El precio se cobra en pesos argentinos a través de Mercado Pago, con débito
        automático mensual. Podés cancelar la suscripción cuando quieras desde tu cuenta de
        Mercado Pago.
      </p>
    </div>
  );
}
