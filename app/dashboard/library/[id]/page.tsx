import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { RiskSummary } from "@/components/content/RiskSummary";
import { ContentEditor } from "@/components/content/ContentEditor";
import { FORMAT_LABEL, OBJECTIVE_LABEL } from "@/lib/labels";
import { ArrowLeft } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  nombre: "Nombre",
  edad: "Edad",
  institucion: "Institución",
  ubicacion: "Ubicación",
  fecha: "Fecha",
  relacion: "Relación familiar",
  otro: "Otro dato",
};

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const content = await prisma.content.findUnique({
    where: { id: params.id },
    include: {
      versions: { orderBy: { createdAt: "desc" } },
      privacyFlags: true,
    },
  });

  if (!content || content.userId !== userId) notFound();

  const latest = content.versions[0];

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/library"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-primary mb-4"
      >
        <ArrowLeft size={16} /> Volver a la biblioteca
      </Link>

      <div className="mb-6">
        <div className="text-xs text-ink-muted mb-1">
          {content.format ? FORMAT_LABEL[content.format] : "Sin formato"} ·{" "}
          {content.objective ? OBJECTIVE_LABEL[content.objective] : "Sin objetivo"}
        </div>
        <h1 className="font-display text-2xl text-ink">
          {content.title ?? "Contenido sin título"}
        </h1>
      </div>

      {content.riskLevel && (
        <div className="mb-5">
          <RiskSummary
            level={content.riskLevel}
            explanation="Nivel de riesgo evaluado al momento de crear este contenido."
          />
        </div>
      )}

      {content.privacyFlags.length > 0 && (
        <Card className="mb-5">
          <div className="text-sm font-medium text-ink mb-3">Datos protegidos en este contenido</div>
          <div className="flex flex-col gap-2">
            {content.privacyFlags.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">{CATEGORY_LABEL[flag.category] ?? flag.category}</span>
                <span className="text-xs font-medium uppercase text-accent">
                  {flag.action === "eliminado" ? "Eliminado" : `→ ${flag.replacement}`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {latest && content.format ? (
        <ContentEditor
          contentId={content.id}
          format={content.format}
          title={content.title}
          hook={latest.hook}
          script={latest.script}
          caption={latest.caption}
          cta={latest.cta}
          hashtags={latest.hashtags}
        />
      ) : (
        <Card className="text-sm text-ink-muted">
          Este contenido todavía no tiene una versión generada.
        </Card>
      )}
    </div>
  );
}
