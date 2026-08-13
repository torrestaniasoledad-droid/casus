import { RiskBadge } from "@/components/ui/RiskBadge";
import { Card } from "@/components/ui/Card";

type Risk = "BAJO" | "REVISAR" | "ALTO";

export function RiskSummary({ level, explanation }: { level: Risk; explanation: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-ink">Nivel de riesgo</span>
        <RiskBadge level={level} />
      </div>
      <p className="text-sm text-ink-muted mb-3">{explanation}</p>
      <p className="text-xs text-ink-muted border-t border-line pt-3">
        CASUS utiliza criterios automatizados de protección y desidentificación. Revisá
        siempre el contenido antes de publicarlo.
      </p>
    </Card>
  );
}
