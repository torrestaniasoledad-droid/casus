import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { PROFESSION_LABEL } from "@/lib/labels";

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
  const profile = await prisma.profile.findUnique({ where: { userId } });

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl text-ink mb-6">Tu perfil</h1>
      <Card className="divide-y divide-line">
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
    </div>
  );
}
