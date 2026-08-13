import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { PenLine } from "lucide-react";
import { FORMAT_LABEL } from "@/lib/labels";

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const [profile, recentContents] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.content.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="font-display text-3xl text-ink mb-2">
          Hola, {profile?.displayName?.split(" ")[0] ?? ""}
        </h1>
        <p className="text-ink-muted mb-5">¿Qué querés crear hoy?</p>
        <Link href="/dashboard/create">
          <Button size="lg">
            <PenLine size={18} />
            Crear contenido
          </Button>
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-ink-muted uppercase tracking-wide mb-3">
          Tus últimos contenidos
        </h2>
        {recentContents.length === 0 ? (
          <Card className="text-sm text-ink-muted">
            Todavía no creaste ningún contenido. Cuando generes el primero, va a aparecer acá.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {recentContents.map((c) => (
              <Link key={c.id} href={`/dashboard/library/${c.id}`}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                  <div className="text-xs text-ink-muted mb-2">
                    {c.format ? FORMAT_LABEL[c.format] : "Sin formato"}
                  </div>
                  <div className="font-medium text-sm mb-3 line-clamp-2">
                    {c.title ?? "Contenido sin título"}
                  </div>
                  {c.riskLevel && <RiskBadge level={c.riskLevel} />}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-ink-muted uppercase tracking-wide mb-3">
          Ideas para vos
        </h2>
        <Card className="text-sm text-ink-muted">
          Esta sección va a sugerir temas a partir de tu especialidad una vez que generes tus
          primeros contenidos.
        </Card>
      </section>
    </div>
  );
}
