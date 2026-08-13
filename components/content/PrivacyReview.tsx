import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";

const CATEGORY_LABEL: Record<string, string> = {
  nombre: "Nombre",
  edad: "Edad",
  institucion: "Institución",
  ubicacion: "Ubicación",
  fecha: "Fecha",
  relacion: "Relación familiar",
  otro: "Otro dato",
};

export interface DetectedItem {
  category: string;
  original_excerpt: string;
  action: "eliminado" | "generalizado";
  replacement: string | null;
}

export function PrivacyReview({ items }: { items: DetectedItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="flex items-center gap-3 bg-ok-soft border-ok/20">
        <ShieldCheck size={20} className="text-ok shrink-0" />
        <p className="text-sm text-ink">
          No detectamos datos identificables en tu texto. Aun así, revisalo antes de publicar.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={18} className="text-primary" />
        <h3 className="font-medium text-sm text-ink">Protección de identidad</h3>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <Card key={i} className="bg-accent-soft/60 border-accent/20 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-ink-muted mb-1">
                  {CATEGORY_LABEL[item.category] ?? "Dato"} detectado
                </div>
                <div className="font-mono-data text-sm text-ink line-through decoration-accent/60">
                  {item.original_excerpt}
                </div>
              </div>
              <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-accent bg-surface border border-accent/30 rounded-full px-2.5 py-1">
                {item.action === "eliminado" ? "Eliminado" : "Generalizado"}
              </span>
            </div>
            {item.action === "generalizado" && item.replacement && (
              <div className="mt-2 text-sm text-primary">→ {item.replacement}</div>
            )}
          </Card>
        ))}
      </div>
      <p className="text-xs text-ink-muted mt-3">
        Tu contenido fue desidentificado antes de generar la publicación.
      </p>
    </div>
  );
}
