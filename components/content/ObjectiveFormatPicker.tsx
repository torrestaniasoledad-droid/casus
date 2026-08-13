"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export type Objective = "EDUCAR" | "AUTORIDAD" | "CONSULTAS" | "INTERACCION" | "CONFIANZA";
export type Format = "REEL" | "CARRUSEL" | "POST" | "STORIES";

const OBJECTIVES: { value: Objective; label: string }[] = [
  { value: "EDUCAR", label: "Educar" },
  { value: "AUTORIDAD", label: "Generar autoridad" },
  { value: "CONSULTAS", label: "Conseguir consultas" },
  { value: "INTERACCION", label: "Aumentar interacción" },
  { value: "CONFIANZA", label: "Generar confianza" },
];

const FORMATS: { value: Format; label: string }[] = [
  { value: "REEL", label: "Reel" },
  { value: "CARRUSEL", label: "Carrusel" },
  { value: "POST", label: "Post" },
  { value: "STORIES", label: "Stories" },
];

export function ObjectiveFormatPicker({
  objective,
  format,
  onObjectiveChange,
  onFormatChange,
  onSubmit,
  loading,
  loadingLabel,
}: {
  objective: Objective | null;
  format: Format | null;
  onObjectiveChange: (o: Objective) => void;
  onFormatChange: (f: Format) => void;
  onSubmit: () => void;
  loading: boolean;
  loadingLabel: string;
}) {
  return (
    <Card>
      <div className="mb-4">
        <div className="text-sm font-medium text-ink mb-2">Objetivo</div>
        <div className="grid grid-cols-2 gap-2">
          {OBJECTIVES.map((o) => (
            <button
              key={o.value}
              type="button"
              disabled={loading}
              onClick={() => onObjectiveChange(o.value)}
              className={`text-left text-sm rounded-md border px-3 py-2 transition-colors ${
                objective === o.value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line text-ink-muted hover:bg-primary-soft/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <div className="text-sm font-medium text-ink mb-2">Formato</div>
        <div className="grid grid-cols-4 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              disabled={loading}
              onClick={() => onFormatChange(f.value)}
              className={`text-sm rounded-md border px-2 py-2 transition-colors ${
                format === f.value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line text-ink-muted hover:bg-primary-soft/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={onSubmit} disabled={!objective || !format || loading} className="w-full">
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? loadingLabel : "Generar contenido"}
      </Button>
    </Card>
  );
}
