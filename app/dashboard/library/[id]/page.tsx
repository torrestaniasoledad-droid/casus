import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { RiskSummary } from "@/components/content/RiskSummary";
import { ContentEditor } from "@/components/content/ContentEditor";
import { EditorialPlanningCard } from "@/components/content/EditorialPlanningCard";
import { FORMAT_LABEL, OBJECTIVE_LABEL } from "@/lib/labels";
import { dateColumnToCalendarDateString } from "@/lib/dateOnly";
import { ArrowLeft, FileText } from "lucide-react";

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
          {content.objective ? OBJECTIVE_LABEL[content.objective] : "Sin objetivo"} ·{" "}
          {content.createdAt.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
        <h1 className="font-display text-2xl text-ink">
          {content.title ?? "Contenido sin título"}
        </h1>
      </div>

      {content.deidentifiedInput && (
        <details className="mb-5 group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-ink list-none select-none">
            <FileText size={16} className="text-ink-muted" />
            Ver lo que escribiste (ya protegido)
            <span className="text-ink-muted text-xs ml-auto group-open:hidden">Mostrar</span>
            <span className="text-ink-muted text-xs ml-auto hidden group-open:inline">Ocultar</span>
          </summary>
          <Card className="mt-2">
            <p className="text-sm text-ink-muted whitespace-pre-wrap">{content.deidentifiedInput}</p>
            {content.clinicalLearning && (
              <>
                <div className="text-xs text-ink-muted uppercase tracking-wide mt-4 mb-1">
                  Aprendizaje extraído
                </div>
                <p className="text-sm text-ink-muted">{content.clinicalLearning}</p>
              </>
            )}
            <p className="text-xs text-ink-muted mt-4 pt-3 border-t border-line">
              Este es el texto ya desidentificado que usó CASUS — así podés revisar si te
              olvidaste de algo. Por privacidad, el texto original que escribiste no queda
              guardado.
            </p>
          </Card>
        </details>
      )}

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

      <EditorialPlanningCard
        contentId={content.id}
        editorialStatus={content.editorialStatus}
        scheduledFor={content.scheduledFor ? dateColumnToCalendarDateString(content.scheduledFor) : null}
        channel={content.channel}
        editorialNote={content.editorialNote}
      />

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
          createdAt={content.createdAt.toISOString()}
        />
      ) : (
        <Card className="text-sm text-ink-muted">
          Este contenido todavía no tiene una versión generada.
        </Card>
      )}
    </div>
  );
}
