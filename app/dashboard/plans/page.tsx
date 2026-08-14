import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PLAN_PRICING } from "@/lib/planPricing";
import { Check } from "lucide-react";
import clsx from "clsx";

const ORDER: Array<keyof typeof PLAN_PRICING> = ["FREE", "PRO", "PREMIUM"];

export default async function PlansPage() {
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
                  {plan.priceUsd === 0 ? "Gratis" : `USD ${plan.priceUsd}`}
                </span>
                {plan.priceUsd > 0 && <span className="text-sm text-ink-muted">/mes</span>}
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
                <Button disabled className="w-full">
                  Disponible pronto
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-ink-muted mt-6">
        Los planes pagos todavía no se pueden contratar desde acá — estamos conectando el
        cobro. El precio en pesos se define al tipo de cambio del momento.
      </p>
    </div>
  );
}
