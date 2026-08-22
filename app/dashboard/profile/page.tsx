import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PROFESSION_LABEL } from "@/lib/labels";
import { PLAN_PRICING } from "@/lib/planPricing";
import Link from "next/link";

const FIELD_LABEL: Record<string, string> = {
  displayName: "Nombre",
  profession: "Profesión",
  specialty: "Especialidad",
  targetAudience: "Público objetivo",
  mainNetwork: "Red principal",
  mainGoal: "Objetivo principal",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const [profile, subscription] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);
  const currentPlan = subscription?.plan ?? "FREE";

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl text-ink mb-6">Tu perfil</h1>

      <Card className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-ink-muted mb-0.5">Tu plan</div>
          <div className="font-display text-lg text-ink">{PLAN_PRICING[currentPlan].name}</div>
        </div>
        <Link href="/dashboard/plans">
          <Button variant="secondary" size="sm">
            Ver planes
          </Button>
        </Link>
      </Card>

      <Card className="divide-y divide-line mb-4">
        {profile &&
          (Object.keys(FIELD_LABEL) as (keyof typeof FIELD_LABEL)[]).map((key) => (
            <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <span className="text-sm text-ink-muted">{FIELD_LABEL[key]}</span>
              <span className="text-sm text-ink font-medium">
                {key === "profession"
                  ? PROFESSION_LABEL[(profile as any)[key]] ?? (profile as any)[key] ?? "—"
                  : (profile as any)[key] || "—"}
              </span>
            </div>
          ))}
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-ink">Integraciones</div>
          <div className="text-xs text-ink-muted">Conectá Google Drive para tu calendario editorial.</div>
        </div>
        <Link href="/dashboard/integrations">
          <Button variant="secondary" size="sm">
            Gestionar
          </Button>
        </Link>
      </Card>
    </div>
  );
}
